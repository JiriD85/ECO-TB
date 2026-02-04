#!/usr/bin/env python3
"""
ECO Smart Diagnostics - Migration Tool

Funktionen:
- Alle Projects und Measurements abfragen
- VR Devices erkennen
- Daten sichern (Backup)
- Migration pro Project durchführen (Attribute + Telemetrie)
- Resume bei Unterbrechung
- Rollback bei Problemen

Usage:
    python tb_migration.py scan                              # Scan alle Projects/Measurements
    python tb_migration.py migrate <project_name>            # Dry-Run Migration
    python tb_migration.py migrate <project_name> --execute  # Echte Migration
    python tb_migration.py migrate-all                       # Dry-Run ALLE Projects
    python tb_migration.py migrate-all --execute             # Echte Migration ALLER Projects
    python tb_migration.py resume <project_name>             # Unterbrochene Migration fortsetzen
    python tb_migration.py status <project_name>             # Migrations-Status anzeigen
    python tb_migration.py rollback <project_name>           # Rollback aus Backup
    python tb_migration.py backups                           # Alle Backups auflisten
"""

import os
import sys
import json
import logging
import logging.handlers
import requests
from datetime import datetime
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load .env from parent directory
load_dotenv(Path(__file__).parent.parent / '.env')

# Configuration
TB_BASE_URL = os.getenv('TB_BASE_URL', '').rstrip('/')
TB_USERNAME = os.getenv('TB_USERNAME')
TB_PASSWORD = os.getenv('TB_PASSWORD')

BACKUP_DIR = Path(__file__).parent / 'backups'
MIGRATION_LOG = Path(__file__).parent / 'migration_log.json'
LOG_DIR = Path(__file__).parent / 'logs'
LOG_FILE = LOG_DIR / 'migration.log'
LOG_MAX_SIZE = 1 * 1024 * 1024 * 1024  # 1 GB
LOG_BACKUP_COUNT = 2  # Keep 2 old logs (migration.log.1, migration.log.2)

# =============================================================================
# Logging Setup
# =============================================================================
def setup_logging():
    """Setup rotating file logger (max 1GB per file, keeps 2 backups)"""
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger('migration')
    logger.setLevel(logging.DEBUG)

    # Rotating file handler (1GB max, 2 backups = max 3GB total)
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_FILE,
        maxBytes=LOG_MAX_SIZE,
        backupCount=LOG_BACKUP_COUNT,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)

    # Format: timestamp - level - message
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    return logger

# Initialize logger
log = setup_logging()

# =============================================================================
# Exclude List - Projects/Measurements to skip (RoomKit, LoRaWAN, etc.)
# =============================================================================
EXCLUDE_MEASUREMENTS = [
    'BCH_1_6',  # RoomKit / LoRaWAN measurement
]

# Projects to completely skip (add project names here if needed)
EXCLUDE_PROJECTS = []

# =============================================================================
# Telemetry Key Mapping (same as normalize_data.tbel)
# =============================================================================
# Base keys that are always mapped
TELEMETRY_KEY_MAP_BASE = {
    # Temperature keys
    'CHC_S_TemperatureFlow': 'T_flow_C',
    'CHC_S_TemperatureReturn': 'T_return_C',
    'CHC_S_TemperatureDiff': 'dT_K',
    # Flow keys
    'CHC_S_VolumeFlow': 'Vdot_m3h',  # Needs conversion: ÷1000 (l/h → m³/h)
    'CHC_S_Velocity': 'v_ms',
    # Volume
    'CHC_M_Volume': 'V_m3',
}

# Keys specific to heating installations
TELEMETRY_KEY_MAP_HEATING = {
    'CHC_S_Power_Heating': 'P_th_kW',
    'CHC_M_Energy_Heating': 'E_th_kWh',
}

# Keys specific to cooling installations
TELEMETRY_KEY_MAP_COOLING = {
    'CHC_S_Power_Cooling': 'P_th_kW',
    'CHC_M_Energy_Cooling': 'E_th_kWh',
}


def get_telemetry_key_map(installation_type: str) -> dict:
    """Get the telemetry key map based on installation type"""
    key_map = TELEMETRY_KEY_MAP_BASE.copy()
    if installation_type == 'cooling':
        key_map.update(TELEMETRY_KEY_MAP_COOLING)
    else:
        # Default to heating
        key_map.update(TELEMETRY_KEY_MAP_HEATING)
    return key_map

# Keys that need unit conversion (values come as strings from API!)
TELEMETRY_CONVERSIONS = {
    'CHC_S_VolumeFlow': lambda x: float(x) / 1000,  # l/h → m³/h
}

# Temperature sensor key (mapped based on device name suffix)
TEMP_SENSOR_KEY = 'temperature'


class ThingsBoardAPI:
    """ThingsBoard API Client"""

    def __init__(self):
        self.base_url = TB_BASE_URL
        self.token = None
        self.refresh_token = None

    def login(self) -> bool:
        """Authenticate and get JWT token"""
        url = f"{self.base_url}/api/auth/login"
        payload = {"username": TB_USERNAME, "password": TB_PASSWORD}

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            self.token = data.get('token')
            self.refresh_token = data.get('refreshToken')
            log.info(f"Login successful for {TB_USERNAME}")
            return True
        except Exception as e:
            log.error(f"Login failed: {e}")
            print(f"❌ Login failed: {e}")
            return False

    def _headers(self) -> dict:
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def get(self, endpoint: str, params: dict = None) -> Optional[dict]:
        """GET request"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.get(url, headers=self._headers(), params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            log.error(f"GET {endpoint} failed: {e}")
            print(f"❌ GET {endpoint} failed: {e}")
            return None

    def post(self, endpoint: str, data: dict = None) -> Optional[dict]:
        """POST request"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.post(url, headers=self._headers(), json=data)
            response.raise_for_status()
            # Handle empty responses (e.g., telemetry upload returns 200 with no body)
            if response.status_code == 200 and not response.text:
                return {}
            return response.json()
        except requests.exceptions.JSONDecodeError:
            # Successful but no JSON response
            return {}
        except Exception as e:
            log.error(f"POST {endpoint} failed: {e}")
            print(f"❌ POST {endpoint} failed: {e}")
            return None

    def delete(self, endpoint: str) -> bool:
        """DELETE request"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.delete(url, headers=self._headers())
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"❌ DELETE {endpoint} failed: {e}")
            return False


class MigrationTool:
    """Migration Tool for ECO Smart Diagnostics"""

    def __init__(self):
        self.api = ThingsBoardAPI()
        self.projects = []
        self.measurements = []

    def connect(self) -> bool:
        """Connect to ThingsBoard"""
        print(f"🔌 Connecting to {TB_BASE_URL}...")
        if self.api.login():
            print("✅ Connected")
            return True
        return False

    # =========================================================================
    # SCAN - Query all Projects and Measurements
    # =========================================================================

    def scan(self):
        """Scan all Projects and Measurements, detect VR devices"""
        print("\n📊 Scanning Projects and Measurements...\n")

        # Get all customers first
        customers = self._get_all_customers()
        if not customers:
            print("❌ No customers found")
            return

        all_projects = []
        all_measurements = []
        total_customers = len(customers)

        for i, customer in enumerate(customers, 1):
            customer_id = customer['id']['id']
            customer_name = customer['name']

            # Progress bar for customers
            self._print_progress(i, total_customers, f"Customer: {customer_name[:30]:<30}")

            # Get projects for this customer
            projects = self._get_assets_by_type(customer_id, 'Project')
            measurements = self._get_assets_by_type(customer_id, 'Measurement')

            for j, project in enumerate(projects, 1):
                project['customerName'] = customer_name
                project['vr_devices'] = self._find_vr_devices(project)
                project['measurements'] = self._get_project_measurements(project['id']['id'], measurements)
                all_projects.append(project)

            for measurement in measurements:
                measurement['customerName'] = customer_name
                measurement['vr_devices'] = self._find_vr_devices(measurement)
                all_measurements.append(measurement)

        # Clear progress line
        print("\r" + " " * 80 + "\r", end="")
        print(f"✅ Scanned {total_customers} customers, {len(all_projects)} projects, {len(all_measurements)} measurements\n")

        self.projects = all_projects
        self.measurements = all_measurements

        # Print summary
        self._print_scan_summary()

    def _print_progress(self, current: int, total: int, label: str = ""):
        """Print a progress bar"""
        bar_length = 30
        progress = current / total
        filled = int(bar_length * progress)
        bar = "█" * filled + "░" * (bar_length - filled)
        percent = int(progress * 100)
        print(f"\r[{bar}] {percent:3d}% ({current}/{total}) {label}", end="", flush=True)

    def _get_all_customers(self) -> list:
        """Get all customers"""
        customers = []
        page = 0
        page_size = 100

        while True:
            result = self.api.get(f"/api/customers", params={
                "pageSize": page_size,
                "page": page
            })
            if not result or not result.get('data'):
                break

            customers.extend(result['data'])

            if not result.get('hasNext', False):
                break
            page += 1

        return customers

    def _get_assets_by_type(self, customer_id: str, asset_type: str) -> list:
        """Get assets by type for a customer"""
        assets = []
        page = 0
        page_size = 100

        while True:
            result = self.api.get(f"/api/customer/{customer_id}/assets", params={
                "pageSize": page_size,
                "page": page,
                "type": asset_type
            })
            if not result or not result.get('data'):
                break

            assets.extend(result['data'])

            if not result.get('hasNext', False):
                break
            page += 1

        return assets

    def _find_vr_devices(self, asset: dict) -> list:
        """Find VR devices related to an asset via 'Measurement VR' relation type"""
        asset_id = asset['id']['id']
        vr_devices = []

        # Get relations FROM this asset with type "Measurement VR"
        relations = self.api.get(f"/api/relations", params={
            "fromId": asset_id,
            "fromType": "ASSET",
            "relationType": "Measurement VR"
        })

        if relations:
            for rel in relations:
                if rel.get('to', {}).get('entityType') == 'DEVICE':
                    device_id = rel['to']['id']
                    device = self.api.get(f"/api/device/{device_id}")
                    if device:
                        vr_devices.append({
                            'id': device_id,
                            'name': device.get('name'),
                            'relation_type': rel.get('type')
                        })

        return vr_devices

    def _get_project_measurements(self, project_id: str, all_measurements: list) -> list:
        """Get measurements that belong to a project"""
        project_measurements = []

        # Get relations FROM this project (Owns -> Measurement)
        relations = self.api.get(f"/api/relations", params={
            "fromId": project_id,
            "fromType": "ASSET"
        })

        if relations:
            measurement_ids = [
                rel['to']['id'] for rel in relations
                if rel.get('to', {}).get('entityType') == 'ASSET'
                and rel.get('type') == 'Owns'
            ]

            for m in all_measurements:
                if m['id']['id'] in measurement_ids:
                    project_measurements.append(m)

        return project_measurements

    def _print_scan_summary(self):
        """Print scan summary"""
        print("=" * 70)
        print("SCAN RESULTS")
        print("=" * 70)

        total_vr = 0

        for project in self.projects:
            vr_count = len(project.get('vr_devices', []))
            measurement_vr_count = sum(
                len(m.get('vr_devices', []))
                for m in project.get('measurements', [])
            )
            total_project_vr = vr_count + measurement_vr_count
            total_vr += total_project_vr

            status = "🔴 VR" if total_project_vr > 0 else "✅ OK"

            print(f"\n{status} [{project['customerName']}] {project['name']}")
            print(f"   ID: {project['id']['id']}")
            print(f"   Measurements: {len(project.get('measurements', []))}")

            if vr_count > 0:
                print(f"   ⚠️  Project VR Devices: {vr_count}")
                for vr in project.get('vr_devices', []):
                    print(f"      - {vr['name']}")

            for m in project.get('measurements', []):
                m_vr_count = len(m.get('vr_devices', []))
                m_status = "🔴" if m_vr_count > 0 else "✅"
                print(f"   {m_status} {m['name']}")
                if m_vr_count > 0:
                    for vr in m.get('vr_devices', []):
                        print(f"      ⚠️  VR: {vr['name']}")

        print("\n" + "=" * 70)
        print(f"SUMMARY: {len(self.projects)} Projects, {len(self.measurements)} Measurements")
        print(f"         {total_vr} VR Devices found")
        print("=" * 70)

    # =========================================================================
    # BACKUP - Save project data before migration
    # =========================================================================

    def backup(self, project_name: str):
        """Backup a project and its measurements"""
        print(f"\n💾 Creating backup for project: {project_name}\n")

        # Find project
        project = self._find_project_by_name(project_name)
        if not project:
            print(f"❌ Project '{project_name}' not found")
            return False

        # Create backup directory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = BACKUP_DIR / f"{project_name}_{timestamp}"
        backup_path.mkdir(parents=True, exist_ok=True)

        backup_data = {
            'timestamp': timestamp,
            'project_name': project_name,
            'project_id': project['id']['id'],
            'project': {},
            'measurements': [],
            'vr_devices': [],
            'telemetry': {}
        }

        # Backup project
        print(f"📁 Backing up project: {project['name']}")
        backup_data['project'] = self._backup_entity(project['id']['id'], 'ASSET')

        # Get measurements
        measurements = project.get('measurements', [])
        if not measurements:
            # Re-fetch if not in cache
            self.scan()
            project = self._find_project_by_name(project_name)
            measurements = project.get('measurements', [])

        # Backup measurements
        for m in measurements:
            print(f"📁 Backing up measurement: {m['name']}")
            m_backup = self._backup_entity(m['id']['id'], 'ASSET')
            backup_data['measurements'].append(m_backup)

            # Backup VR devices telemetry
            for vr in m.get('vr_devices', []):
                print(f"   📁 Backing up VR device telemetry: {vr['name']}")
                vr_telemetry = self._backup_telemetry(vr['id'], 'DEVICE')
                backup_data['vr_devices'].append({
                    'device': vr,
                    'telemetry_keys': vr_telemetry.get('keys', [])
                })
                backup_data['telemetry'][vr['id']] = vr_telemetry

        # Save backup
        backup_file = backup_path / 'backup.json'
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Backup saved to: {backup_path}")
        print(f"   - Project: 1")
        print(f"   - Measurements: {len(backup_data['measurements'])}")
        print(f"   - VR Devices: {len(backup_data['vr_devices'])}")

        return True

    def _find_project_by_name(self, name: str) -> Optional[dict]:
        """Find project by name"""
        if not self.projects:
            self.scan()

        for project in self.projects:
            if project['name'] == name:
                return project
        return None

    def _backup_entity(self, entity_id: str, entity_type: str) -> dict:
        """Backup an entity (attributes, relations)"""
        backup = {
            'id': entity_id,
            'type': entity_type,
            'attributes': {},
            'relations': []
        }

        # Get entity details
        if entity_type == 'ASSET':
            entity = self.api.get(f"/api/asset/{entity_id}")
        elif entity_type == 'DEVICE':
            entity = self.api.get(f"/api/device/{entity_id}")
        else:
            entity = None

        if entity:
            backup['entity'] = entity

        # Get attributes (all scopes)
        for scope in ['SERVER_SCOPE', 'SHARED_SCOPE', 'CLIENT_SCOPE']:
            attrs = self.api.get(
                f"/api/plugins/telemetry/{entity_type}/{entity_id}/values/attributes/{scope}"
            )
            if attrs:
                backup['attributes'][scope] = attrs

        # Get relations
        relations_from = self.api.get(f"/api/relations", params={
            "fromId": entity_id,
            "fromType": entity_type
        })
        relations_to = self.api.get(f"/api/relations", params={
            "toId": entity_id,
            "toType": entity_type
        })

        backup['relations'] = {
            'from': relations_from or [],
            'to': relations_to or []
        }

        return backup

    def _backup_telemetry(self, entity_id: str, entity_type: str) -> dict:
        """Backup telemetry keys (not values - too much data)"""
        backup = {
            'id': entity_id,
            'type': entity_type,
            'keys': []
        }

        # Get telemetry keys
        keys = self.api.get(
            f"/api/plugins/telemetry/{entity_type}/{entity_id}/keys/timeseries"
        )
        if keys:
            backup['keys'] = keys

        return backup

    # =========================================================================
    # MIGRATE - Perform migration
    # =========================================================================

    def migrate(self, project_name: str, dry_run: bool = True):
        """Migrate a project (attributes, telemetry) with automatic backup"""
        print(f"\n🚀 {'[DRY RUN] ' if dry_run else ''}Migrating project: {project_name}\n")

        # Find project
        project = self._find_project_by_name(project_name)
        if not project:
            print(f"❌ Project '{project_name}' not found")
            return False

        # Create backup directory (always, even for dry run)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = BACKUP_DIR / f"{project_name}_{timestamp}"
        backup_path.mkdir(parents=True, exist_ok=True)

        backup_data = {
            'timestamp': timestamp,
            'project_name': project_name,
            'project_id': project['id']['id'],
            'dry_run': dry_run,
            'project': {},
            'measurements': [],
            'telemetry_backup': {}  # {measurement_name: {vr_device_id: {key: [(ts, val), ...]}}}
        }

        # Migration state tracking for resume capability
        state_file = backup_path / 'migration_state.json'
        state = {
            'status': 'in_progress',
            'started_at': timestamp,
            'project_name': project_name,
            'dry_run': dry_run,
            'completed_measurements': [],
            'current_measurement': None,
            'completed_vr_devices': {},  # {measurement_name: [vr_device_ids]}
            'errors': []
        }
        self._save_state(state_file, state)

        # Migration steps
        print("📋 Migration Plan (with automatic backup):")
        print("   1. Backup + Migrate Project attributes")
        print("   2. For each Measurement:")
        print("      a. Backup + Migrate attributes")
        print("      b. Read VR telemetry → Backup → Transform → Write to Measurement")
        print("")

        # Migrate Project (with backup)
        backup_data['project'] = self._migrate_project_attributes(project, dry_run)

        # Migrate Measurements (with backup)
        measurements = project.get('measurements', [])
        total_measurements = len(measurements)

        for i, m in enumerate(measurements, 1):
            m_name = m['name']
            print(f"\n📦 [{i}/{total_measurements}] Measurement: {m_name}")

            # Update state: current measurement
            state['current_measurement'] = m_name
            self._save_state(state_file, state)

            try:
                # Migrate attributes and telemetry, collect backup data
                m_backup, telemetry_backup = self._migrate_measurement_with_backup(
                    m, dry_run, state, state_file
                )
                backup_data['measurements'].append(m_backup)
                if telemetry_backup:
                    backup_data['telemetry_backup'][m_name] = telemetry_backup

                # Mark measurement as completed
                state['completed_measurements'].append(m_name)
                state['current_measurement'] = None
                self._save_state(state_file, state)

            except Exception as e:
                error_msg = f"Error migrating {m_name}: {str(e)}"
                log.error(error_msg, exc_info=True)
                print(f"   ❌ {error_msg}")
                state['errors'].append(error_msg)
                self._save_state(state_file, state)
                # Continue with next measurement

        # Save backup file
        backup_file = backup_path / 'backup.json'
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)

        # Mark migration as completed
        state['status'] = 'completed' if not state['errors'] else 'completed_with_errors'
        state['completed_at'] = datetime.now().strftime("%Y%m%d_%H%M%S")
        self._save_state(state_file, state)

        print(f"\n💾 Backup saved to: {backup_path}")

        if dry_run:
            print("\n⚠️  This was a DRY RUN. No changes were made to ThingsBoard.")
            print("   Run with --execute to apply changes.")
        else:
            print("\n✅ Migration completed")

        return True

    # =========================================================================
    # MIGRATE ALL - Batch migration of all projects
    # =========================================================================

    def migrate_all(self, dry_run: bool = True):
        """Migrate ALL projects (excluding configured exclusions)"""
        log.info("=" * 70)
        log.info(f"BATCH MIGRATION STARTED - dry_run={dry_run}")
        log.info("=" * 70)

        print(f"\n{'='*70}")
        print(f"{'[DRY RUN] ' if dry_run else ''}BATCH MIGRATION - ALL PROJECTS")
        print(f"{'='*70}\n")

        # First, scan to get all projects
        self.scan()

        if not self.projects:
            print("❌ No projects found")
            return False

        # Load migration log to check already completed projects
        migration_log = self._load_migration_log()

        # Filter projects
        projects_to_migrate = []
        skipped_excluded = []
        skipped_completed = []
        skipped_no_vr = []

        for project in self.projects:
            project_name = project['name']

            # Check exclusions
            if project_name in EXCLUDE_PROJECTS:
                skipped_excluded.append(project_name)
                continue

            # Check if all measurements are excluded
            measurements = project.get('measurements', [])
            non_excluded_measurements = [
                m for m in measurements
                if m['name'] not in EXCLUDE_MEASUREMENTS
            ]

            if not non_excluded_measurements:
                skipped_excluded.append(f"{project_name} (all measurements excluded)")
                continue

            # Check if already migrated (only in execute mode)
            if not dry_run and project_name in migration_log.get('completed_projects', []):
                skipped_completed.append(project_name)
                continue

            # Count VR devices for info display
            has_vr = any(m.get('vr_devices') for m in non_excluded_measurements)
            if not has_vr:
                skipped_no_vr.append(project_name)
                # Note: Still migrate! Attributes need migration, telemetry keys may need renaming

            projects_to_migrate.append(project)

        # Print summary before starting
        print(f"📊 Migration Summary:")
        print(f"   Total projects scanned: {len(self.projects)}")
        print(f"   Projects to migrate: {len(projects_to_migrate)}")
        print(f"   Skipped (excluded): {len(skipped_excluded)}")
        print(f"   Skipped (already done): {len(skipped_completed)}")
        print(f"   Without VR devices (will rename keys): {len(skipped_no_vr)}")
        print()

        if skipped_excluded:
            print(f"   ⏭️  Excluded: {', '.join(skipped_excluded)}")
        if skipped_completed:
            print(f"   ✅ Already done: {', '.join(skipped_completed)}")
        if skipped_no_vr:
            print(f"   🔄 No VR (direct copy): {', '.join(skipped_no_vr)}")

        if not projects_to_migrate:
            print("\n✅ Nothing to migrate!")
            return True

        print(f"\n📋 Projects to migrate:")
        for i, p in enumerate(projects_to_migrate, 1):
            vr_count = sum(len(m.get('vr_devices', [])) for m in p.get('measurements', []))
            print(f"   {i}. {p['name']} ({len(p.get('measurements', []))} measurements, {vr_count} VR devices)")

        print()

        # Track results
        results = {
            'started_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'dry_run': dry_run,
            'successful': [],
            'failed': [],
            'skipped_measurements': []
        }

        # Migrate each project
        total_projects = len(projects_to_migrate)
        for i, project in enumerate(projects_to_migrate, 1):
            project_name = project['name']

            # Refresh token before each project to prevent 401 errors
            if i > 1:
                print(f"\n🔑 Refreshing authentication token...")
                if not self.api.login():
                    log.error(f"Token refresh failed before {project_name}")
                    print(f"⚠️  Token refresh failed, continuing with existing token")

            print(f"\n{'='*70}")
            print(f"[{i}/{total_projects}] PROJECT: {project_name}")
            print(f"{'='*70}")

            try:
                # Filter out excluded measurements before migration
                original_measurements = project.get('measurements', [])
                filtered_measurements = [
                    m for m in original_measurements
                    if m['name'] not in EXCLUDE_MEASUREMENTS
                ]

                # Track skipped measurements
                for m in original_measurements:
                    if m['name'] in EXCLUDE_MEASUREMENTS:
                        results['skipped_measurements'].append({
                            'project': project_name,
                            'measurement': m['name'],
                            'reason': 'excluded'
                        })
                        print(f"   ⏭️  Skipping measurement: {m['name']} (excluded)")

                # Temporarily replace measurements list
                project['measurements'] = filtered_measurements

                # Run migration
                success = self.migrate(project_name, dry_run=dry_run)

                # Restore original measurements
                project['measurements'] = original_measurements

                if success:
                    results['successful'].append(project_name)
                    log.info(f"SUCCESS: {project_name}")
                    if not dry_run:
                        # Update migration log
                        if project_name not in migration_log.get('completed_projects', []):
                            migration_log.setdefault('completed_projects', []).append(project_name)
                            self._save_migration_log(migration_log)
                else:
                    log.error(f"FAILED: {project_name} - Migration returned False")
                    results['failed'].append({'project': project_name, 'error': 'Migration returned False'})

            except Exception as e:
                error_msg = str(e)
                log.error(f"FAILED: {project_name} - {error_msg}", exc_info=True)
                print(f"\n❌ ERROR migrating {project_name}: {error_msg}")
                results['failed'].append({'project': project_name, 'error': error_msg})
                # Continue with next project

        # Print final summary
        results['completed_at'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        log.info("=" * 70)
        log.info(f"BATCH MIGRATION COMPLETE - Successful: {len(results['successful'])}, Failed: {len(results['failed'])}")
        log.info("=" * 70)

        print(f"\n{'='*70}")
        print("BATCH MIGRATION COMPLETE")
        print(f"{'='*70}")
        print(f"\n📊 Results:")
        print(f"   ✅ Successful: {len(results['successful'])}")
        print(f"   ❌ Failed: {len(results['failed'])}")
        print(f"   ⏭️  Skipped measurements: {len(results['skipped_measurements'])}")

        if results['successful']:
            print(f"\n   Successful projects:")
            for p in results['successful']:
                print(f"      ✅ {p}")

        if results['failed']:
            print(f"\n   Failed projects:")
            for f in results['failed']:
                print(f"      ❌ {f['project']}: {f['error']}")

        if results['skipped_measurements']:
            print(f"\n   Skipped measurements:")
            for s in results['skipped_measurements']:
                print(f"      ⏭️  {s['project']}/{s['measurement']}: {s['reason']}")

        # Save results to file
        results_file = BACKUP_DIR / f"batch_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        results_file.parent.mkdir(parents=True, exist_ok=True)
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n📁 Results saved to: {results_file}")

        if dry_run:
            print("\n⚠️  This was a DRY RUN. No changes were made to ThingsBoard.")
            print("   Run with --execute to apply changes.")

        return len(results['failed']) == 0

    def _load_migration_log(self) -> dict:
        """Load migration log (tracks completed projects)"""
        if MIGRATION_LOG.exists():
            with open(MIGRATION_LOG, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'completed_projects': [], 'started_at': datetime.now().isoformat()}

    def _save_migration_log(self, log: dict):
        """Save migration log"""
        log['updated_at'] = datetime.now().isoformat()
        with open(MIGRATION_LOG, 'w', encoding='utf-8') as f:
            json.dump(log, f, indent=2, ensure_ascii=False)

    def _migrate_project_attributes(self, project: dict, dry_run: bool) -> dict:
        """Migrate project attributes, returns backup data"""
        project_id = project['id']['id']
        print(f"\n📦 Project: {project['name']}")

        # Get current attributes (this is our backup)
        attrs = self.api.get(
            f"/api/plugins/telemetry/ASSET/{project_id}/values/attributes/SERVER_SCOPE"
        )
        if not attrs:
            attrs = []

        backup = {
            'id': project_id,
            'name': project['name'],
            'attributes_backup': attrs
        }

        attr_dict = {a['key']: a['value'] for a in attrs}

        # Migration: standardOutsideTemperature → normOutdoorTemp
        if 'standardOutsideTemperature' in attr_dict:
            print(f"   📝 standardOutsideTemperature → normOutdoorTemp: {attr_dict['standardOutsideTemperature']}")
            if not dry_run:
                self._save_attribute(project_id, 'ASSET', 'normOutdoorTemp', attr_dict['standardOutsideTemperature'])

        return backup

    def _migrate_measurement_with_backup(self, measurement: dict, dry_run: bool,
                                          state: dict = None, state_file: Path = None) -> tuple:
        """Migrate a measurement with backup, returns (attribute_backup, telemetry_backup)"""
        m_id = measurement['id']['id']
        m_name = measurement['name']

        # Get current attributes (this is our backup)
        attrs = self.api.get(
            f"/api/plugins/telemetry/ASSET/{m_id}/values/attributes/SERVER_SCOPE"
        )
        if not attrs:
            attrs = []

        backup = {
            'id': m_id,
            'name': m_name,
            'attributes_backup': attrs
        }

        attr_dict = {a['key']: a['value'] for a in attrs}

        # Attribute migrations
        migrations = [
            ('installationTypeOptions', 'systemType'),
            ('deltaT', 'designDeltaT'),
            ('deltaTAnalysisFloorVolume', 'flowOnThreshold'),
            ('dimension', 'pipeDimension'),
            ('nominalFlow', 'designFlow'),
            ('sensorLabel1', 'auxSensor1'),
            ('sensorLabel2', 'auxSensor2'),
        ]

        migrated_attrs = []
        for old_key, new_key in migrations:
            if old_key in attr_dict:
                value = attr_dict[old_key]

                # Special handling for sensorLabel → auxSensor (JSON)
                if old_key.startswith('sensorLabel') and isinstance(value, str):
                    value = {'label': value, 'location': 'custom'}

                print(f"   📝 {old_key} → {new_key}: {value}")
                migrated_attrs.append({'old': old_key, 'new': new_key, 'value': value})
                if not dry_run:
                    self._save_attribute(m_id, 'ASSET', new_key, value)

        # locationName → Entity Label (NOT name!)
        if 'locationName' in attr_dict and attr_dict['locationName']:
            print(f"   📝 locationName → Entity Label: {attr_dict['locationName']}")
            if not dry_run:
                self._set_entity_label(m_id, 'ASSET', attr_dict['locationName'])

        backup['migrated_attributes'] = migrated_attrs

        # Migrate telemetry from VR devices (with backup and state tracking)
        telemetry_backup = self._migrate_telemetry_with_backup(
            measurement, dry_run, state, state_file
        )

        return backup, telemetry_backup

    def _save_attribute(self, entity_id: str, entity_type: str, key: str, value):
        """Save an attribute"""
        self.api.post(
            f"/api/plugins/telemetry/{entity_type}/{entity_id}/attributes/SERVER_SCOPE",
            {key: value}
        )

    def _set_entity_label(self, entity_id: str, entity_type: str, label: str):
        """Set entity label (NOT the name!)"""
        if entity_type == 'ASSET':
            entity = self.api.get(f"/api/asset/{entity_id}")
            if entity:
                entity['label'] = label  # IMPORTANT: Set label, NOT name!
                self.api.post("/api/asset", entity)

    def _save_state(self, state_file: Path, state: dict):
        """Save migration state to file for resume capability"""
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2, ensure_ascii=False)

    # =========================================================================
    # TELEMETRY MIGRATION
    # =========================================================================

    def _migrate_telemetry_with_backup(self, measurement: dict, dry_run: bool,
                                        state: dict = None, state_file: Path = None) -> dict:
        """Migrate telemetry - either from VR devices or rename keys on Measurement directly"""
        m_id = measurement['id']['id']
        m_name = measurement['name']
        vr_devices = measurement.get('vr_devices', [])

        telemetry_backup = {}

        # Get installationType from measurement attributes to determine Power/Energy keys
        attrs = self.api.get(
            f"/api/plugins/telemetry/ASSET/{m_id}/values/attributes/SERVER_SCOPE"
        )
        installation_type = 'heating'  # Default
        if attrs:
            for attr in attrs:
                if attr.get('key') == 'installationType':
                    installation_type = attr.get('value', 'heating')
                    break

        # Get the correct key map based on installation type
        telemetry_key_map = get_telemetry_key_map(installation_type)

        # Initialize state tracking for this measurement
        if state is not None and m_name not in state.get('completed_vr_devices', {}):
            state.setdefault('completed_vr_devices', {})[m_name] = []

        total_points = 0

        if vr_devices:
            # === SCENARIO 1: VR Devices exist - copy telemetry from VR to Measurement ===
            print(f"   📊 Migrating telemetry ({installation_type}) from {len(vr_devices)} VR device(s)...")

            total_vr = len(vr_devices)
            for vr_idx, vr in enumerate(vr_devices, 1):
                vr_id = vr['id']
                vr_name = vr['name']

                # Skip if already completed (for resume)
                if state is not None and vr_id in state['completed_vr_devices'].get(m_name, []):
                    print(f"      [{vr_idx}/{total_vr}] ⏭️  {vr_name} (already migrated)")
                    continue

                # Determine device type from name suffix
                device_type = self._get_device_type(vr_name)
                print(f"      [{vr_idx}/{total_vr}] 🔄 {vr_name} ({device_type})")

                # Get telemetry keys from VR device
                keys = self.api.get(f"/api/plugins/telemetry/DEVICE/{vr_id}/keys/timeseries")
                if not keys:
                    print(f"         ⚠️  No telemetry keys found")
                    continue

                # Filter only relevant keys based on installation type
                relevant_keys = [k for k in keys if self._map_telemetry_key(k, device_type, telemetry_key_map)]
                if not relevant_keys:
                    print(f"         ⚠️  No relevant telemetry keys found")
                    continue

                telemetry_backup[vr_id] = {'device_name': vr_name, 'device_type': device_type, 'keys': {}}

                # Read and transform telemetry for each relevant key
                total_keys = len(relevant_keys)
                for key_idx, old_key in enumerate(relevant_keys, 1):
                    new_key = self._map_telemetry_key(old_key, device_type, telemetry_key_map)

                    # Read telemetry data (this is our backup!)
                    print(f"         [{key_idx}/{total_keys}] Reading {old_key}...", end="", flush=True)
                    telemetry = self._read_telemetry(vr_id, 'DEVICE', old_key)

                    if not telemetry:
                        print(" (empty)")
                        continue

                    points = len(telemetry)
                    total_points += points

                    # Save to backup (metadata only - original data stays in ThingsBoard)
                    telemetry_backup[vr_id]['keys'][old_key] = {
                        'new_key': new_key,
                        'points': points
                    }

                    # Apply conversion if needed for migration
                    if old_key in TELEMETRY_CONVERSIONS:
                        converter = TELEMETRY_CONVERSIONS[old_key]
                        telemetry = [(ts, converter(val)) for ts, val in telemetry]

                    print(f" → {new_key}: {points} points")

                    if not dry_run:
                        self._write_telemetry(m_id, 'ASSET', new_key, telemetry)

                # Mark VR device as completed in state
                if state is not None and state_file is not None:
                    state['completed_vr_devices'][m_name].append(vr_id)
                    self._save_state(state_file, state)

        else:
            # === SCENARIO 2: No VR Devices - copy telemetry to new keys on Measurement ===
            print(f"   📊 Copying telemetry to new keys ({installation_type}) on Measurement...")

            # Check if already completed (for resume)
            if state is not None and 'direct_copy' in state['completed_vr_devices'].get(m_name, []):
                print(f"      ⏭️  Already completed")
                return telemetry_backup

            # Get telemetry keys from Measurement
            keys = self.api.get(f"/api/plugins/telemetry/ASSET/{m_id}/keys/timeseries")
            if not keys:
                print(f"      ℹ️  No telemetry keys found on Measurement")
                return telemetry_backup

            # Filter only OLD keys that need renaming (don't process already normalized keys)
            old_keys_to_rename = [k for k in keys if k in telemetry_key_map]

            if not old_keys_to_rename:
                # Check if already has new keys (already migrated or new format)
                new_keys = ['T_flow_C', 'T_return_C', 'dT_K', 'Vdot_m3h', 'v_ms', 'P_th_kW', 'E_th_kWh', 'V_m3']
                has_new_keys = any(k in keys for k in new_keys)
                if has_new_keys:
                    print(f"      ✅ Already using new telemetry keys")
                else:
                    print(f"      ℹ️  No old telemetry keys to rename")
                return telemetry_backup

            telemetry_backup['measurement_direct'] = {'keys': {}}

            total_keys = len(old_keys_to_rename)
            for key_idx, old_key in enumerate(old_keys_to_rename, 1):
                new_key = telemetry_key_map[old_key]

                # Read telemetry data from Measurement
                print(f"      [{key_idx}/{total_keys}] Reading {old_key}...", end="", flush=True)
                telemetry = self._read_telemetry(m_id, 'ASSET', old_key)

                if not telemetry:
                    print(" (empty)")
                    continue

                points = len(telemetry)
                total_points += points

                # Save to backup (metadata only - original data stays in ThingsBoard)
                telemetry_backup['measurement_direct']['keys'][old_key] = {
                    'new_key': new_key,
                    'points': points
                }

                # Apply conversion if needed
                if old_key in TELEMETRY_CONVERSIONS:
                    converter = TELEMETRY_CONVERSIONS[old_key]
                    telemetry = [(ts, converter(val)) for ts, val in telemetry]

                print(f" → {new_key}: {points} points")

                if not dry_run:
                    # Write under new key
                    self._write_telemetry(m_id, 'ASSET', new_key, telemetry)
                    # Note: Old keys are NOT deleted to preserve data integrity
                    # They can be manually cleaned up later if needed

            # Mark direct rename as completed in state
            if state is not None and state_file is not None:
                state['completed_vr_devices'][m_name].append('direct_copy')
                self._save_state(state_file, state)

        if total_points > 0:
            print(f"   ✅ Total: {total_points} data points {'to migrate' if dry_run else 'migrated'}")
        else:
            print(f"   ℹ️  No telemetry data to migrate")

        return telemetry_backup

    def _get_device_type(self, device_name: str) -> str:
        """Determine device type from name suffix"""
        if device_name.endswith('_TS1'):
            return 'TS1'
        elif device_name.endswith('_TS2'):
            return 'TS2'
        elif device_name.endswith('_TS3'):
            return 'TS3'
        elif '_PF' in device_name or device_name.endswith('_PF1') or device_name.endswith('_PF2'):
            return 'PFLOW'
        elif device_name.endswith('_gw'):
            return 'GATEWAY'
        elif 'pflow' in device_name.lower() or 'p-flow' in device_name.lower():
            return 'PFLOW'
        else:
            return 'UNKNOWN'

    def _map_telemetry_key(self, old_key: str, device_type: str,
                           telemetry_key_map: dict = None) -> Optional[str]:
        """Map old telemetry key to new canonical name"""
        # Temperature sensor: map 'temperature' based on device type
        if old_key == TEMP_SENSOR_KEY:
            if device_type == 'TS1':
                return 'auxT1_C'
            elif device_type == 'TS2':
                return 'auxT2_C'
            elif device_type == 'TS3':
                return 'auxT3_C'
            else:
                return None  # Skip unmapped temperature sensors

        # Use provided key map or default to heating
        if telemetry_key_map is None:
            telemetry_key_map = get_telemetry_key_map('heating')

        # Standard key mapping
        if old_key in telemetry_key_map:
            return telemetry_key_map[old_key]

        # Pass through already normalized keys
        normalized_keys = ['T_flow_C', 'T_return_C', 'dT_K', 'Vdot_m3h', 'v_ms',
                          'P_th_kW', 'E_th_kWh', 'V_m3', 'auxT1_C', 'auxT2_C', 'auxT3_C']
        if old_key in normalized_keys:
            return old_key

        return None

    def _read_telemetry(self, entity_id: str, entity_type: str, key: str,
                        start_ts: int = None, end_ts: int = None) -> list:
        """Read telemetry data from entity, returns list of (timestamp, value) tuples"""
        # Default: read all data (from epoch to now)
        if start_ts is None:
            start_ts = 0
        if end_ts is None:
            end_ts = int(datetime.now().timestamp() * 1000)

        all_data = []
        limit = 10000  # ThingsBoard page size limit

        while True:
            result = self.api.get(
                f"/api/plugins/telemetry/{entity_type}/{entity_id}/values/timeseries",
                params={
                    'keys': key,
                    'startTs': start_ts,
                    'endTs': end_ts,
                    'limit': limit,
                    'orderBy': 'ASC'
                }
            )

            if not result or key not in result:
                break

            data = result[key]
            if not data:
                break

            # Convert to (timestamp, value) tuples - values come as strings!
            for point in data:
                val = point['value']
                # Try to convert to number if possible
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    pass  # Keep as string if not numeric
                all_data.append((point['ts'], val))

            # Check if we got all data (less than limit means no more)
            if len(data) < limit:
                break

            # Update start_ts for next page (exclusive of last timestamp)
            start_ts = data[-1]['ts'] + 1

        return all_data

    def _write_telemetry(self, entity_id: str, entity_type: str, key: str, data: list):
        """Write telemetry data to entity, data is list of (timestamp, value) tuples"""
        if not data:
            return

        # Write in batches to avoid request size limits
        batch_size = 1000
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]

            # Format for ThingsBoard: {ts: timestamp, values: {key: value}}
            # IMPORTANT: Ensure numeric values are floats, not strings
            # But preserve booleans, nulls, and non-numeric strings as-is
            def to_number(v):
                # Already a number
                if isinstance(v, float):
                    return v
                if isinstance(v, int) and not isinstance(v, bool):
                    return float(v)
                # Boolean - keep as-is
                if isinstance(v, bool):
                    return v
                # None - keep as-is
                if v is None:
                    return v
                # String - try to convert if it looks numeric
                if isinstance(v, str):
                    v_stripped = v.strip()
                    # Skip obvious non-numeric strings
                    if v_stripped.lower() in ('true', 'false', 'null', 'none', ''):
                        return v
                    try:
                        return float(v_stripped)
                    except ValueError:
                        return v
                return v

            telemetry_batch = [
                {'ts': ts, 'values': {key: to_number(val)}}
                for ts, val in batch
            ]

            self.api.post(
                f"/api/plugins/telemetry/{entity_type}/{entity_id}/timeseries/ANY",
                telemetry_batch
            )

    # =========================================================================
    # ROLLBACK - Restore from backup
    # =========================================================================

    def rollback(self, project_name: str):
        """Rollback a project from backup"""
        print(f"\n⏪ Rolling back project: {project_name}\n")

        # Find latest backup
        backups = sorted(BACKUP_DIR.glob(f"{project_name}_*"), reverse=True)
        if not backups:
            print(f"❌ No backup found for '{project_name}'")
            return False

        backup_path = backups[0]
        backup_file = backup_path / 'backup.json'

        if not backup_file.exists():
            print(f"❌ Backup file not found: {backup_file}")
            return False

        print(f"📁 Using backup: {backup_path.name}")

        with open(backup_file, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)

        # Confirm rollback
        print(f"\nThis will restore:")
        print(f"   - Project: {backup_data['project_name']}")
        print(f"   - Measurements: {len(backup_data['measurements'])}")
        print(f"   - Timestamp: {backup_data['timestamp']}")

        response = input("\nProceed with rollback? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Rollback cancelled")
            return False

        # Restore project attributes
        project_backup = backup_data['project']
        self._restore_attributes(
            project_backup['id'],
            'ASSET',
            project_backup['attributes']
        )
        print(f"✅ Restored project attributes")

        # Restore measurement attributes
        for m_backup in backup_data['measurements']:
            self._restore_attributes(
                m_backup['id'],
                'ASSET',
                m_backup['attributes']
            )
            print(f"✅ Restored measurement: {m_backup['entity']['name']}")

        print(f"\n✅ Rollback completed")
        return True

    def _restore_attributes(self, entity_id: str, entity_type: str, attributes: dict):
        """Restore attributes from backup"""
        for scope, attrs in attributes.items():
            if attrs:
                attr_dict = {a['key']: a['value'] for a in attrs}
                self.api.post(
                    f"/api/plugins/telemetry/{entity_type}/{entity_id}/attributes/{scope}",
                    attr_dict
                )

    # =========================================================================
    # LIST BACKUPS
    # =========================================================================

    def resume_migration(self, project_name: str):
        """Resume an interrupted migration"""
        print(f"\n🔄 Resuming migration for project: {project_name}\n")

        # Find latest backup with in_progress state
        backups = sorted(BACKUP_DIR.glob(f"{project_name}_*"), reverse=True)
        if not backups:
            print(f"❌ No backup found for '{project_name}'")
            return False

        # Find one with in_progress state
        state_data = None
        backup_path = None
        for bp in backups:
            state_file = bp / 'migration_state.json'
            if state_file.exists():
                with open(state_file, 'r') as f:
                    s = json.load(f)
                if s.get('status') == 'in_progress':
                    state_data = s
                    backup_path = bp
                    break

        if not state_data:
            print(f"❌ No interrupted migration found for '{project_name}'")
            print("   All migrations are either completed or no state file exists.")
            return False

        print(f"📁 Found interrupted migration: {backup_path.name}")
        print(f"   Started: {state_data.get('started_at')}")
        print(f"   Completed measurements: {len(state_data.get('completed_measurements', []))}")
        print(f"   Current measurement: {state_data.get('current_measurement')}")
        print(f"   Errors so far: {len(state_data.get('errors', []))}")

        # Resume using the existing state
        response = input("\nResume this migration? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Resume cancelled")
            return False

        # Re-run migration with the state (it will skip completed items)
        return self._resume_with_state(project_name, backup_path, state_data)

    def _resume_with_state(self, project_name: str, backup_path: Path, state: dict):
        """Resume migration using existing state"""
        print(f"\n🚀 Resuming migration for project: {project_name}\n")

        # Find project
        project = self._find_project_by_name(project_name)
        if not project:
            print(f"❌ Project '{project_name}' not found")
            return False

        state_file = backup_path / 'migration_state.json'
        dry_run = state.get('dry_run', False)

        # Load existing backup data or create new
        backup_file = backup_path / 'backup.json'
        if backup_file.exists():
            with open(backup_file, 'r') as f:
                backup_data = json.load(f)
        else:
            backup_data = {
                'timestamp': state.get('started_at'),
                'project_name': project_name,
                'project_id': project['id']['id'],
                'dry_run': dry_run,
                'project': {},
                'measurements': [],
                'telemetry_backup': {}
            }

        # Continue with measurements
        measurements = project.get('measurements', [])
        total_measurements = len(measurements)
        completed = state.get('completed_measurements', [])

        for i, m in enumerate(measurements, 1):
            m_name = m['name']

            # Skip already completed
            if m_name in completed:
                print(f"\n📦 [{i}/{total_measurements}] Measurement: {m_name} ⏭️  (already completed)")
                continue

            print(f"\n📦 [{i}/{total_measurements}] Measurement: {m_name}")

            state['current_measurement'] = m_name
            self._save_state(state_file, state)

            try:
                m_backup, telemetry_backup = self._migrate_measurement_with_backup(
                    m, dry_run, state, state_file
                )
                backup_data['measurements'].append(m_backup)
                if telemetry_backup:
                    backup_data['telemetry_backup'][m_name] = telemetry_backup

                state['completed_measurements'].append(m_name)
                state['current_measurement'] = None
                self._save_state(state_file, state)

            except Exception as e:
                error_msg = f"Error migrating {m_name}: {str(e)}"
                log.error(error_msg, exc_info=True)
                print(f"   ❌ {error_msg}")
                state['errors'].append(error_msg)
                self._save_state(state_file, state)

        # Save backup file
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)

        # Mark migration as completed
        state['status'] = 'completed' if not state['errors'] else 'completed_with_errors'
        state['completed_at'] = datetime.now().strftime("%Y%m%d_%H%M%S")
        self._save_state(state_file, state)

        print(f"\n💾 Backup saved to: {backup_path}")
        print("\n✅ Migration resumed and completed!")
        return True

    def show_migration_status(self, project_name: str):
        """Show migration status for a project"""
        print(f"\n📊 Migration Status for: {project_name}\n")

        backups = sorted(BACKUP_DIR.glob(f"{project_name}_*"), reverse=True)
        if not backups:
            print(f"   No migrations found for '{project_name}'")
            return

        for bp in backups:
            state_file = bp / 'migration_state.json'
            if state_file.exists():
                with open(state_file, 'r') as f:
                    s = json.load(f)

                status_icon = {
                    'in_progress': '🔄',
                    'completed': '✅',
                    'completed_with_errors': '⚠️'
                }.get(s.get('status'), '❓')

                print(f"{status_icon} {bp.name}")
                print(f"   Status: {s.get('status')}")
                print(f"   Started: {s.get('started_at')}")
                if s.get('completed_at'):
                    print(f"   Completed: {s.get('completed_at')}")
                print(f"   Dry run: {s.get('dry_run')}")
                print(f"   Measurements done: {len(s.get('completed_measurements', []))}")
                if s.get('errors'):
                    print(f"   Errors: {len(s.get('errors'))}")
                print()
            else:
                print(f"❓ {bp.name} (no state file)")
                print()

    def list_backups(self):
        """List all backups"""
        print("\n📁 Available Backups:\n")

        if not BACKUP_DIR.exists():
            print("   No backups found")
            return

        backups = sorted(BACKUP_DIR.glob("*"), reverse=True)
        if not backups:
            print("   No backups found")
            return

        for backup_path in backups:
            if backup_path.is_dir():
                backup_file = backup_path / 'backup.json'
                if backup_file.exists():
                    with open(backup_file, 'r') as f:
                        data = json.load(f)
                    print(f"   📦 {backup_path.name}")
                    print(f"      Project: {data.get('project_name')}")
                    print(f"      Measurements: {len(data.get('measurements', []))}")
                    print(f"      VR Devices: {len(data.get('vr_devices', []))}")
                    print()


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()

    tool = MigrationTool()
    if not tool.connect():
        sys.exit(1)

    if command == 'scan':
        tool.scan()

    elif command == 'backup':
        if len(sys.argv) < 3:
            print("Usage: python tb_migration.py backup <project_name>")
            sys.exit(1)
        project_name = sys.argv[2]
        tool.backup(project_name)

    elif command == 'migrate':
        if len(sys.argv) < 3:
            print("Usage: python tb_migration.py migrate <project_name> [--execute]")
            sys.exit(1)
        project_name = sys.argv[2]
        dry_run = '--execute' not in sys.argv
        tool.migrate(project_name, dry_run=dry_run)

    elif command == 'migrate-all':
        dry_run = '--execute' not in sys.argv
        tool.migrate_all(dry_run=dry_run)

    elif command == 'rollback':
        if len(sys.argv) < 3:
            print("Usage: python tb_migration.py rollback <project_name>")
            sys.exit(1)
        project_name = sys.argv[2]
        tool.rollback(project_name)

    elif command == 'backups':
        tool.list_backups()

    elif command == 'resume':
        if len(sys.argv) < 3:
            print("Usage: python tb_migration.py resume <project_name>")
            sys.exit(1)
        project_name = sys.argv[2]
        tool.resume_migration(project_name)

    elif command == 'status':
        if len(sys.argv) < 3:
            print("Usage: python tb_migration.py status <project_name>")
            sys.exit(1)
        project_name = sys.argv[2]
        tool.show_migration_status(project_name)

    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()

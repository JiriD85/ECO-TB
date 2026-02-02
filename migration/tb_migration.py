#!/usr/bin/env python3
"""
ECO Smart Diagnostics - Migration Tool

Funktionen:
- Alle Projects und Measurements abfragen
- VR Devices erkennen
- Daten sichern (Backup)
- Migration pro Project durchführen
- Rollback bei Problemen

Usage:
    python tb_migration.py scan                    # Scan alle Projects/Measurements
    python tb_migration.py backup <project_name>  # Backup eines Projects
    python tb_migration.py migrate <project_name> # Migration durchführen
    python tb_migration.py rollback <project_name> # Rollback aus Backup
"""

import os
import sys
import json
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
            return True
        except Exception as e:
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
            print(f"❌ GET {endpoint} failed: {e}")
            return None

    def post(self, endpoint: str, data: dict = None) -> Optional[dict]:
        """POST request"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.post(url, headers=self._headers(), json=data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
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
        """Migrate a project (attributes, telemetry keys)"""
        print(f"\n🚀 {'[DRY RUN] ' if dry_run else ''}Migrating project: {project_name}\n")

        # Find project
        project = self._find_project_by_name(project_name)
        if not project:
            print(f"❌ Project '{project_name}' not found")
            return False

        # Check for backup
        if not dry_run:
            backups = list(BACKUP_DIR.glob(f"{project_name}_*"))
            if not backups:
                print(f"⚠️  No backup found for '{project_name}'")
                response = input("Continue without backup? (yes/no): ")
                if response.lower() != 'yes':
                    print("❌ Migration cancelled")
                    return False

        # Migration steps
        print("📋 Migration Plan:")
        print("   1. Rename attributes (old → new)")
        print("   2. Copy telemetry from VR devices to Measurement")
        print("   3. Rename telemetry keys (CHC_* → new)")
        print("   4. Update Project attributes (normOutdoorTemp)")
        print("")

        # Migrate Project
        self._migrate_project_attributes(project, dry_run)

        # Migrate Measurements
        for m in project.get('measurements', []):
            self._migrate_measurement(m, dry_run)

        if dry_run:
            print("\n⚠️  This was a DRY RUN. No changes were made.")
            print("   Run with --execute to apply changes.")
        else:
            print("\n✅ Migration completed")

        return True

    def _migrate_project_attributes(self, project: dict, dry_run: bool):
        """Migrate project attributes"""
        project_id = project['id']['id']
        print(f"\n📦 Project: {project['name']}")

        # Get current attributes
        attrs = self.api.get(
            f"/api/plugins/telemetry/ASSET/{project_id}/values/attributes/SERVER_SCOPE"
        )
        if not attrs:
            attrs = []

        attr_dict = {a['key']: a['value'] for a in attrs}

        # Migration: standardOutsideTemperature → normOutdoorTemp
        if 'standardOutsideTemperature' in attr_dict:
            print(f"   📝 standardOutsideTemperature → normOutdoorTemp: {attr_dict['standardOutsideTemperature']}")
            if not dry_run:
                self._save_attribute(project_id, 'ASSET', 'normOutdoorTemp', attr_dict['standardOutsideTemperature'])

    def _migrate_measurement(self, measurement: dict, dry_run: bool):
        """Migrate a measurement"""
        m_id = measurement['id']['id']
        print(f"\n📦 Measurement: {measurement['name']}")

        # Get current attributes
        attrs = self.api.get(
            f"/api/plugins/telemetry/ASSET/{m_id}/values/attributes/SERVER_SCOPE"
        )
        if not attrs:
            attrs = []

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

        for old_key, new_key in migrations:
            if old_key in attr_dict:
                value = attr_dict[old_key]

                # Special handling for sensorLabel → auxSensor (JSON)
                if old_key.startswith('sensorLabel') and isinstance(value, str):
                    value = {'label': value, 'location': 'custom'}

                print(f"   📝 {old_key} → {new_key}: {value}")
                if not dry_run:
                    self._save_attribute(m_id, 'ASSET', new_key, value)

        # locationName → Entity Label
        if 'locationName' in attr_dict and attr_dict['locationName']:
            print(f"   📝 locationName → Entity Label: {attr_dict['locationName']}")
            if not dry_run:
                self._rename_entity(m_id, 'ASSET', attr_dict['locationName'])

    def _save_attribute(self, entity_id: str, entity_type: str, key: str, value):
        """Save an attribute"""
        self.api.post(
            f"/api/plugins/telemetry/{entity_type}/{entity_id}/attributes/SERVER_SCOPE",
            {key: value}
        )

    def _rename_entity(self, entity_id: str, entity_type: str, new_name: str):
        """Rename an entity"""
        if entity_type == 'ASSET':
            entity = self.api.get(f"/api/asset/{entity_id}")
            if entity:
                entity['name'] = new_name
                self.api.post("/api/asset", entity)

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

    elif command == 'rollback':
        if len(sys.argv) < 3:
            print("Usage: python tb_migration.py rollback <project_name>")
            sys.exit(1)
        project_name = sys.argv[2]
        tool.rollback(project_name)

    elif command == 'backups':
        tool.list_backups()

    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()

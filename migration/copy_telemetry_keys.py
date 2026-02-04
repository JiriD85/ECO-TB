#!/usr/bin/env python3
"""
Copy CHC_* telemetry keys to new normalized keys on Measurement Assets.

For projects without VR device relations where telemetry is directly on the Measurement.

Usage:
    python copy_telemetry_keys.py              # Dry run
    python copy_telemetry_keys.py --execute    # Actually copy
"""

import os
import sys
import json
import requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load .env from parent directory
load_dotenv(Path(__file__).parent.parent / '.env')

# Configuration
TB_BASE_URL = os.getenv('TB_BASE_URL', '').rstrip('/')
TB_USERNAME = os.getenv('TB_USERNAME')
TB_PASSWORD = os.getenv('TB_PASSWORD')

# Projects to process (hardcoded)
PROJECTS_TO_FIX = ['PKE_5', 'PKE_6', 'WBS_9', 'EPI_4']

# Telemetry key mapping
TELEMETRY_KEY_MAP_BASE = {
    'CHC_S_TemperatureFlow': 'T_flow_C',
    'CHC_S_TemperatureReturn': 'T_return_C',
    'CHC_S_TemperatureDiff': 'dT_K',
    'CHC_S_VolumeFlow': 'Vdot_m3h',  # Needs ÷1000
    'CHC_S_Velocity': 'v_ms',
    'CHC_M_Volume': 'V_m3',
}

TELEMETRY_KEY_MAP_HEATING = {
    'CHC_S_Power_Heating': 'P_th_kW',
    'CHC_M_Energy_Heating': 'E_th_kWh',
}

TELEMETRY_KEY_MAP_COOLING = {
    'CHC_S_Power_Cooling': 'P_th_kW',
    'CHC_M_Energy_Cooling': 'E_th_kWh',
}

# Keys that need conversion
CONVERSIONS = {
    'CHC_S_VolumeFlow': lambda x: float(x) / 1000,  # l/h → m³/h
}


class ThingsBoardAPI:
    def __init__(self):
        self.base_url = TB_BASE_URL
        self.token = None

    def login(self) -> bool:
        url = f"{self.base_url}/api/auth/login"
        try:
            response = requests.post(url, json={
                "username": TB_USERNAME,
                "password": TB_PASSWORD
            })
            response.raise_for_status()
            self.token = response.json().get('token')
            return True
        except Exception as e:
            print(f"❌ Login failed: {e}")
            return False

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def get(self, endpoint, params=None):
        try:
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self._headers(),
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"   ❌ GET {endpoint}: {e}")
            return None

    def post(self, endpoint, data=None):
        try:
            response = requests.post(
                f"{self.base_url}{endpoint}",
                headers=self._headers(),
                json=data
            )
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"   ❌ POST {endpoint}: {e}")
            return False


def get_key_map(installation_type: str) -> dict:
    """Get telemetry key map based on installation type"""
    key_map = TELEMETRY_KEY_MAP_BASE.copy()
    if installation_type == 'cooling':
        key_map.update(TELEMETRY_KEY_MAP_COOLING)
    else:
        key_map.update(TELEMETRY_KEY_MAP_HEATING)
    return key_map


def read_telemetry(api, entity_id: str, key: str) -> list:
    """Read all telemetry data for a key, returns [(ts, value), ...]"""
    all_data = []
    start_ts = 0
    end_ts = int(datetime.now().timestamp() * 1000)
    limit = 10000

    while True:
        result = api.get(
            f"/api/plugins/telemetry/ASSET/{entity_id}/values/timeseries",
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

        for point in data:
            val = point['value']
            try:
                val = float(val)
            except (ValueError, TypeError):
                pass
            all_data.append((point['ts'], val))

        if len(data) < limit:
            break

        start_ts = data[-1]['ts'] + 1

    return all_data


def write_telemetry(api, entity_id: str, key: str, data: list) -> bool:
    """Write telemetry data in batches"""
    if not data:
        return True

    batch_size = 1000
    success = True

    def preserve_type(v):
        """Preserve original type, but convert numeric strings back to numbers.
        ThingsBoard API returns numbers as strings, so we need to convert them back."""
        # Already correct types - keep as-is
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return v
        if v is None:
            return v
        # String - convert back to original type if possible
        if isinstance(v, str):
            v_stripped = v.strip()
            # Boolean strings
            if v_stripped.lower() == 'true':
                return True
            if v_stripped.lower() == 'false':
                return False
            # Empty or null
            if v_stripped.lower() in ('null', 'none', ''):
                return v
            # Try integer first (no decimal point)
            if '.' not in v_stripped:
                try:
                    return int(v_stripped)
                except ValueError:
                    pass
            # Try float
            try:
                return float(v_stripped)
            except ValueError:
                return v
        return v

    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        telemetry_batch = [
            {'ts': ts, 'values': {key: preserve_type(val)}}
            for ts, val in batch
        ]

        if not api.post(
            f"/api/plugins/telemetry/ASSET/{entity_id}/timeseries/ANY",
            telemetry_batch
        ):
            success = False

    return success


def find_project_measurements(api, project_name: str) -> list:
    """Find all measurements for a project"""
    # Get all customers
    customers = []
    page = 0
    while True:
        result = api.get("/api/customers", params={"pageSize": 100, "page": page})
        if not result or not result.get('data'):
            break
        customers.extend(result['data'])
        if not result.get('hasNext'):
            break
        page += 1

    # Find project
    project = None
    for customer in customers:
        customer_id = customer['id']['id']
        assets = api.get(f"/api/customer/{customer_id}/assets", params={
            "pageSize": 100, "page": 0, "type": "Project"
        })
        if assets and assets.get('data'):
            for asset in assets['data']:
                if asset['name'] == project_name:
                    project = asset
                    break
        if project:
            break

    if not project:
        return []

    # Get measurements via relations
    project_id = project['id']['id']
    relations = api.get("/api/relations", params={
        "fromId": project_id,
        "fromType": "ASSET"
    })

    if not relations:
        return []

    measurement_ids = [
        rel['to']['id'] for rel in relations
        if rel.get('to', {}).get('entityType') == 'ASSET'
        and rel.get('type') == 'Owns'
    ]

    # Get measurement details
    measurements = []
    for m_id in measurement_ids:
        m = api.get(f"/api/asset/{m_id}")
        if m and m.get('type') == 'Measurement':
            measurements.append(m)

    return measurements


def process_measurement(api, measurement: dict, dry_run: bool) -> dict:
    """Process a single measurement, returns stats"""
    m_id = measurement['id']['id']
    m_name = measurement['name']

    stats = {'name': m_name, 'keys_copied': 0, 'points_copied': 0, 'errors': []}

    # Get installation type
    attrs = api.get(f"/api/plugins/telemetry/ASSET/{m_id}/values/attributes/SERVER_SCOPE")
    installation_type = 'heating'
    if attrs:
        for attr in attrs:
            if attr.get('key') == 'installationType':
                installation_type = attr.get('value', 'heating')
                break

    key_map = get_key_map(installation_type)

    # Get existing telemetry keys
    existing_keys = api.get(f"/api/plugins/telemetry/ASSET/{m_id}/keys/timeseries")
    if not existing_keys:
        print(f"      ℹ️  No telemetry keys found")
        return stats

    # Find CHC_* keys to copy
    keys_to_copy = [k for k in existing_keys if k in key_map]

    if not keys_to_copy:
        # Check if already has new keys
        new_keys = ['T_flow_C', 'T_return_C', 'Vdot_m3h', 'P_th_kW', 'E_th_kWh']
        has_new = any(k in existing_keys for k in new_keys)
        if has_new:
            print(f"      ✅ Already has new keys")
        else:
            print(f"      ℹ️  No CHC_* keys found")
        return stats

    print(f"      📊 Found {len(keys_to_copy)} CHC_* keys ({installation_type})")

    # Copy each key
    for old_key in keys_to_copy:
        new_key = key_map[old_key]

        # Read old CHC_* data
        print(f"         📖 Reading {old_key}...", end="", flush=True)
        old_data = read_telemetry(api, m_id, old_key)

        if not old_data:
            print(" (empty)")
            continue

        old_count = len(old_data)
        old_min_ts = min(d[0] for d in old_data)
        old_max_ts = max(d[0] for d in old_data)

        # Check if new key already has data
        if new_key in existing_keys:
            new_data = read_telemetry(api, m_id, new_key)
            if new_data:
                new_min_ts = min(d[0] for d in new_data)
                # Only copy data OLDER than what's already there
                data_to_copy = [(ts, val) for ts, val in old_data if ts < new_min_ts]
                if not data_to_copy:
                    print(f" {old_count} pts, new key already covers this period")
                    continue
                print(f" {old_count} pts, copying {len(data_to_copy)} older points → {new_key}", end="")
                old_data = data_to_copy
            else:
                print(f" {old_count} pts → {new_key}", end="")
        else:
            print(f" {old_count} pts → {new_key}", end="")

        # Apply conversion if needed
        if old_key in CONVERSIONS:
            converter = CONVERSIONS[old_key]
            old_data = [(ts, converter(val)) for ts, val in old_data]

        if dry_run:
            print(" [DRY RUN]")
        else:
            if write_telemetry(api, m_id, new_key, old_data):
                print(" ✅")
                stats['keys_copied'] += 1
                stats['points_copied'] += len(old_data)
            else:
                print(" ❌")
                stats['errors'].append(f"Failed to write {new_key}")

    return stats


def main():
    dry_run = '--execute' not in sys.argv

    print(f"\n{'='*70}")
    print(f"{'[DRY RUN] ' if dry_run else ''}COPY CHC_* TELEMETRY KEYS")
    print(f"{'='*70}")
    print(f"\nProjects: {', '.join(PROJECTS_TO_FIX)}\n")

    api = ThingsBoardAPI()
    print(f"🔌 Connecting to {TB_BASE_URL}...")
    if not api.login():
        sys.exit(1)
    print("✅ Connected\n")

    total_stats = {
        'projects': 0,
        'measurements': 0,
        'keys_copied': 0,
        'points_copied': 0,
        'errors': []
    }

    for project_name in PROJECTS_TO_FIX:
        print(f"\n{'='*60}")
        print(f"PROJECT: {project_name}")
        print(f"{'='*60}")

        # Refresh token for each project
        if total_stats['projects'] > 0:
            print("🔑 Refreshing token...")
            if not api.login():
                print("⚠️  Token refresh failed")

        measurements = find_project_measurements(api, project_name)

        if not measurements:
            print(f"   ❌ No measurements found")
            continue

        print(f"   📦 Found {len(measurements)} measurements\n")
        total_stats['projects'] += 1

        for m in measurements:
            print(f"   📍 {m['name']}")
            stats = process_measurement(api, m, dry_run)
            total_stats['measurements'] += 1
            total_stats['keys_copied'] += stats['keys_copied']
            total_stats['points_copied'] += stats['points_copied']
            total_stats['errors'].extend(stats['errors'])

    # Summary
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    print(f"   Projects processed: {total_stats['projects']}")
    print(f"   Measurements processed: {total_stats['measurements']}")
    print(f"   Keys copied: {total_stats['keys_copied']}")
    print(f"   Data points copied: {total_stats['points_copied']}")

    if total_stats['errors']:
        print(f"   Errors: {len(total_stats['errors'])}")
        for err in total_stats['errors']:
            print(f"      ❌ {err}")

    if dry_run:
        print(f"\n⚠️  This was a DRY RUN. No changes were made.")
        print(f"   Run with --execute to apply changes.")
    else:
        print(f"\n✅ Done!")


if __name__ == '__main__':
    main()

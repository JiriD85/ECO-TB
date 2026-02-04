#!/usr/bin/env python3
"""
Fix telemetry data types and add missing dT_K.

1. Re-saves telemetry values with correct types (string → number)
2. Adds dT_K from CHC_S_TemperatureDiff or calculates from T_flow_C - T_return_C

Usage:
    python fix_telemetry_types.py              # Dry run
    python fix_telemetry_types.py --execute    # Actually fix
"""

import os
import sys
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

# Keys to fix (these should be numbers)
KEYS_TO_FIX = [
    'T_flow_C',
    'T_return_C',
    'dT_K',
    'Vdot_m3h',
    'v_ms',
    'P_th_kW',
    'E_th_kWh',
    'V_m3',
]


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


def preserve_type(v):
    """Preserve original type, convert numeric strings back to numbers."""
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return v
    if v is None:
        return v
    if isinstance(v, str):
        v_stripped = v.strip()
        if v_stripped.lower() == 'true':
            return True
        if v_stripped.lower() == 'false':
            return False
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
            all_data.append((point['ts'], point['value']))

        if len(data) < limit:
            break

        start_ts = data[-1]['ts'] + 1

    return all_data


def write_telemetry(api, entity_id: str, key: str, data: list) -> bool:
    """Write telemetry data with correct types"""
    if not data:
        return True

    batch_size = 1000
    success = True

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


def get_all_measurements(api) -> list:
    """Get all Measurement assets"""
    measurements = []
    page = 0

    while True:
        resp = api.get(f"/api/tenant/assets", params={
            "pageSize": 100,
            "page": page,
            "type": "Measurement"
        })

        if not resp or not resp.get('data'):
            break

        measurements.extend(resp['data'])

        if not resp.get('hasNext'):
            break
        page += 1

    return measurements


def fix_measurement(api, measurement: dict, dry_run: bool) -> dict:
    """Fix telemetry types for a measurement and add dT_K if missing"""
    m_id = measurement['id']['id']
    m_name = measurement['name']

    stats = {'name': m_name, 'keys_fixed': 0, 'points_fixed': 0, 'dT_added': False}

    # Get existing telemetry keys
    existing_keys = api.get(f"/api/plugins/telemetry/ASSET/{m_id}/keys/timeseries")
    if not existing_keys:
        return stats

    # Fix existing keys
    keys_to_process = [k for k in KEYS_TO_FIX if k in existing_keys]

    for key in keys_to_process:
        data = read_telemetry(api, m_id, key)
        if not data:
            continue

        # Check if any values need fixing (are strings that should be numbers)
        needs_fix = any(isinstance(v, str) for ts, v in data)

        if needs_fix:
            print(f"      🔧 {key}: {len(data)} points", end="")
            if dry_run:
                print(" [DRY RUN]")
            else:
                if write_telemetry(api, m_id, key, data):
                    print(" ✅")
                    stats['keys_fixed'] += 1
                    stats['points_fixed'] += len(data)
                else:
                    print(" ❌")

    # Add dT_K if missing or empty
    has_dT = 'dT_K' in existing_keys
    dT_data = read_telemetry(api, m_id, 'dT_K') if has_dT else []

    if not dT_data:
        # Try to get from CHC_S_TemperatureDiff
        if 'CHC_S_TemperatureDiff' in existing_keys:
            source_data = read_telemetry(api, m_id, 'CHC_S_TemperatureDiff')
            if source_data:
                print(f"      📊 dT_K: copying {len(source_data)} points from CHC_S_TemperatureDiff", end="")
                if dry_run:
                    print(" [DRY RUN]")
                else:
                    if write_telemetry(api, m_id, 'dT_K', source_data):
                        print(" ✅")
                        stats['dT_added'] = True
                    else:
                        print(" ❌")

        # Otherwise calculate from T_flow_C - T_return_C
        elif 'T_flow_C' in existing_keys and 'T_return_C' in existing_keys:
            t_flow = read_telemetry(api, m_id, 'T_flow_C')
            t_return = read_telemetry(api, m_id, 'T_return_C')

            if t_flow and t_return:
                # Create dict for fast lookup
                t_return_dict = {ts: preserve_type(v) for ts, v in t_return}

                # Calculate dT_K for matching timestamps
                dT_calculated = []
                for ts, v_flow in t_flow:
                    v_flow = preserve_type(v_flow)
                    v_return = t_return_dict.get(ts)
                    if v_return is not None and isinstance(v_flow, (int, float)) and isinstance(v_return, (int, float)):
                        dT = round(v_flow - v_return, 2)
                        dT_calculated.append((ts, dT))

                if dT_calculated:
                    print(f"      📊 dT_K: calculating {len(dT_calculated)} points from T_flow - T_return", end="")
                    if dry_run:
                        print(" [DRY RUN]")
                    else:
                        if write_telemetry(api, m_id, 'dT_K', dT_calculated):
                            print(" ✅")
                            stats['dT_added'] = True
                        else:
                            print(" ❌")

    return stats


def main():
    dry_run = '--execute' not in sys.argv

    print(f"\n{'='*70}")
    print(f"{'[DRY RUN] ' if dry_run else ''}FIX TELEMETRY TYPES & ADD dT_K")
    print(f"{'='*70}\n")

    api = ThingsBoardAPI()
    print(f"🔌 Connecting to {TB_BASE_URL}...")
    if not api.login():
        sys.exit(1)
    print("✅ Connected\n")

    # Get all measurements
    print("📊 Loading all measurements...")
    measurements = get_all_measurements(api)
    print(f"   Found {len(measurements)} measurements\n")

    total_stats = {
        'measurements_processed': 0,
        'measurements_fixed': 0,
        'keys_fixed': 0,
        'points_fixed': 0,
        'dT_added': 0,
    }

    # Process each measurement
    for i, m in enumerate(measurements, 1):
        # Refresh token every 50 measurements
        if i > 1 and i % 50 == 0:
            print(f"\n🔑 Refreshing token...")
            api.login()

        m_name = m['name']
        print(f"\n[{i}/{len(measurements)}] {m_name}")

        stats = fix_measurement(api, m, dry_run)
        total_stats['measurements_processed'] += 1

        if stats['keys_fixed'] > 0 or stats['dT_added']:
            total_stats['measurements_fixed'] += 1
            total_stats['keys_fixed'] += stats['keys_fixed']
            total_stats['points_fixed'] += stats['points_fixed']
            if stats['dT_added']:
                total_stats['dT_added'] += 1

    # Summary
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    print(f"   Measurements processed: {total_stats['measurements_processed']}")
    print(f"   Measurements fixed: {total_stats['measurements_fixed']}")
    print(f"   Keys fixed: {total_stats['keys_fixed']}")
    print(f"   Data points fixed: {total_stats['points_fixed']}")
    print(f"   dT_K added: {total_stats['dT_added']}")

    if dry_run:
        print(f"\n⚠️  This was a DRY RUN. No changes were made.")
        print(f"   Run with --execute to apply changes.")
    else:
        print(f"\n✅ Done!")


if __name__ == '__main__':
    main()

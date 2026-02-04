# ECO Migration Tool

Python-basiertes Migrations-Tool für die Datenbereinigung.

## Setup

```bash
cd migration
pip install -r requirements.txt
```

## Befehle

### Scan - Alle Projects/Measurements anzeigen

```bash
python tb_migration.py scan
```

Zeigt:
- Alle Projects und Measurements
- VR Devices pro Entity
- Status (🔴 VR Devices vorhanden, ✅ OK)

### Backup - Projekt sichern

```bash
python tb_migration.py backup <project_name>
```

Sichert:
- Project Attributes
- Measurement Attributes
- VR Device Telemetry Keys
- Relations

Backup wird gespeichert in: `migration/backups/<project_name>_<timestamp>/`

### Migrate - Migration durchführen

```bash
# Dry Run (zeigt nur was passieren würde)
python tb_migration.py migrate <project_name>

# Tatsächlich ausführen
python tb_migration.py migrate <project_name> --execute
```

**Attribute-Migration (alle Measurements):**
- `installationTypeOptions` → `systemType`
- `deltaT` → `designDeltaT`
- `deltaTAnalysisFloorVolume` → `flowOnThreshold`
- `dimension` → `pipeDimension`
- `nominalFlow` → `designFlow`
- `sensorLabel1/2` → `auxSensor1/2` (JSON)
- `locationName` → Entity Label
- `standardOutsideTemperature` → Project `normOutdoorTemp`

**Telemetrie-Migration (zwei Szenarien):**

1. **Mit VR Devices** (alte Measurements):
   - Telemetrie wird von VR Device zum Measurement kopiert
   - Keys werden dabei umbenannt

2. **Ohne VR Devices** (neue Measurements):
   - Telemetrie wird unter neuem Key-Namen gespeichert
   - Alte Keys bleiben erhalten (können später manuell gelöscht werden)

**Telemetrie Key Mapping:**
- `CHC_S_TemperatureFlow` → `T_flow_C`
- `CHC_S_TemperatureReturn` → `T_return_C`
- `CHC_S_VolumeFlow` → `Vdot_m3h` (÷1000 Konvertierung)
- `CHC_S_Power_Heating/Cooling` → `P_th_kW`
- `CHC_M_Energy_Heating/Cooling` → `E_th_kWh`

### Migrate All - ALLE Projects migrieren (Batch)

```bash
# Dry Run (zeigt nur was passieren würde)
python tb_migration.py migrate-all

# Tatsächlich ausführen (für Nacht-Migration)
python tb_migration.py migrate-all --execute
```

**Features:**
- Überspringt bereits migrierte Projects (tracking via `migration_log.json`)
- Überspringt ausgeschlossene Measurements (z.B. RoomKit/LoRaWAN)
- Fährt bei Fehlern mit nächstem Project fort
- Erstellt Zusammenfassung am Ende
- Speichert Batch-Ergebnis in `backups/batch_migration_*.json`

**Konfiguration in `tb_migration.py`:**
```python
# Measurements die übersprungen werden
EXCLUDE_MEASUREMENTS = [
    'BCH_1_6',  # RoomKit / LoRaWAN measurement
]

# Projects die komplett übersprungen werden
EXCLUDE_PROJECTS = []
```

### Rollback - Aus Backup wiederherstellen

```bash
python tb_migration.py rollback <project_name>
```

Stellt das neueste Backup wieder her.

### Resume - Unterbrochene Migration fortsetzen

```bash
python tb_migration.py resume <project_name>
```

### Status - Migrations-Status anzeigen

```bash
python tb_migration.py status <project_name>
```

### Backups anzeigen

```bash
python tb_migration.py backups
```

## Workflow

### Einzelnes Project

```
1. python tb_migration.py scan                    # Übersicht
2. python tb_migration.py backup AIOT_6           # Backup erstellen
3. python tb_migration.py migrate AIOT_6          # Dry Run
4. python tb_migration.py migrate AIOT_6 --execute # Migration
5. # Manuell prüfen im Dashboard
6. # Bei Problemen:
   python tb_migration.py rollback AIOT_6
```

### Batch-Migration (alle Projects)

```
1. python tb_migration.py scan                    # Übersicht prüfen
2. python tb_migration.py migrate-all             # Dry Run aller Projects
3. # Output prüfen - sind die richtigen Projects dabei?
4. python tb_migration.py migrate-all --execute   # Echte Migration starten
5. # Nächsten Morgen: Ergebnisse in backups/batch_migration_*.json prüfen
```

## Logging

Alle Fehler und wichtige Events werden geloggt:

```
migration/logs/migration.log      # Aktuelles Log
migration/logs/migration.log.1    # Älteres Log (nach Rotation)
migration/logs/migration.log.2    # Noch älteres Log
```

**Features:**
- Automatische Rotation bei 1GB
- Max 3 Log-Dateien (= max 3GB total)
- Timestamps für Nachvollziehbarkeit
- Stack Traces bei Fehlern

**Log-Inhalt:**
```
2026-02-03 22:15:00 - INFO - BATCH MIGRATION STARTED - dry_run=False
2026-02-03 22:15:05 - INFO - SUCCESS: AIOT_6
2026-02-03 22:18:32 - ERROR - FAILED: BCH_1 - Connection timeout
2026-02-03 22:45:00 - INFO - BATCH MIGRATION COMPLETE - Successful: 15, Failed: 1
```

## Datei-Struktur

```
migration/
├── tb_migration.py
├── migration_log.json               # Tracking bereits migrierter Projects
├── logs/
│   ├── migration.log                # Aktuelles Log (max 1GB)
│   ├── migration.log.1              # Rotiertes Log
│   └── migration.log.2              # Rotiertes Log
└── backups/
    ├── AIOT_6_20260202_153000/
    │   ├── backup.json
    │   └── migration_state.json
    ├── batch_migration_20260203_220000.json
    └── ...
```

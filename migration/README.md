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

Migriert:
- `installationTypeOptions` → `systemType`
- `deltaT` → `designDeltaT`
- `deltaTAnalysisFloorVolume` → `flowOnThreshold`
- `dimension` → `pipeDimension`
- `nominalFlow` → `designFlow`
- `sensorLabel1/2` → `auxSensor1/2` (JSON)
- `locationName` → Entity Label
- `standardOutsideTemperature` → Project `normOutdoorTemp`

### Rollback - Aus Backup wiederherstellen

```bash
python tb_migration.py rollback <project_name>
```

Stellt das neueste Backup wieder her.

### Backups anzeigen

```bash
python tb_migration.py backups
```

## Workflow

```
1. python tb_migration.py scan                    # Übersicht
2. python tb_migration.py backup AIOT_6           # Backup erstellen
3. python tb_migration.py migrate AIOT_6          # Dry Run
4. python tb_migration.py migrate AIOT_6 --execute # Migration
5. # Manuell prüfen im Dashboard
6. # Bei Problemen:
   python tb_migration.py rollback AIOT_6
```

## Backup-Struktur

```
migration/backups/
└── AIOT_6_20260202_153000/
    └── backup.json
        ├── project: {...}
        ├── measurements: [...]
        ├── vr_devices: [...]
        └── telemetry: {...}
```

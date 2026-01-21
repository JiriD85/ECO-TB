# ThingsBoard Sync Tool

Synchronisiert Dashboards, Rule Chains und Widgets zwischen dem lokalen Dateisystem und ThingsBoard.

## Installation

```bash
cd sync
npm install
```

## Konfiguration

Erstelle eine `.env` Datei im Projektroot:

```env
TB_BASE_URL=https://your-thingsboard-instance.com
TB_USERNAME=your-username
TB_PASSWORD=your-password
```

## Verzeichnisstruktur

```
project/
├── dashboards/          # Dashboard JSON-Dateien
├── rule chains/         # Rule Chain JSON-Dateien
├── widgets/             # Widget Bundle JSON-Dateien
├── backups/             # Automatische Backups
│   └── .sync-status.json
├── sync/
│   ├── sync.js          # Hauptskript
│   ├── api.js           # ThingsBoard API Client
│   ├── backup.js        # Backup-Logik
│   └── config.js        # Konfiguration
└── .env                 # Zugangsdaten
```

## Befehle

### sync - Lokale Dateien nach ThingsBoard hochladen

```bash
# Alle Ressourcen synchronisieren
node sync/sync.js sync

# Nur Dashboards
node sync/sync.js sync --dashboards

# Nur Rule Chains
node sync/sync.js sync --rulechains

# Nur Widgets
node sync/sync.js sync --widgets

# Explizit alles
node sync/sync.js sync --all
```

**Verhalten:**
- Vor dem Upload wird automatisch ein Backup der betroffenen Dateien erstellt
- Existierende Dashboards werden anhand des Titels erkannt und aktualisiert
- Neue Dashboards werden erstellt

### pull - Dashboards von ThingsBoard herunterladen

```bash
# Ein spezifisches Dashboard (Teilübereinstimmung im Titel)
node sync/sync.js pull "Smart Diagnostics Navigation"

# Mehrere Dashboards mit gemeinsamem Namensteil
node sync/sync.js pull "Smart Diagnostics"

# Alle Dashboards herunterladen
node sync/sync.js pull --all
```

**Verhalten:**
- Vor dem Überschreiben wird automatisch ein Backup erstellt
- Dateinamen werden aus dem Dashboard-Titel generiert
- JSON wird formatiert gespeichert (2 Spaces Einrückung)

### list - Dashboards auf dem Server auflisten

```bash
node sync/sync.js list
```

**Ausgabe:**
```
Found 47 dashboards:

  Smart Diagnostics Navigation
    ID: 4d1adea0-f6b7-11f0-9979-9f3434877bb4
  Smart Diagnostics Measurements
    ID: 4cee2950-f6b7-11f0-adb4-33b9bcf3ddd0
  ...
```

### backup - Manuelles Backup erstellen

```bash
node sync/sync.js backup
```

Erstellt ein vollständiges Backup aller Verzeichnisse (`dashboards`, `rule chains`, `widgets`).

### rollback - Letztes Backup wiederherstellen

```bash
node sync/sync.js rollback
```

**Achtung:** Überschreibt alle lokalen Dateien mit dem letzten Backup.

### status - Sync-Status anzeigen

```bash
node sync/sync.js status
```

**Ausgabe:**
```
Status:
Last backup: 2026-01-21_12-38-18
Last sync: 2026-01-21_12-38-25
Last pull: 2026-01-21_12-41-37
Last rollback: n/a
Backups: 5
Latest backup: 2026-01-21_12-41-37
```

## Backup-System

### Automatische Backups

- Bei jedem `sync` werden nur die Dateien gesichert, die hochgeladen werden
- Bei jedem `pull` werden nur die Dateien gesichert, die überschrieben werden
- Backups werden nur erstellt, wenn sich Dateien seit dem letzten Backup geändert haben

### Backup-Verzeichnis

```
backups/
├── 2026-01-21_12-38-10/
│   └── dashboards/
│       └── smart_diagnostics_navigation.json
├── 2026-01-21_12-38-18/
│   └── dashboards/
│       ├── smart_diagnostics_administration.json
│       ├── smart_diagnostics_alarming.json
│       └── ...
└── .sync-status.json
```

### Status-Datei

Die `.sync-status.json` enthält Zeitstempel der letzten Operationen:

```json
{
  "lastBackup": "2026-01-21_12-41-37",
  "lastSync": "2026-01-21_12-38-25",
  "lastPull": "2026-01-21_12-41-37",
  "lastRollback": null
}
```

## Typische Workflows

### Lokale Änderungen nach ThingsBoard pushen

```bash
# 1. Dashboard lokal bearbeiten
# 2. Änderungen synchronisieren
node sync/sync.js sync --dashboards
```

### Änderungen von ThingsBoard holen

```bash
# 1. Dashboard in ThingsBoard bearbeiten
# 2. Lokal herunterladen
node sync/sync.js pull "Dashboard Name"
```

### Vor größeren Änderungen sichern

```bash
# Manuelles Backup
node sync/sync.js backup

# Änderungen durchführen...

# Bei Problemen: Rollback
node sync/sync.js rollback
```

### Alle Smart Diagnostics Dashboards synchron halten

```bash
# Von ThingsBoard holen
node sync/sync.js pull "Smart Diagnostics"

# Nach ThingsBoard pushen
node sync/sync.js sync --dashboards
```

## Fehlerbehebung

### "Cannot find module 'node-fetch'"

```bash
npm install node-fetch@2
```

### "Login failed"

- Prüfe die Zugangsdaten in `.env`
- Prüfe ob die ThingsBoard-URL erreichbar ist
- Prüfe ob der Benutzer die nötigen Rechte hat

### "No dashboards found"

- Stelle sicher, dass JSON-Dateien im `dashboards/` Verzeichnis liegen
- Dateinamen müssen auf `.json` enden

## API-Endpunkte

Das Tool nutzt folgende ThingsBoard API-Endpunkte:

| Endpunkt | Verwendung |
|----------|------------|
| `POST /api/auth/login` | Authentifizierung |
| `POST /api/auth/token` | Token-Refresh |
| `GET /api/tenant/dashboards` | Dashboard-Liste |
| `GET /api/dashboard/{id}` | Dashboard-Details |
| `POST /api/dashboard` | Dashboard erstellen/aktualisieren |
| `POST /api/ruleChain` | Rule Chain hochladen |
| `POST /api/widgetsBundle` | Widget Bundle hochladen |

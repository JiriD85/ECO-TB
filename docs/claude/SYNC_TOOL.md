# ThingsBoard Sync Tool

Vollstaendige Referenz fuer das Sync Tool.

## Befehle

### Push (Einzelne Ressourcen - BEVORZUGT)

```bash
# Dashboard pushen
node sync/sync.js push <dashboard-name>
node sync/sync.js push measurements
node sync/sync.js push administration measurements  # Mehrere

# JS Library pushen
node sync/sync.js push-js "Library Name"
node sync/sync.js push-js "ECO Project Wizard"

# Rule Chain pushen
node sync/sync.js push-rulechain "Rule Chain Name"

# Translations (Batch erlaubt)
node sync/sync.js sync --i18n
```

### Pull (Vor Bearbeitung IMMER ausfuehren!)

```bash
# Dashboard holen
node sync/sync.js pull "Dashboard Name"
node sync/sync.js pull measurements

# JS Library holen
node sync/sync.js pull-js "Library Name"

# Translations holen
node sync/sync.js pull-i18n de_DE en_US
```

### Listen & Status

```bash
node sync/sync.js list          # Dashboards
node sync/sync.js list-js       # JS Modules
node sync/sync.js list-i18n     # Translations
node sync/sync.js status        # Sync Status
```

### Backup & Rollback

```bash
node sync/sync.js backup        # Manuelles Backup
node sync/sync.js rollback      # Letzes Backup wiederherstellen
```

## VERBOTEN - Niemals ausfuehren!

```bash
node sync/sync.js sync --js          # VERBOTEN!
node sync/sync.js sync --dashboards  # VERBOTEN!
```

Diese Befehle ueberschreiben ALLE Dateien und koennen ungesicherte Aenderungen zerstoeren.

## Workflow-Reihenfolge (PFLICHT)

1. **PULL** - Aktuelle Version vom Server holen
   ```bash
   node sync/sync.js pull "Dashboard Name"
   ```

2. **BACKUP** - Manuelle Sicherung erstellen
   ```bash
   cp "dashboards/NAME.json" "backups/manual/NAME_$(date +%Y%m%d_%H%M%S).json"
   ```

3. **EDIT** - Aenderungen durchfuehren

4. **PUSH** - NUR die geaenderte Datei pushen
   ```bash
   node sync/sync.js push <dashboard-name>
   ```

## Backup-Struktur

Das Sync Tool erstellt automatisch Backups in `backups/YYYY-MM-DD_HH-MM-SS/`:
- Nur geaenderte Dateien werden gesichert
- `CHANGELOG.md` listet was gesichert wurde

Manuelle Backups in `backups/manual/` mit Timestamp im Dateinamen.

## Optimistic Locking

Das Sync Tool holt automatisch die aktuelle Version vom Server vor dem Upload.
Bei Versionskonflikten schlaegt der Push fehl - dann manuell pullen und Aenderungen erneut anwenden.

## Environment

Benoetigt `.env` mit:
```
TB_BASE_URL=https://diagnostics.ecoenergygroup.com
TB_USERNAME=...
TB_PASSWORD=...
```

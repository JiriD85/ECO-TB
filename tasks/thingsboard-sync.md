# Task: ThingsBoard Sync Tool

## Beschreibung
Implementiere ein Synchronisations-Tool das lokale Dashboard-, Rule Chain- und Widget-Konfigurationen mit ThingsBoard über die REST API synchronisiert. Das Tool muss Backups vor dem Upload erstellen und Rollback-Funktionalität bieten.

## Kontext
- ThingsBoard 4.2 PE Installation: https://diagnostics.ecoenergygroup.com
- API-Dokumentation: https://diagnostics.ecoenergygroup.com/swagger-ui/
- Lokale Konfigurationen liegen als JSON-Dateien vor

## API-Endpunkte

### Authentifizierung
```
POST /api/auth/login
Body: { "username": "...", "password": "..." }
Response: { "token": "JWT...", "refreshToken": "..." }
```

### Dashboards
```
POST /api/dashboard
Body: Dashboard JSON (komplettes Dashboard-Objekt)
Header: X-Authorization: Bearer {token}
```

### Rule Chains
```
POST /api/ruleChains/import
Body: Array von Rule Chain JSONs
Header: X-Authorization: Bearer {token}

POST /api/ruleChain
Body: Einzelne Rule Chain JSON
Header: X-Authorization: Bearer {token}
```

### Widgets
```
POST /api/widgetsBundle
Body: Widget Bundle JSON
Header: X-Authorization: Bearer {token}
```

## Betroffene Dateien

### Zu erstellen:
- `sync/sync.js` - Hauptsync-Script
- `sync/backup.js` - Backup-Funktionalität
- `sync/api.js` - ThingsBoard API Client
- `.env` - Credentials (nicht committen!)
- `.env.example` - Template für Credentials

### Bestehende Dateien (zu synchronisieren):
- `dashboards/*.json`
- `rule chains/*.json`
- `widgets/*.json`

## Akzeptanzkriterien

- [ ] `.env` Datei für Credentials (username, password, base_url)
- [ ] `.env.example` als Template (ohne echte Credentials)
- [ ] `.gitignore` aktualisiert um `.env` auszuschließen
- [ ] Login-Funktion die JWT Token abruft
- [ ] Token-Refresh wenn abgelaufen
- [ ] Backup-Funktion: Erstellt Kopie in `backups/YYYY-MM-DD_HH-mm-ss/` vor jedem Sync
- [ ] Upload-Funktion für Dashboards (`POST /api/dashboard`)
- [ ] Upload-Funktion für Rule Chains (`POST /api/ruleChain`)
- [ ] Upload-Funktion für Widgets (`POST /api/widgetsBundle`)
- [ ] Rollback-Funktion: Stellt letztes Backup wieder her
- [ ] CLI Interface mit Befehlen: `sync`, `backup`, `rollback`, `status`
- [ ] Fehlerbehandlung mit aussagekräftigen Meldungen
- [ ] Logging aller Operationen

## Constraints

- Node.js (>=16) verwenden
- Keine externen Abhängigkeiten außer: `dotenv`, `node-fetch` (oder natives fetch)
- Alle API-Calls müssen Fehler abfangen
- Backups müssen vor JEDEM Upload erstellt werden
- Credentials dürfen NIEMALS ins Repository committed werden

## Beispiel-Verwendung

```bash
# Credentials in .env setzen
cp .env.example .env
# .env editieren mit echten Werten

# Alle Konfigurationen synchronisieren
node sync/sync.js sync

# Nur Dashboards synchronisieren
node sync/sync.js sync --dashboards

# Nur Rule Chains synchronisieren
node sync/sync.js sync --rulechains

# Backup erstellen (ohne Upload)
node sync/sync.js backup

# Letztes Backup wiederherstellen
node sync/sync.js rollback

# Status anzeigen (letzter Sync, Backups)
node sync/sync.js status
```

## Projektstruktur nach Implementierung

```
ECO TB/
├── sync/
│   ├── sync.js          # CLI Entry Point
│   ├── api.js           # ThingsBoard API Client
│   ├── backup.js        # Backup/Rollback Funktionen
│   └── config.js        # Konfiguration laden
├── backups/             # Backup-Verzeichnis (git-ignored)
│   └── 2024-01-21_14-30-00/
│       ├── dashboards/
│       ├── rule chains/
│       └── widgets/
├── .env                 # Credentials (git-ignored)
├── .env.example         # Template
└── ...
```

---
*Erstellt von: Claude Code*
*Datum: 2025-01-21*
*Status: ready*

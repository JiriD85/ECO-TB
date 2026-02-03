# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project:** ECO Smart Diagnostics
**Platform:** ThingsBoard 4.2 PE (Professional Edition)
**Purpose:** HVAC/Building Automation Monitoring and Control System

**System-Dokumentation:** [docs/SYSTEM_MODEL.md](docs/SYSTEM_MODEL.md) - Entity-Modell, Kit-Typen, Telemetrie, Rollen

**UI-Dokumentation:**
- [docs/ECO_RESPONSIVE_DESIGN.md](docs/ECO_RESPONSIVE_DESIGN.md) - **Responsive Design Implementierung** (PFLICHT-Lektüre!)
- [docs/thingsboard-responsive-layouts.md](docs/thingsboard-responsive-layouts.md) - Breakpoints, States, Widget Copies
- [docs/ECO_DESIGN_SYSTEM.md](docs/ECO_DESIGN_SYSTEM.md) - Design Tokens, Farben, Typografie
- [docs/dialog-ui-components.md](docs/dialog-ui-components.md) - Dialog-Komponenten und CSS

## Common Commands

### ThingsBoard Sync Tool

```bash
# Push SINGLE dashboard to ThingsBoard (PREFERRED for dashboards!)
node sync/sync.js push administration
node sync/sync.js push measurements

# Push multiple specific dashboards
node sync/sync.js push administration measurements navigation

# Push SINGLE JS library (PREFERRED for JS!)
node sync/sync.js push-js "ECO Project Wizard"

# Push SINGLE rule chain
node sync/sync.js push-rulechain "Rule Chain Name"

# Sync ALL (ONLY for manual use - Claude should NEVER use these!)
# node sync/sync.js sync --js          # Syncs ALL JS libraries
# node sync/sync.js sync --i18n        # Syncs ALL translations
# node sync/sync.js sync --dashboards  # Syncs ALL dashboards

# Pull specific dashboard from ThingsBoard (ALWAYS pull before editing)
node sync/sync.js pull "Dashboard Name"

# Pull JS library from ThingsBoard
node sync/sync.js pull-js "ECO Data Importer"

# Pull translations
node sync/sync.js pull-i18n de_DE en_US

# List resources on server
node sync/sync.js list          # dashboards
node sync/sync.js list-js       # JS modules
node sync/sync.js list-i18n     # translations

# Backup/Rollback
node sync/sync.js backup
node sync/sync.js rollback
node sync/sync.js status
```

**Important Workflow:**
- Always `pull` before editing dashboards to get the latest version from the server
- Use `push <dashboard-name>` for syncing individual dashboards (NOT `sync --dashboards`)
- The sync tool handles optimistic locking by fetching the current version before upload

### Backup Best Practices

**IMPORTANT:** The sync tool automatically backs up only changed files before syncing. Each backup folder contains:
- Only the files that were modified (not all files)
- A `CHANGELOG.md` file listing what was backed up

**Rules for backups:**
1. Only sync the specific resource type you changed (use `--dashboards`, `--js`, or `--i18n` flags)
2. Never sync all resources at once unless explicitly needed
3. After a backup is created, edit the `CHANGELOG.md` in the backup folder to describe what you changed
4. Use descriptive commit messages when syncing

**Example workflow:**
```bash
# You modified only measurements.json dashboard
node sync/sync.js push measurements

# You modified only ECO Project Wizard.js
node sync/sync.js push-js "ECO Project Wizard"

# You modified only a rule chain
node sync/sync.js push-rulechain "Create Permission on Attribute"
```

### Claude Workflow Rules (WICHTIG!)

**PFLICHT-Regeln für Claude beim Bearbeiten von Dateien:**

1. **Manuelle Sicherung VOR Bearbeitung** - Nur die spezifische Datei sichern:
   ```bash
   # Vor Bearbeitung einer JS Library
   cp "js library/ECO Project Wizard.js" "backups/manual/ECO Project Wizard_$(date +%Y%m%d_%H%M%S).js"

   # Vor Bearbeitung eines Dashboards
   cp "dashboards/measurements.json" "backups/manual/measurements_$(date +%Y%m%d_%H%M%S).json"
   ```

2. **Vor Bearbeitung IMMER pullen** - Aktuelle Version vom Server holen:
   ```bash
   node sync/sync.js pull "Dashboard Name"
   node sync/sync.js pull-js "Library Name"
   ```

3. **NUR Einzel-Push Befehle verwenden** - NIEMALS Batch-Syncs (`sync --js`, `sync --dashboards`, etc.):
   ```bash
   # RICHTIG - Einzelne Ressourcen pushen:
   node sync/sync.js push <dashboard-name>        # Ein Dashboard
   node sync/sync.js push-js "Library Name"       # Eine JS Library
   node sync/sync.js push-rulechain "Chain Name"  # Eine Rule Chain

   # VERBOTEN - Batch-Syncs:
   node sync/sync.js sync --js          # NIEMALS!
   node sync/sync.js sync --dashboards  # NIEMALS!
   node sync/sync.js sync --i18n        # NIEMALS!
   ```

4. **Vor jedem Push prüfen**: Was habe ich tatsächlich geändert? Nur diese Datei pushen.

**Reihenfolge bei Änderungen:**
1. `pull` / `pull-js` - Aktuelle Version holen
2. `cp` - Manuelle Sicherung erstellen
3. Änderungen durchführen
4. `push` / `push-js` / `push-rulechain` - NUR die geänderte Datei pushen

### Environment Setup

Requires `.env` file with ThingsBoard credentials:
```
TB_BASE_URL=https://your-thingsboard-instance.com
TB_USERNAME=your-email@example.com
TB_PASSWORD=your-password
```

### Codex CLI (for code review/implementation)

```bash
source ~/.nvm/nvm.sh && nvm use 20
codex exec --approval-mode full-auto -q "task description"
```

## Directory Structure

```
ECO TB/
├── dashboards/           # ThingsBoard dashboard JSON configs (large files, 2-4 MB)
├── js library/           # JavaScript utility libraries (synced as JS_MODULE)
├── rule chains/          # ThingsBoard rule chains for data processing
├── widgets/              # Custom widget implementations
├── translation/          # Custom translations (de_DE_custom_translation.json)
├── tasks/                # Task specifications for multi-agent workflow
├── sync/                 # Sync tool (sync.js, api.js, backup.js)
└── backups/              # Automatic backups with .sync-status.json
```

## Architecture

### Dashboard JSON Structure

Dashboard files contain embedded widgets, entity aliases, and state controllers:

```
dashboard.json
├── configuration.widgets.<widget-id>
│   ├── config.datasources          # Data source definitions
│   ├── config.dataKeys             # Telemetry, attributes, entity fields
│   ├── config.settings             # Widget-specific display settings
│   └── config.actions              # Button actions (customPretty type)
├── configuration.entityAliases     # Dynamic entity references by ID
└── configuration.states            # Dashboard state controller (multi-view)
```

### Widget Actions

There are two action types for custom dialogs:

#### `customPretty` - Inline dialog definition
Used when dialog HTML/CSS/JS is defined directly in the action:
```json
{
  "type": "customPretty",
  "customHtml": "<form>...</form>",
  "customCss": ".my-class { ... }",
  "customFunction": "let $injector = widgetContext.$scope.$injector; ...",
  "customResources": []
}
```

#### `custom` - Library function call (PREFERRED)
Used when calling a function from a JS library. **IMPORTANT:** `customFunction` must be an **object** with `body` and `modules`:
```json
{
  "type": "custom",
  "customFunction": {
    "body": "const measurementId = entityId;\nprojectWizard.openMyDialog(widgetContext, measurementId);",
    "modules": {
      "projectWizard": "tb-resource;/api/resource/js_module/tenant/ECO Project Wizard.js"
    }
  }
}
```

**WRONG structure (will NOT work):**
```json
{
  "type": "custom",
  "modules": { ... },
  "customFunction": "string..."
}
```

**Module import format:**
```
"moduleName": "tb-resource;/api/resource/js_module/tenant/FILENAME.js"
```

**ThingsBoard Services** (inject via `$injector.get(widgetContext.servicesMap.get('serviceName'))`):
- `customDialog` - Open custom dialogs
- `attributeService` - Read/write entity attributes
- `entityRelationService` - Manage entity relations
- `entityGroupService` - Manage entity groups
- `deviceService`, `assetService`, `customerService` - Entity CRUD

**ThingsBoard CSS Utilities** (Tailwind-like classes available in widgets):
```
flex, flex-1, flex-col, flex-wrap
items-center, items-start, items-end, justify-end, justify-between
gap-1, gap-2, gap-3, p-3, p-4, px-4, mb-2, mb-4, mt-2, mx-4
text-lg, font-semibold
```

### ECO Design System & UI Components

**WICHTIG:** Claude agiert als UI-Experte für dieses Projekt. Bei JEDER Bearbeitung von Dialogen, Actions oder Libraries MUSS die Design-Vorlage konsultiert werden!

#### Design-Vorlagen (IMMER verwenden!)

| Dokument | Inhalt |
|----------|--------|
| **[docs/dialog-ui-components.md](docs/dialog-ui-components.md)** | Komplette UI-Komponenten-Referenz mit HTML/CSS |
| [docs/ECO_DESIGN_SYSTEM.md](docs/ECO_DESIGN_SYSTEM.md) | Allgemeine Design-Prinzipien |

#### UI-Experten-Regeln

1. **VOR dem Erstellen/Bearbeiten von Dialogen:**
   - `docs/dialog-ui-components.md` lesen
   - Passende Komponenten aus der Vorlage verwenden
   - Basis-CSS IMMER inkludieren (Header, Content, Footer)

2. **Dialog-Grundstruktur (PFLICHT):**
   ```html
   <div class="ui-demo-dialog">
     <mat-toolbar class="eco-dialog-header">...</mat-toolbar>
     <div class="dialog-content">...</div>
     <div class="dialog-footer">...</div>
   </div>
   ```

3. **Pflicht-CSS für jeden Dialog:**
   ```css
   .eco-dialog-header {
     background-color: var(--tb-primary-500);
     color: white;
     /* ... siehe Vorlage */
   }
   .dialog-content {
     max-height: 70vh;
     overflow-y: auto;
     /* ... siehe Vorlage */
   }
   ```

4. **Bei neuen Actions:**
   - ALLE Felder von existierender Action kopieren
   - Nur `id`, `name`, `icon`, `customHtml`, `customCss` ändern
   - NIEMALS Action von Grund auf neu erstellen

5. **PFLICHT-SKILL für Actions: `/update-tb-action`**
   - **IMMER** den Skill `/update-tb-action <action-name>` verwenden wenn:
     - Eine bestehende Action bearbeitet wird
     - Eine neue Action erstellt wird
     - Dialog-HTML, CSS oder JS geändert wird
   - Der Skill garantiert:
     - Design Guidelines werden angewendet
     - Code wird vor Push validiert
     - Keine Syntax-Fehler im Production-Code
   - **NIEMALS** Action-Code direkt ändern und pushen ohne Validierung!

#### Verfügbare UI-Komponenten

**Formular-Elemente (Demo 1):**
- Text Inputs, Dropdowns, Autocomplete
- Date/Time Pickers
- Checkboxes, Radio Buttons, Slide Toggles
- Buttons (alle Varianten)
- Progress Indicators, Chips, Stepper

**Display-Elemente (Demo 2):**
- Cards mit Werten
- Expansion Panel
- Selection List
- Data Table mit Status-Chips
- Toolbar, Search Input
- Bottom Navigation, Tree Structure

#### Schnellreferenz

```html
<!-- Blauer Header -->
<mat-toolbar class="eco-dialog-header">
  <mat-icon class="header-icon">icon_name</mat-icon>
  <h2 class="header-title">Title</h2>
  <span class="flex-1"></span>
  <button mat-icon-button (click)="cancel()" class="close-btn">
    <mat-icon>close</mat-icon>
  </button>
</mat-toolbar>

<!-- Section Card -->
<div class="section-card">
  <div class="section-header">
    <mat-icon>icon</mat-icon>
    <span>Section Title</span>
  </div>
  <div class="section-body">
    <!-- Content -->
  </div>
</div>

<!-- Status Chips -->
<span class="status-chip status-online">Online</span>
<span class="status-chip status-offline">Offline</span>
```

### JS Libraries

Three main libraries in `js library/`:
- **ECO Diagnostics Utils JS.js** - Progress display, styling functions, address search
- **ECO Data Importer.js** - CSV import, device assignment dialogs
- **ECO Project Wizard.js** - Project/Measurement dialogs (add, edit, parameters)

Key exports:
- Utils: `getProgressColor()`, `getProgressHtml()`, `getMeasurementTypeStyle()`, `getInstallationTypeStyle()`
- Data Importer: `csvDataImportDialog()`, `assignDeviceToMeasurement()`
- Project Wizard: `openAddProjectDialog()`, `openAddMeasurementDialog()`, `openMeasurementParametersDialog()`

### Editing Dashboard JSON Programmatically

Dashboard files are large (2-4 MB) and have complex nested structures. When modifying actions or widgets:

1. **Use Node.js for complex edits** - String replacement often fails due to duplicates or escaping issues:
```javascript
const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

// Navigate to widgets and actions
for (const stateId in dashboard.configuration.states) {
  const state = dashboard.configuration.states[stateId];
  for (const layoutId in state.layouts) {
    const layout = state.layouts[layoutId];
    for (const widgetId in layout.widgets) {
      const widget = layout.widgets[widgetId];
      // Modify widget.config.actions...
    }
  }
}

fs.writeFileSync('dashboards/measurements.json', JSON.stringify(dashboard, null, 2));
```

2. **Find actions by unique ID** - Each action has a unique `id` field that persists across edits.

3. **Always pull before editing** - Dashboard versions change frequently on the server.

### Markdown/HTML Card Widgets

See [docs/markdown-widget-patterns.md](docs/markdown-widget-patterns.md) for detailed patterns:
- Konsistente Widget-Konfiguration (`sizeY: 11`, `applyDefaultMarkdownStyle: true`)
- Header-Styling mit Gradient, Stats, Action Buttons
- Datasource-Konfiguration mit eindeutigen Labels
- Häufige Fehler und Lösungen

### Rule Chains

Rule chains define message processing flow:
- `connections` array with `fromIndex` and `toIndex`
- Node types: filter, transformation, action, external

#### ThingsBoard API über Rule Chains aufrufen (WICHTIG!)

**Problem:** Customer Users können bestimmte API-Endpoints nicht direkt aufrufen (z.B. Permission erstellen).
**Lösung:** API-Calls über Rule Chain mit System-JWT-Token ausführen.

**Korrekte Rule Chain Struktur (4 Nodes):**

```
[Input] → [Save Original] → [Login API] → [Prepare Body + Token] → [API Call]
```

**WICHTIG:** Nach einem REST API Call wird `msg` mit dem Response überschrieben!
Deshalb MUSS vor dem Login ein Script Node die Original-Daten in metadata speichern.

**Node 1: Save Original - Original-Daten speichern UND Login-Body setzen**
```javascript
// TBEL Script - MUSS vor Login ausgeführt werden!
// 1. Original-Daten in metadata speichern
metadata.originalData = JSON.stringify(msg.createPermission);
// 2. msg mit Login-Credentials überschreiben (wird Body für Login API)
var loginBody = { username: "api-user@example.com", password: "password123" };
return { msg: loginBody, metadata: metadata, msgType: msgType };
```
**WICHTIG:** Die `msg` wird als Body für den nächsten REST API Call verwendet!

**Node 2: Login API Call**
```
Type: REST API Call
Name: Login
URL: https://diagnostics.ecoenergygroup.com/api/auth/login
Method: POST
Headers:
  Content-Type: application/json
Body: {"username":"system@email.com","password":"password123"}
```
Nach diesem Node: `msg` = Login Response mit token!

**Node 3: Script - Token extrahieren UND Request Body vorbereiten**
```javascript
// TBEL Script - Token aus msg (=Login Response) extrahieren
var jwtToken = msg.token;

// Original-Daten aus metadata wiederherstellen (wurden in Node 1 gespeichert!)
var permData = JSON.parse(metadata.originalData);

// Permission Request Body bauen
var permissionRequest = {
    userGroupId: { entityType: 'ENTITY_GROUP', id: permData.userGroupId },
    roleId: { entityType: 'ROLE', id: permData.roleId }
};

if (permData.entityGroupId != null) {
    permissionRequest.entityGroupId = { entityType: 'ENTITY_GROUP', id: permData.entityGroupId };
    permissionRequest.entityGroupType = permData.entityGroupType;
}

// Neuer msg wird zum Body des nächsten API Calls
return { msg: permissionRequest, metadata: metadata, msgType: msgType };
```

**Node 3: Create Permission API Call**
```
Type: REST API Call
Name: Create Permission
URL: https://diagnostics.ecoenergygroup.com/api/groupPermission
Method: POST
Headers:
  Content-Type: application/json
  X-Authorization: Bearer ${jwtToken}
Body: (verwendet msg aus vorherigem Node)
```

**KRITISCH - Metadaten-Variablen:**
- `${jwtToken}` - Referenziert `metadata.jwtToken` (aus Script Node)
- `${ss_key}` - Server Scope Attribute mit `ss_` Prefix NUR wenn via "Fetch Attributes" Node geladen
- Bei Attribut-Update Events: Attribute sind direkt in `msg` verfügbar (OHNE Prefix!)
- Variablen werden in URL, Headers ersetzt, aber NICHT im Body (Body = msg)

**Häufige Fehler:**
1. Token im Body statt in metadata speichern
2. `${systemJwtToken}` verwenden (existiert NICHT!)
3. Body als String statt als Object zurückgeben

Quellen:
- [GitHub Issue #4204](https://github.com/thingsboard/thingsboard/issues/4204)
- [GitHub Issue #2913](https://github.com/thingsboard/thingsboard/issues/2913)

#### Rule Chain: Create Permission on Attribute

**Zweck:** Erstellt Permissions für Customer Users die keine direkten API-Rechte haben.

**Trigger:** Device Attribut `createPermission` wird gesetzt.

**Pfade:**
```
Input → Route by Attribute (switch)
  ├── permission → Login → Prepare → Create Permission API
  ├── EntityGroup → Login → Prepare → Create EntityGroup API
  └── addEntities → Login → Prepare → Add Entities API
```

**Trigger Device:** `e5e10f60-fef5-11f0-a0ee-33b9bcf3ddd0` (Permission Trigger Device)

**Code-Pattern zum Triggern:**
```javascript
function createPermissionViaTrigger(userGroupId, roleId, entityGroupId, entityGroupType) {
  const permissionTriggerDevice = {
    entityType: 'DEVICE',
    id: 'e5e10f60-fef5-11f0-a0ee-33b9bcf3ddd0'
  };

  const permissionData = {
    userGroupId: userGroupId,
    roleId: roleId
  };

  if (entityGroupId) {
    permissionData.entityGroupId = entityGroupId;
    permissionData.entityGroupType = entityGroupType;
  }

  return attributeService.saveEntityAttributes(
    permissionTriggerDevice,
    'SERVER_SCOPE',
    [{ key: 'createPermission', value: JSON.stringify(permissionData) }]
  );
}
```

**Verbindung mit Root Rule Chain:**
- Das Device Profile muss die "Create Permission on Attribute" Rule Chain zugewiesen haben
- ODER die Root Rule Chain muss POST_ATTRIBUTES_REQUEST an diese Rule Chain weiterleiten

#### Debug Mode für Rule Chain Nodes

**Debug aktivieren (in JSON):**
```json
{
  "type": "org.thingsboard.rule.engine.rest.TbRestApiCallNode",
  "name": "Login Permission",
  "debugSettings": {
    "allEnabled": true
  },
  ...
}
```

**Debug über API aktivieren:**
```bash
# 1. Rule Chain holen
GET /api/ruleChain/{ruleChainId}/metadata

# 2. Node debugSettings ändern und speichern
POST /api/ruleChain/metadata
{
  "ruleChainId": { "id": "...", "entityType": "RULE_CHAIN" },
  "nodes": [
    {
      "id": { "id": "...", "entityType": "RULE_NODE" },
      "debugSettings": { "allEnabled": true },
      ...
    }
  ]
}
```

**Debug Events ansehen:**
1. Rule Chain öffnen → Node doppelklicken → Events Tab
2. Event Type: "Debug" auswählen
3. Zeitraum: "last 1 hour" oder erweitern

**WICHTIG:** Debug Mode erzeugt viele Events und sollte in Production nur temporär aktiviert werden!

## Entity Model

**Hierarchy:** Customer → Project → Measurement → Device

**Entity Types:**
- `CUSTOMER` - Building/client
- `ASSET` (type: Project) - Measurement campaign
- `ASSET` (type: Measurement) - Individual measurement point (ultrasonic, import, interpolation)
- `DEVICE` - Physical sensors (P-Flow D116, Temperature Sensor, Room Sensor CO2, RESI)

**Relations:** `Measurement` type from parent to child (FROM Project TO Measurement, FROM Measurement TO Device)

**Progress States:** `in preparation` → `active` → `finished` | `aborted`

## Permission Model

### User Types & Roles

ThingsBoard PE uses two role types:
- **GENERIC Role:** Permissions apply to ALL entities of a type (e.g., all Assets of the Customer)
- **GROUP Role:** Permissions apply only to entities in a specific Entity Group

### Customer User Groups (created per Customer)

| User Group | GENERIC Role | Dashboard GROUP Role |
|------------|--------------|---------------------|
| Belimo Retrofit Read Only | Belimo Retrofit Viewers | Belimo Retrofit |
| Belimo Retrofit Users | Belimo Retrofit Users | Belimo Retrofit |
| Belimo Retrofit Administrators | Belimo Retrofit Administrators | Belimo Retrofit + Administrators |
| Belimo Retrofit Engineer | Belimo Retrofit Engineer | Belimo Retrofit |

### Project Users (Project Viewers)

Created via "Project Users" dialog in Administration Dashboard. Each project viewer:

1. **User Group:** `Viewers: [ProjectName]` (owned by Customer)
2. **Asset Group:** `Project Assets: [ProjectName]` (contains Project + Measurements)

**Permission assigned (NUR EINE!):**

| Permission | Role Type | Role Name | Target |
|------------|-----------|-----------|--------|
| Project/Asset Access | GROUP | Belimo Retrofit Read Only | Asset Group "Project Assets: [ProjectName]" |

**WICHTIG - Project Viewer braucht NUR die Asset Group Permission:**
- KEINE GENERIC Permission erstellen (kein `null, null` für entityGroupId)
- KEINE Dashboard Group Permission (Dashboard-Zugriff kommt über andere Mechanismen)
- NUR die GROUP Permission mit "Belimo Retrofit Read Only" auf die Asset Group

**Warum nur Asset Group Permission?**
- Die GENERIC Role "Belimo Retrofit Viewers" wird über die User Group Membership zugewiesen
- Dashboard-Zugriff ist bereits durch die User Group konfiguriert
- Zusätzliche GENERIC Permissions würden zu viele Rechte geben

### GENERIC Role: Belimo Retrofit Viewers

**IMPORTANT:** This role must NOT have ASSET permissions, otherwise Project Users can see ALL projects!

Correct configuration:
```
USER: READ, READ_ATTRIBUTES
CUSTOMER: READ
```

No ASSET permissions - asset access comes only from GROUP role.

### API Endpoints for Permissions

- **Get permissions for user group:** `GET /api/userGroup/{userGroupId}/groupPermissions`
- **Create permission:** `POST /api/groupPermission`
- **Swagger UI:** https://diagnostics.ecoenergygroup.com/swagger-ui/
- **API Docs JSON:** https://diagnostics.ecoenergygroup.com/v3/api-docs/thingsboard

### Code Pattern: Check Permissions Before Creating

```javascript
// Fetch existing permissions first
widgetContext.http.get('/api/userGroup/' + userGroup.id.id + '/groupPermissions').pipe(
  widgetContext.rxjs.switchMap(existingPermissions => {
    // Check if permission exists before creating
    const hasPermission = existingPermissions.some(p =>
      p.roleId?.id === roleId.id &&
      (entityGroupId ? p.entityGroupId?.id === entityGroupId.id : !p.entityGroupId)
    );

    if (hasPermission) {
      console.log('Permission already exists, skipping');
      return widgetContext.rxjs.of(null);
    }

    // Create only if missing
    return roleService.saveGroupPermission({...});
  })
);
```

## Multi-Agent Workflow

See [AGENTS.md](AGENTS.md) for Claude + Codex workflow details.

Task specifications in `tasks/TASK_NAME.md` with format from `tasks/TEMPLATE.md`.
Status progression: draft → ready → in-progress → completed → review

## Backlog / Future Improvements

### Project Viewer Management (btn-add-user, btn-manage-project-users)

**Low Priority:**

1. **Measurement-Synchronisation**
   - Problem: Neue Measurements nach Viewer-Erstellung sind nicht automatisch in der Asset Group
   - Lösung: Bei Dialog-Öffnung (btn-manage-project-users) Asset Group mit aktuellen Measurements synchronisieren

2. **Cleanup bei Entfernung**
   - Wenn letzter User aus Viewer Group entfernt wird: User Group + Asset Group + Permissions automatisch löschen?
   - Bei Viewer Group Löschung: Asset Group und Permissions auch aufräumen?

### Platform Features

1. **Übersetzung Custom Actions (i18n)**
   - Alle Custom Action Dialoge mit i18n-Keys versehen
   - Texte in de_DE_custom_translation.json und en_US_custom_translation.json auslagern
   - Einheitliche Übersetzungsstruktur für alle Dialoge

2. **Alarming**
   - Dashboard-Widgets für Alarm-Anzeige und -Verwaltung
   - Rule Chain Logik für Alarm-Auslösung und -Eskalation
   - Benachrichtigungen (Email, Push, etc.)

3. **Derived Telemetry & Calculated Fields**
   - Rule Chain Nodes für berechnete Telemetrie-Werte
   - Aggregationen und Ableitungen aus bestehenden Datenpunkten
   - Calculated Attributes basierend auf Telemetrie

4. **Parameter Fields Anpassung**
   - Project: Zusätzliche/angepasste Felder
   - Measurement: Erweiterte Konfigurationsoptionen
   - Customer: Kundenspezifische Attribute
   - Device: Geräteparameter und Konfiguration

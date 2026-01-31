# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project:** ECO Smart Diagnostics
**Platform:** ThingsBoard 4.2 PE (Professional Edition)
**Purpose:** HVAC/Building Automation Monitoring and Control System

## Common Commands

### ThingsBoard Sync Tool

```bash
# Push SINGLE dashboard to ThingsBoard (PREFERRED for dashboards!)
node sync/sync.js push administration
node sync/sync.js push measurements

# Push multiple specific dashboards
node sync/sync.js push administration measurements navigation

# Sync ALL JS libraries to ThingsBoard
node sync/sync.js sync --js

# Sync ALL translations to ThingsBoard
node sync/sync.js sync --i18n

# Sync ALL dashboards (AVOID - use push instead!)
node sync/sync.js sync --dashboards

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
node sync/sync.js sync --dashboards
# This will backup only measurements.json (if changed) and sync dashboards

# You modified only ECO Project Wizard.js
node sync/sync.js sync --js
# This will backup only the changed JS file and sync JS libraries
```

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

### ECO Design System

**WICHTIG:** Für alle Custom Dialoge das ECO Design System verwenden!
Siehe: [docs/ECO_DESIGN_SYSTEM.md](docs/ECO_DESIGN_SYSTEM.md)

Grundprinzipien:
- **Header:** `eco-dialog-header` Klasse mit `var(--tb-primary-500)` Background
- **Content:** Section Cards mit weißem Hintergrund und Primary-Akzent links
- **Form Fields:** `appearance="fill"`, Icons mit `matSuffix` (rechts)
- **Border Radius:** 0 (keine Rundungen)
- **Footer:** `dialog-footer` mit border-top und #fafafa Background

```html
<mat-toolbar class="eco-dialog-header">
  <mat-icon class="header-icon">icon_name</mat-icon>
  <h2 class="header-title">Title</h2>
  <span class="flex-1"></span>
  <button mat-icon-button (click)="cancel()" class="close-btn">
    <mat-icon>close</mat-icon>
  </button>
</mat-toolbar>
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

**Permissions assigned:**

| Permission | Role Type | Role Name | Target |
|------------|-----------|-----------|--------|
| Login & Profile | GENERIC | Belimo Retrofit Viewers | - |
| Dashboard Access | GROUP | Belimo Retrofit Read Only | Dashboard Group "Belimo Retrofit" |
| Project/Asset Access | GROUP | Belimo Retrofit Read Only | Asset Group "Project Assets: [ProjectName]" |

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

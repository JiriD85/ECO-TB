# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project:** ECO Smart Diagnostics
**Platform:** ThingsBoard 4.2 PE (Professional Edition)
**Purpose:** HVAC/Building Automation Monitoring and Control System

## Common Commands

### ThingsBoard Sync Tool

```bash
# Sync dashboards to ThingsBoard
node sync/sync.js sync --dashboards

# Sync JS libraries to ThingsBoard
node sync/sync.js sync --js

# Sync translations to ThingsBoard
node sync/sync.js sync --i18n

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

**Important Workflow:** Always `pull` before editing dashboards to get the latest version from the server. The sync tool handles optimistic locking by fetching the current version before upload.

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

Pattern for dialog with toolbar and close button:
```html
<mat-toolbar class="flex items-center" color="primary">
  <h2>Title</h2>
  <span class="flex-1"></span>
  <button mat-icon-button (click)="cancel()"><mat-icon>close</mat-icon></button>
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

## Multi-Agent Workflow

See [AGENTS.md](AGENTS.md) for Claude + Codex workflow details.

Task specifications in `tasks/TASK_NAME.md` with format from `tasks/TEMPLATE.md`.
Status progression: draft → ready → in-progress → completed → review

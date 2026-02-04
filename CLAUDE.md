# CLAUDE.md

## Project Overview

**Project:** ECO Smart Diagnostics
**Platform:** ThingsBoard 4.2 PE
**Purpose:** HVAC/Building Automation Monitoring

## KRITISCHE WORKFLOW-REGELN

### Reihenfolge bei JEDER Bearbeitung

```
1. PULL    → node sync/sync.js pull "Name" / pull-js "Name"
2. BACKUP  → cp "file" "backups/manual/file_$(date +%Y%m%d_%H%M%S).ext"
3. EDIT    → Aenderungen durchfuehren
4. PUSH    → node sync/sync.js push name / push-js "Name"
```

### VERBOTEN - Niemals ausfuehren!

```bash
node sync/sync.js sync --js          # VERBOTEN!
node sync/sync.js sync --dashboards  # VERBOTEN!
```

### Haeufige Befehle

```bash
# Push (einzeln!)
node sync/sync.js push measurements
node sync/sync.js push-js "ECO Project Wizard"
node sync/sync.js push-rulechain "Name"

# Pull (vor Bearbeitung!)
node sync/sync.js pull measurements
node sync/sync.js pull-js "ECO Project Wizard"

# Liste
node sync/sync.js list / list-js / list-i18n
```

## Directory Structure

```
ECO-TB/
├── dashboards/       # Dashboard JSONs (2-4 MB)
├── js library/       # JS Libraries (ASCII only!)
├── rule chains/      # Rule Chain JSONs
├── widgets/          # Custom Widgets
├── translation/      # i18n (de_DE, en_US)
├── docs/             # Dokumentation
│   └── claude/       # Detail-Docs fuer Claude
├── sync/             # Sync Tool
└── backups/          # Auto + Manual Backups
```

## Detail-Dokumentation

| Thema | Dokument |
|-------|----------|
| **Sync Tool** | [docs/claude/SYNC_TOOL.md](docs/claude/SYNC_TOOL.md) |
| **Dashboard Editing** | [docs/claude/DASHBOARD_EDITING.md](docs/claude/DASHBOARD_EDITING.md) |
| **Rule Chains** | [docs/claude/RULE_CHAINS.md](docs/claude/RULE_CHAINS.md) |
| **Entity & Permissions** | [docs/claude/ENTITY_PERMISSIONS.md](docs/claude/ENTITY_PERMISSIONS.md) |
| **JS Libraries** | [docs/claude/JS_LIBRARIES.md](docs/claude/JS_LIBRARIES.md) |
| **UI Components** | [docs/dialog-ui-components.md](docs/dialog-ui-components.md) |
| **Design System** | [docs/ECO_DESIGN_SYSTEM.md](docs/ECO_DESIGN_SYSTEM.md) |
| **Responsive Design** | [docs/ECO_RESPONSIVE_DESIGN.md](docs/ECO_RESPONSIVE_DESIGN.md) |
| **System Model** | [docs/SYSTEM_MODEL.md](docs/SYSTEM_MODEL.md) |

## Quick Reference

### Widget Action mit Library

```json
{
  "type": "custom",
  "customFunction": {
    "body": "projectWizard.openDialog(widgetContext, entityId);",
    "modules": {
      "projectWizard": "tb-resource;/api/resource/js_module/tenant/ECO Project Wizard.js"
    }
  }
}
```

### Entity Hierarchie

```
Customer → Project → Measurement → Device
```

### Progress States

```
in preparation → active → finished | aborted
```

## Skills (Shortcuts)

| Skill | Funktion |
|-------|----------|
| `/tbsync` | Geaenderte Dateien zum Server pushen |
| `/tbpull` | Dateien vom Server holen |
| `/commit` | Git Commit erstellen |
| `/deploy` | Sync + Commit + Push |
| `/validate` | Code validieren |
| `/update-tb-action` | Action bearbeiten mit Validierung |

## Subagenten nutzen

Fuer komplexe Suchen den `Explore` Agent verwenden um Context zu sparen:

```
Task(subagent_type="Explore", prompt="Finde alle Widgets im measurements Dashboard die...")
```

# CLAUDE.md

## Project Overview

**Project:** ECO Smart Diagnostics
**Platform:** ThingsBoard 4.2 PE
**Purpose:** HVAC/Building Automation Monitoring

### Verwandte Repos

| Repo | Zweck |
|------|-------|
| **ECO-TB** (dieses) | Dashboards, JS Libraries, Rule Chains, Widgets, i18n |
| **ECO-TB-Custom-Widgets** | 10 ECharts Widgets, shared utils |
| **ECO-IOT-GW** | IoT Gateway (FastAPI + Vue.js, Raspberry Pi) |
| **ECO-TB-Forecast** | AI/ML Forecasting |
| **ECO-TB-Weather** | Wetterdaten-Integration |
| **ECO-TB-Analysis** | Data Catalog, Analytics Docs |

**Datenfluss:** Sensoren → IoT Gateway (ECO-IOT-GW) → TB Gateway Docker → TB Server (Rule Chains) → Dashboards (ECO-TB) + Widgets (ECO-TB-Custom-Widgets)

### Memory & Projektmanagement

- **claude-mem** erfasst automatisch Entscheidungen und Patterns ueber Sessions
- **GSD** (`/gsd:*`) fuer Milestone-Planung und Phase-Execution
- **MEMORY.md** in `~/.claude/projects/` fuer persistenten Kontext

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
| **Subagenten** | [docs/claude/SUBAGENTS.md](docs/claude/SUBAGENTS.md) |
| **UI Components** | [docs/dialog-ui-components.md](docs/dialog-ui-components.md) |
| **Design System** | [docs/ECO_DESIGN_SYSTEM.md](docs/ECO_DESIGN_SYSTEM.md) |
| **Responsive Design** | [docs/ECO_RESPONSIVE_DESIGN.md](docs/ECO_RESPONSIVE_DESIGN.md) |
| **System Model** | [docs/SYSTEM_MODEL.md](docs/SYSTEM_MODEL.md) |
| **ThingsBoard API** | [docs/thingsboard-api.json](docs/thingsboard-api.json) (OpenAPI 3.1, `grep` zum Suchen) |

## Domain Knowledge (WICHTIG!)

| Thema | Dokument |
|-------|----------|
| **Data Catalog** | [analysis/ECO_Data_Catalog.md](analysis/ECO_Data_Catalog.md) - Attribute, Telemetrie, Calculated Fields, Analytics |
| **Alarming Konzept** | [analysis/ECO_Alarming_Concept.md](analysis/ECO_Alarming_Concept.md) - Schwellwerte, Rule Chains, Eskalation |
| **Analytics Funktionen** | [analysis/ECO_Analytics_Core_Functions.md](analysis/ECO_Analytics_Core_Functions.md) - Berechnungen, Formeln |

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

## Skills (PROAKTIV nutzen!)

**Skills automatisch einsetzen wenn relevant - NICHT auf User warten!**

### ThingsBoard

| Skill | Funktion |
|-------|----------|
| `/tbsync` | Geaenderte Dateien zum Server pushen |
| `/tbpull` | Dateien vom Server holen |
| `/tb-widget <name>` | Widget-Code aus Dashboard extrahieren |
| `/tb-state [name]` | Dashboard-States analysieren |
| `/tb-find <begriff>` | In Dashboards suchen |
| `/update-tb-action` | Action bearbeiten mit Validierung |

### Chrome/UI Analyse

| Skill | Funktion |
|-------|----------|
| `/tb-ui` | Screenshot + Console + Network + Zusammenfassung |
| `/tb-debug` | Tiefe Fehleranalyse mit JS Ausfuehrung |
| `/tb-inspect [element]` | UI-Elemente finden, DOM-Struktur lesen |

### Git & Deploy

| Skill | Funktion |
|-------|----------|
| `/commit` | Git Commit erstellen |
| `/deploy` | Sync + Commit + Push |
| `/validate` | Code validieren |

## Subagenten nutzen

**WICHTIG:** Bei grossen Dateien (Dashboards, Libraries) Subagenten verwenden!

| Task | Agent |
|------|-------|
| Codebase durchsuchen | `Explore` |
| Dashboard-Struktur finden | `Explore` |
| Feature planen | `feature-dev:code-architect` |
| Code verstehen | `feature-dev:code-explorer` |
| Code Review | `feature-dev:code-reviewer` |
| Research (Web, Docs) | `general-purpose` |

**Beispiele:**

```
# Dashboard durchsuchen
Task(subagent_type="Explore", prompt="Finde im measurements.json alle Widgets mit 'alarm' im Namen")

# Feature planen
Task(subagent_type="feature-dev:code-architect", prompt="Plane einen neuen Dialog fuer X basierend auf bestehenden Patterns in ECO Project Wizard.js")

# Code Review nach Aenderungen
Task(subagent_type="feature-dev:code-reviewer", prompt="Review die Aenderungen in ECO Project Wizard.js")
```

Details: [docs/claude/SUBAGENTS.md](docs/claude/SUBAGENTS.md)

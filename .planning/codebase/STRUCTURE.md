# Codebase Structure

**Analysis Date:** 2026-01-26

## Directory Layout

```
ECO-TB/
├── .planning/                    # GSD documentation output
│   └── codebase/
│       ├── ARCHITECTURE.md       # Architecture patterns and layers
│       └── STRUCTURE.md          # This file
├── sync/                         # ThingsBoard sync tool (Node.js CLI)
│   ├── sync.js                   # Main entry point
│   ├── api.js                    # ThingsBoard API client
│   ├── backup.js                 # Backup and recovery logic
│   ├── config.js                 # Environment configuration loader
│   ├── fetch-templates.js        # Widget template fetcher
│   ├── package.json              # Sync tool dependencies
│   ├── package-lock.json         # Dependency lock file
│   └── README.md                 # Sync tool documentation
├── dashboards/                   # ThingsBoard dashboard JSON configs
│   ├── measurements.json         # Main measurement UI (38K lines)
│   ├── administration.json       # Admin panel (16K lines)
│   ├── navigation.json           # Navigation/menu dashboard
│   ├── analysis.json             # Analysis views
│   ├── monitoring.json           # Monitoring dashboard
│   └── alarming.json             # Alarm/alerting dashboard
├── js library/                   # JavaScript modules (ThingsBoard JS_MODULE)
│   ├── ECO Project Wizard.js     # Project/Measurement dialogs (2092 lines)
│   ├── ECO Data Importer.js      # CSV import functionality (4082 lines)
│   ├── ECO Diagnostics Utils JS.js  # Utilities & styling (1122 lines)
│   └── ECO_Diagnostics_Utils_JS_FINAL.js  # Legacy/backup version (949 lines)
├── rule chains/                  # ThingsBoard rule chain configs
│   ├── root_rule_chain.json      # Primary message processing pipeline
│   ├── resi.json                 # RESI device-specific processing
│   ├── resi_device.json          # RESI device rule chain variant
│   └── get_openweather_data_rest_api.json  # Weather data integration
├── widgets/                      # Custom widget bundle definitions
│   ├── SD Administration Entities Table Gateways.json
│   ├── SD Administration Map Projects.json
│   └── SD Map Projects.json
├── templates/                    # Widget configuration templates
│   └── widgets/
│       ├── all/                  # All widget templates combined
│       ├── by_type/
│       │   ├── alarm/            # Alarm widget templates
│       │   ├── latest/           # Latest value widget templates
│       │   ├── rpc/              # RPC command widget templates
│       │   ├── static/           # Static content widget templates
│       │   └── timeseries/       # Time-series chart templates
│       └── detailed/             # Complex widget configurations (50-200 lines each)
│           ├── illuminance_chart_card_with_background.json
│           ├── hp_four_rate_energy_meter.json
│           ├── digital_gauges.digital_vertical_bar.json
│           └── [30+ other widget templates]
├── translation/                  # Custom translation files
│   ├── de_DE_custom_translation.json  # German translations
│   └── en_US_custom_translation.json  # English translations
├── tasks/                        # GSD task specifications
│   ├── TEMPLATE.md               # Task template for multi-agent workflows
│   └── thingsboard-sync.md       # Specific sync task specification
├── backups/                      # Automatic backup directory (git-ignored)
│   ├── 2026-01-23_13-20-32/      # Timestamped backup snapshots
│   │   ├── dashboards/
│   │   └── js library/
│   ├── 2026-01-23_13-37-43/
│   └── .sync-status.json         # Sync operation history
├── rule chains/                  # (See above - listed twice for clarity)
├── .env                          # Environment variables (git-ignored)
│                                 #   TB_BASE_URL, TB_USERNAME, TB_PASSWORD
├── .env.example                  # Example environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Root dependencies (dotenv, node-fetch)
├── package-lock.json             # Dependency lock file
├── CLAUDE.md                     # Claude Code guidance and examples
├── AGENTS.md                     # Multi-agent workflow documentation
├── .planning/codebase/           # (GSD output directory, listed above)
└── node_modules/                 # npm packages (git-ignored)
```

## Directory Purposes

**sync/:**
- Purpose: Node.js CLI tool for bidirectional ThingsBoard synchronization
- Contains: TypeScript/JavaScript source, configuration loaders, API wrappers, backup logic
- Key files: `sync.js` (main CLI), `api.js` (HTTP requests), `backup.js` (file operations), `config.js` (env loading)

**dashboards/:**
- Purpose: Store dashboard JSON configurations (downloaded from or to upload to ThingsBoard)
- Contains: Large JSON files (75-56,774 lines) defining UI layouts, widgets, datasources, actions
- Key files:
  - `measurements.json` - Main measurement dashboard (largest file, 38K lines)
  - `administration.json` - Admin management interface (16K lines)
  - `navigation.json` - Dashboard menu/navigation (1804 lines)

**js library/:**
- Purpose: Reusable JavaScript modules deployed as JS_MODULE resources in ThingsBoard
- Contains: Pure JavaScript functions without imports; dialog creators, data handlers, utilities
- Key files:
  - `ECO Project Wizard.js` - Main dialog handler for adding/editing projects and measurements
  - `ECO Data Importer.js` - CSV data import with multi-step dialog
  - `ECO Diagnostics Utils JS.js` - Styling functions, progress colors, address search

**rule chains/:**
- Purpose: Define message processing pipelines for telemetry, RPC, and external integrations
- Contains: Rule chain JSON with node definitions, connections, and processing logic
- Key files:
  - `root_rule_chain.json` - Primary pipeline (all messages route through here)
  - `resi.json`, `resi_device.json` - Device-specific rule chains
  - `get_openweather_data_rest_api.json` - External API integration

**widgets/:**
- Purpose: Custom widget bundle definitions (not individual widget configs)
- Contains: Widget bundle JSON files defining collections of custom widgets
- Key files: Map/table/grid widget bundles used in administration dashboard

**templates/widgets/:**
- Purpose: Library of preconfigured widget templates for quick dashboard authoring
- Contains: Small reusable widget configs (50-200 lines JSON) organized by type
- Organization:
  - `by_type/timeseries/` - Time-series chart templates
  - `by_type/latest/` - Latest-value gauge/display templates
  - `by_type/alarm/` - Alarm widget templates
  - `by_type/rpc/` - RPC command widget templates
  - `by_type/static/` - Static HTML/text templates
  - `detailed/` - Complete widget configs (copy-paste ready)

**translation/:**
- Purpose: Store custom translation strings for multi-language support
- Contains: JSON files with locale-specific strings (key → value mappings)
- Files: Named `{locale}_custom_translation.json` (e.g., `de_DE_custom_translation.json`)

**tasks/:**
- Purpose: GSD task specifications for multi-agent workflows
- Contains: Markdown task files defining scope, steps, and requirements
- Files: Template and specific task definitions

**backups/:**
- Purpose: Automatic backup snapshots (created before each sync/pull operation)
- Contains: Timestamped directories with changed files + `.sync-status.json` metadata
- Generated: Yes (by sync tool); committed: No (git-ignored)

## Key File Locations

**Entry Points:**
- `sync/sync.js`: CLI tool entry point (run via `node sync/sync.js [command]`)
- `dashboards/measurements.json`: Main dashboard served to users
- `sync/config.js`: Environment variable loader (reads `.env`)

**Configuration:**
- `.env`: ThingsBoard credentials and URL (git-ignored)
- `.env.example`: Template for required environment variables
- `sync/package.json`: Sync tool dependencies (dotenv, node-fetch)
- `package.json`: Root project dependencies

**Core Logic:**
- `sync/api.js`: ThingsBoard API client with authentication, token refresh, HTTP methods
- `sync/backup.js`: Backup creation, file change detection, rollback logic
- `js library/ECO Project Wizard.js`: Complex dialog logic for project/measurement management
- `js library/ECO Data Importer.js`: CSV import stepper with validation and telemetry posting
- `rule chains/root_rule_chain.json`: Main message routing (all devices → this chain)

**Testing:**
- Not detected (no test files in codebase; testing via manual ThingsBoard UI)

**Documentation:**
- `CLAUDE.md`: Architecture guide, widget action patterns, entity model, JS module exports
- `AGENTS.md`: Multi-agent workflow documentation
- `sync/README.md`: Sync tool command reference and troubleshooting
- `tasks/TEMPLATE.md`: GSD task template

## Naming Conventions

**Files:**

**Dashboard files:**
- Pattern: `{kebab-case-name}.json` (converted from title during pull)
- Examples: `measurements.json`, `administration.json`, `navigation.json`

**JS Library files:**
- Pattern: `{Title Case Name}.js` (matches resourceKey in ThingsBoard)
- Examples: `ECO Project Wizard.js`, `ECO Data Importer.js`, `ECO Diagnostics Utils JS.js`

**Rule chain files:**
- Pattern: `{kebab-or-snake-case-name}.json` or descriptive name
- Examples: `root_rule_chain.json`, `resi.json`, `get_openweather_data_rest_api.json`

**Translation files:**
- Pattern: `{locale}_custom_translation.json`
- Examples: `de_DE_custom_translation.json`, `en_US_custom_translation.json`

**Backup directories:**
- Pattern: `{YYYY-MM-DD}_{HH-mm-ss}` (ISO-like timestamp)
- Examples: `2026-01-23_13-20-32`, `2026-01-23_18-26-13`

**Directories:**

**Primary resource dirs:**
- Pattern: Plural English nouns in lowercase
- Examples: `dashboards/`, `js library/`, `rule chains/`, `widgets/`, `translation/`, `backups/`

**Template subdirs:**
- Pattern: Descriptive English words lowercase
- Examples: `by_type/`, `detailed/`, `all/`

**Widget type subdirs:**
- Pattern: Widget type names (timeseries, latest, alarm, rpc, static)

## Where to Add New Code

**New Dashboard:**
1. Create JSON file in `dashboards/` named `{name-in-kebab-case}.json`
2. Export complete dashboard JSON with structure:
   - `title`, `configuration.widgets`, `configuration.entityAliases`, `configuration.states`
   - Include datasources, dataKeys, widget actions
3. For custom actions: reference JS library modules via `customFunction.modules`
4. Sync: `node sync/sync.js sync --dashboards`

**New JS Library Module:**
1. Create file in `js library/` named `{Exact Name}.js` (matches desired resourceKey)
2. Export function(s) via `export function myFunction(widgetContext, ...args) { ... }`
3. Access services via `const service = widgetContext.$scope.$injector.get(widgetContext.servicesMap.get('serviceName'))`
4. Return promises or use callbacks for async operations
5. Sync: `node sync/sync.js sync --js`

**New Rule Chain:**
1. Create JSON file in `rule chains/` with descriptive name (e.g., `my-processor.json`)
2. Structure:
   - `ruleChain.name`, `ruleChain.root` boolean
   - `metadata.nodes[]` array with node definitions
   - `metadata.connections[]` array linking nodes by index
3. Each node has: `type`, `name`, `configuration`, `additionalInfo`
4. Connection has: `fromIndex`, `toIndex`, `type` (SUCCESS, FAILURE, etc.)
5. Sync: `node sync/sync.js sync --rulechains`

**New Translation File:**
1. Create file in `translation/` named `{locale}_custom_translation.json`
2. Structure: `{ "key1": "value1", "key2": "value2", ... }`
3. Filename locale code must match: de_DE, en_US, etc.
4. Sync: `node sync/sync.js sync --i18n`

**New Widget Template:**
1. For quick-copy templates: Add to `templates/widgets/detailed/{name}.json`
2. For type-specific templates: Add to `templates/widgets/by_type/{type}/{name}.json`
3. Keep to 50-200 lines; remove unnecessary config
4. Do not sync to server (reference only for copy-paste)

**New Utility Function (shared):**
1. Add to `js library/ECO Diagnostics Utils JS.js` (shared utilities module)
2. Export function with name describing purpose (e.g., `getProgressColor()`, `getMeasurementTypeStyle()`)
3. Take widgetContext as first parameter if accessing services
4. Return object or primitive for consumption by other modules

**New Task (GSD):**
1. Create file in `tasks/{task-name}.md`
2. Copy structure from `tasks/TEMPLATE.md`
3. Define scope, steps, acceptance criteria, tags
4. Reference in AGENTS.md when assigning to workflow

## Special Directories

**backups/:**
- Purpose: Preserve file history before sync operations
- Generated: Yes (automatically by sync tool)
- Committed: No (git-ignored in .gitignore)
- Lifecycle: Created on sync/pull; can be manually managed via `node sync/sync.js rollback`
- Metadata: `.sync-status.json` tracks lastBackup, lastSync, lastPull, lastRollback timestamps

**node_modules/:**
- Purpose: npm package cache
- Generated: Yes (by `npm install`)
- Committed: No (git-ignored)
- Contents: Root dependencies (dotenv, node-fetch) + nested sync tool dependencies

**.planning/codebase/:**
- Purpose: GSD analysis output (not part of core project)
- Generated: Yes (by GSD tools)
- Committed: Yes (to version control)
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md

**templates/:**
- Purpose: Reference library (not deployed to ThingsBoard)
- Generated: No (manually created/curated)
- Committed: Yes
- Usage: Copy snippets into dashboard/widget JSON; modify as needed

---

*Structure analysis: 2026-01-26*

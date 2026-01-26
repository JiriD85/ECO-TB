# Architecture

**Analysis Date:** 2026-01-26

## Pattern Overview

**Overall:** ThingsBoard Monolithic Configuration + Distributed Sync Model

The codebase follows a hybrid architecture where:
1. **Local-first development**: JSON configurations and JavaScript modules are edited locally as files
2. **Sync-based deployment**: A Node.js sync tool pushes changes to ThingsBoard server
3. **Server-driven execution**: ThingsBoard executes dashboards, rule chains, and JS modules from the server

This pattern enables version control and local editing of server-hosted configurations while maintaining synchronization with the live instance.

**Key Characteristics:**
- Configuration-as-Code: All dashboards, rule chains, widgets, and translations stored as JSON/JS files
- Bidirectional sync: Pull from server to local, push from local to server with automatic backups
- Embedded widget actions: Dashboard actions defined inline or via JS library module references
- Entity-centric data model: Hierarchical entities (Customer → Project → Measurement → Device)
- Rule-based processing: Message-driven data pipeline with conditional routing

## Layers

**Sync/CLI Layer:**
- Purpose: Manage bidirectional synchronization between local filesystem and ThingsBoard server
- Location: `sync/` directory
- Contains: CLI commands (sync, pull, push, backup, rollback, status)
- Depends on: Node.js, dotenv, node-fetch, filesystem APIs
- Used by: Developers via command line; automated backup/recovery workflows

**Configuration Layer:**
- Purpose: Define dashboards, rule chains, widget bundles, and translations as JSON artifacts
- Location: `dashboards/`, `rule chains/`, `widgets/`, `translation/` directories
- Contains: Large JSON files (2-56 MB for full dashboards) defining UI, data bindings, and logic
- Depends on: ThingsBoard resource storage; sync tool for deployment
- Used by: ThingsBoard rendering engine; dashboard viewers

**JavaScript Module Layer:**
- Purpose: Provide reusable utility functions and dialog handlers for dashboard actions
- Location: `js library/` directory
- Contains: Pure JavaScript modules exported as functions (ECO Project Wizard, ECO Data Importer, ECO Diagnostics Utils)
- Depends on: ThingsBoard services ($injector, widgetContext, $scope); external libraries (rxjs)
- Used by: Dashboard widget action handlers; embedded in customFunction objects

**Template Library:**
- Purpose: Store preconfigured widget templates organized by type for quick dashboard authoring
- Location: `templates/widgets/` directory
- Contains: Widget configuration snippets (50-200 lines JSON each) organized by type (timeseries, latest, alarm, rpc, static)
- Depends on: None (reference only)
- Used by: Manual widget configuration during dashboard development

**Backup/Recovery Layer:**
- Purpose: Preserve file state before sync operations and enable rollback
- Location: `backups/` directory + `.sync-status.json`
- Contains: Timestamped snapshots of changed files + operation history
- Depends on: Filesystem APIs
- Used by: Sync tool for recovery; manual rollback workflows

## Data Flow

**Push Workflow (Local → Server):**

1. Developer edits local JSON/JS files
2. Developer runs `node sync/sync.js sync --dashboards` (or other resource type)
3. Sync tool:
   - Reads local files from `dashboards/`, `rule chains/`, `widgets/`, `js library/`, `translation/`
   - Creates backup in `backups/[timestamp]/` for changed files only
   - Logs backup to `.sync-status.json`
4. Sync tool authenticates via ThingsBoard API (`/api/auth/login`)
5. For each resource type:
   - **Dashboards**: Fetch existing dashboards from server, match by title, update or create
   - **Rule Chains**: POST to `/api/ruleChain`
   - **Widgets**: POST to `/api/widgetsBundle`
   - **JS Libraries**: POST to `/api/resource` with multipart form data
   - **Translations**: POST to `/api/customTranslation/customTranslation`
6. Updates recorded in `.sync-status.json` (lastSync timestamp)

**Pull Workflow (Server → Local):**

1. Developer runs `node sync/sync.js pull "Dashboard Name"` or `pull-js "Module Name"`
2. Sync tool:
   - Creates backup of local files being overwritten
   - Fetches resource(s) from server (GET `/api/tenant/dashboards`, GET `/api/resource`, etc.)
   - Writes to local filesystem with formatted JSON (2-space indent)
   - Updates `.sync-status.json` (lastPull timestamp)

**Dashboard Rendering & Interaction:**

1. User opens dashboard in ThingsBoard UI
2. ThingsBoard loads dashboard JSON from `configuration.states`
3. Widgets render based on `config.datasources` and `config.dataKeys` (telemetry, attributes, entity fields)
4. Widget action triggered (button click, data event)
5. Action type determines behavior:
   - **customPretty**: Inline HTML/CSS/JS executed directly in dialog
   - **custom**: JavaScript function imported from JS library module
6. Custom function receives `widgetContext` with access to:
   - `widgetContext.$scope.$injector` → Services (customDialog, attributeService, deviceService, etc.)
   - `widgetContext.rxjs` → RxJS operators
   - `widgetContext.stateController` → Dashboard state params
   - `widgetContext.currentUser` → Authentication info
7. Function executes: opens dialogs, posts data, manipulates attributes, or navigates states

**Rule Chain Processing:**

1. Device sends telemetry/RPC via MQTT or API
2. Root rule chain (`root_rule_chain.json`) receives message
3. Message Type Switch node routes by msg type (TELEMETRY, RPC_CALL_FROM_DEVICE, etc.)
4. Conditional nodes filter/transform messages
5. Action nodes (Save Timeseries, Save Attributes, Log, Send Email) execute
6. Additional rule chains (resi.json, get_openweather_data_rest_api.json) process specialized flows

**State Management:**

- **Dashboard State**: Multi-view support via `configuration.states` (multiple state IDs with different layouts/widgets)
- **Entity State**: Attributes stored on entities (type ATTRIBUTE scope) via `Save Attributes` rule node
- **UI State**: Dashboard state params passed via `stateController` (selectedCustomer, selectedProject, selectedMeasurement)
- **Progress Tracking**: Entity attribute `progress` (in preparation → active → finished | aborted)

## Key Abstractions

**Dashboard Configuration:**
- Purpose: Define a complete UI view with widgets, data bindings, and actions
- Examples: `dashboards/measurements.json` (38K lines), `dashboards/administration.json` (16K lines)
- Pattern:
  - `configuration.states`: Multiple view layouts
  - `configuration.widgets`: Widget instances by UUID
  - `configuration.entityAliases`: Dynamic entity references
  - Widget action: `type: 'custom'` with `customFunction: { body, modules }`

**Widget Template:**
- Purpose: Reusable widget configuration for common visualization patterns
- Examples: `templates/widgets/detailed/illuminance_chart_card_with_background.json`, `templates/widgets/by_type/timeseries/`
- Pattern: Standalone JSON with settings, datasources, dataKeys; copy-paste into dashboard

**JavaScript Module (JS Library):**
- Purpose: Implement complex business logic (dialogs, data import, validation)
- Examples:
  - `ECO Project Wizard.js` (2092 lines) - Project/Measurement dialogs
  - `ECO Data Importer.js` (4082 lines) - CSV import with stepper
  - `ECO Diagnostics Utils JS.js` (1122 lines) - Progress colors, styling, address search
- Pattern:
  - Pure functions exported (no imports due to ThingsBoard limitations)
  - Functions receive `widgetContext` and entity IDs
  - Return promises or execute callbacks
  - Use `$injector.get()` to access ThingsBoard services

**Rule Chain Node:**
- Purpose: Single processing step in message pipeline
- Examples: TbMsgTimeseriesNode, TbMsgAttributesNode, TbLogNode, TbMsgTypeSwitchNode
- Pattern:
  - Type defines behavior (save data, filter, transform, action)
  - Configuration parameters (scope, TTL, script language)
  - Connections array defines routing to next nodes
  - Position metadata (layoutX, layoutY) for visual editor

**Custom Translation:**
- Purpose: Localize dashboard labels and messages
- Examples: `translation/de_DE_custom_translation.json`, `translation/en_US_custom_translation.json`
- Pattern: Flat JSON object with key → { locale: value } mappings

## Entry Points

**CLI Entry Point (Sync Tool):**
- Location: `sync/sync.js`
- Triggers: Developer runs `node sync/sync.js [command] [args]`
- Responsibilities:
  - Parse command and flags
  - Load configuration from `.env`
  - Authenticate with ThingsBoard API
  - Route to sync/pull/backup/rollback handlers
  - Manage backups and status tracking

**Dashboard Entry Point:**
- Location: Dashboard JSON in `dashboards/` (e.g., `measurements.json`)
- Triggers: User opens dashboard in ThingsBoard UI or navigates to dashboard route
- Responsibilities:
  - Load configuration from database (pushed by sync tool)
  - Render states and widgets
  - Establish data subscriptions via datasources
  - Attach action handlers to buttons/events

**JS Module Entry Point:**
- Location: `js library/[Module Name].js`
- Triggers: Dashboard widget action invokes function from module
- Responsibilities:
  - Inject services via widgetContext
  - Render custom dialogs via customDialog service
  - Fetch data via http service or entity services
  - Update entity attributes or post telemetry

**Rule Chain Entry Point:**
- Location: `rule chains/root_rule_chain.json` (or referenced sub-chains)
- Triggers: Device sends telemetry/RPC via MQTT, REST API, or internal routing
- Responsibilities:
  - Route messages by type
  - Filter/transform based on conditions
  - Save data to timeseries/attributes
  - Execute external actions (REST calls, emails, logs)

## Error Handling

**Strategy:** Graceful degradation with logging and user feedback

**Patterns:**

**Sync Tool Errors:**
- Connection/auth failures: Throw with descriptive message including HTTP status
- JSON parse errors: Catch and wrap with file path context (`Invalid JSON in dashboards/measurements.json`)
- Missing directories: Log warning and skip (graceful)
- File backup failures: Throw and abort (prevent data loss)

**ThingsBoard API Errors:**
- 401 (Unauthorized): Attempt token refresh, then re-authenticate and retry request
- Network timeouts: Bubble up to CLI; user must retry manually
- 4xx validation errors: Log response body for debugging

**Dashboard/Widget Errors:**
- JavaScript exceptions in widget actions: Caught by ThingsBoard; displayed in console/dialog
- Missing services: $injector.get() returns undefined; check existence before use
- Null datasources: Widget displays no data; warning in browser console

**JS Module Errors:**
- Service not available: Check via `widgetContext.servicesMap.has(serviceName)` before use
- HTTP request failures: Return error object; dialog displays error message via callback
- Dialog cancellation: Handled by promise rejection; cleanup via finally blocks

## Cross-Cutting Concerns

**Logging:**
- Approach: Console logging in JS modules and sync tool
- Pattern: Use `console.log()` for info, `console.warn()` for warnings in modules; `logger.log()` in CLI
- Visibility: Browser console for dashboard actions; stdout for CLI commands

**Validation:**
- Approach: Input validation at entry points; attribute validation in dialogs
- Pattern:
  - CSV import: File type check (CSV), row format validation, duplicate detection
  - Project/Measurement dialogs: Required field checks, entity name uniqueness
  - Device assignment: Verify entity relations before saving

**Authentication:**
- Approach: JWT token-based via ThingsBoard API
- Pattern:
  - Sync tool: Login once per session, auto-refresh on 401
  - Dashboards: Rely on ThingsBoard session (token in browser)
  - JS modules: Access via `widgetContext.currentUser` for user info

**Authorization:**
- Approach: Attribute-based (role checking in JS modules)
- Pattern: Check `widgetContext.currentUser.authority` (TENANT_ADMIN, CUSTOMER_USER, etc.) before sensitive operations

**State Persistence:**
- Approach: Entity attributes for dashboard state, `.sync-status.json` for tool state
- Pattern:
  - Entity attributes: Saved via `Save Attributes` rule node or JS module attributeService.saveEntityAttributes()
  - Sync status: JSON file updated after each operation (lastBackup, lastSync, lastPull, lastRollback)

---

*Architecture analysis: 2026-01-26*

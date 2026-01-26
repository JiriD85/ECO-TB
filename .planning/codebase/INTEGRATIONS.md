# External Integrations

**Analysis Date:** 2026-01-26

## APIs & External Services

**ThingsBoard REST API:**
- ThingsBoard 4.2 PE (Professional Edition) - HVAC/Building Automation monitoring platform
  - SDK/Client: Custom `ThingsBoardApi` class in `sync/api.js`
  - Auth: JWT token-based (username/password → token + refreshToken)
  - Base URL: Environment variable `TB_BASE_URL`

## Data Storage

**Databases:**
- ThingsBoard Internal Database - PostgreSQL backend (managed by ThingsBoard PE)
  - Connection: Via ThingsBoard REST API only (no direct database access)
  - Client: Custom REST API wrapper (`sync/api.js`)
  - Entity hierarchy: Customer → Project → Measurement → Device
  - Entity types: CUSTOMER, ASSET (Project/Measurement), DEVICE

**File Storage:**
- Local filesystem - Dashboard JSON files, rule chains, JS libraries, translations
  - Dashboard files: `dashboards/*.json` (2-4 MB each)
  - JS libraries: `js library/*.js`
  - Rule chains: `rule chains/*.json`
  - Translations: `translation/*_custom_translation.json`
  - Backups: `backups/[timestamp]/*` (timestamped backup directories)

**Caching:**
- Not detected - No explicit caching layer

## Authentication & Identity

**Auth Provider:**
- Custom JWT authentication via ThingsBoard
  - Implementation: Username/password login → JWT token + refresh token
  - Token management: Automatic refresh via `/api/auth/token` endpoint
  - Token expiration: Decoded from JWT payload, checked before requests
  - Location: `sync/api.js` methods: `login()`, `refresh()`, `ensureToken()`
  - Credentials source: `.env` file (`TB_USERNAME`, `TB_PASSWORD`)

## Monitoring & Observability

**Error Tracking:**
- Console logging - console object used throughout
  - Location: `sync/api.js`, `sync/sync.js`, `sync/backup.js`
  - Method: Logger parameter passed to ThingsBoardApi class (defaults to console)

**Logs:**
- Console output only
  - Login: `'Logged in to ThingsBoard'`
  - Token refresh: `'Token refreshed'`
  - Sync operations: File processing and upload/download messages
  - Errors: Detailed error messages with HTTP status and response text

## CI/CD & Deployment

**Hosting:**
- ThingsBoard 4.2 PE instance (customer-managed)
- Current instance: `https://diagnostics.ecoenergygroup.com`

**CI Pipeline:**
- Not detected - Manual sync tool execution via command line

## Environment Configuration

**Required env vars:**
- `TB_BASE_URL` - ThingsBoard instance URL (e.g., `https://diagnostics.ecoenergygroup.com`)
- `TB_USERNAME` - Tenant user email
- `TB_PASSWORD` - User password

**Secrets location:**
- `.env` file in project root (not committed to git)
- `.env.example` provided as template
- `.gitignore` excludes `.env` files

## ThingsBoard API Endpoints

**Authentication:**
- `POST /api/auth/login` - Initial login (username/password)
- `POST /api/auth/token` - Token refresh (refreshToken)

**Dashboards:**
- `GET /api/tenant/dashboards?pageSize=1000&page=0` - List dashboards
- `GET /api/dashboard/{dashboardId}` - Get dashboard by ID
- `POST /api/dashboard` - Create/update dashboard

**Rule Chains:**
- `GET /api/ruleChains?pageSize=1000&page=0` - List rule chains
- `POST /api/ruleChain` - Create/update rule chain

**Widgets:**
- `GET /api/widgetsBundles?pageSize=1000&page=0` - List widget bundles
- `POST /api/widgetsBundle` - Create/update widget bundle

**JS Resources/Modules:**
- `GET /api/resource?pageSize=1000&page=0&resourceType=JS_MODULE` - List JS modules
- `GET /api/resource/{resourceId}` - Get resource metadata
- `GET /api/resource/{resourceId}/download` - Download resource content
- `POST /api/resource` - Create/update resource (with base64-encoded data)

**Translations:**
- `GET /api/translation/availableLocales` - Get available locales
- `GET /api/translation/custom/{locale}` - Get custom translation for locale
- `POST /api/translation/custom/{locale}/upload` - Upload custom translation (multipart/form-data)

**White Labeling:**
- `GET /api/whiteLabel/whiteLabelParams` - Get white label settings
- `GET /api/noauth/whiteLabel/loginWhiteLabelParams` - Get login white label settings

## Webhooks & Callbacks

**Incoming:**
- Not detected - Sync tool is pull-based (retrieves from ThingsBoard)

**Outgoing:**
- `CSV telemetry upload` - Indirect via ThingsBoard HTTP API
  - Endpoint: `/api/plugins/telemetry/{entityType}/{entityId}/timeseries/ANY`
  - Used by: ECO Data Importer JS library for CSV import functionality
  - Method: POST with telemetry data payload

## ThingsBoard Widget Integration

**Custom Actions in Dashboards:**
- Type: `customPretty` - Inline dialog definition (HTML/CSS/JS)
- Type: `custom` - Library function calls via JS modules
  - Module import format: `"moduleName": "tb-resource;/api/resource/js_module/tenant/FILENAME.js"`
  - Used by: Dashboard widgets to call functions from JS libraries

**Available ThingsBoard Services (injected via `$injector`):**
- `customDialog` - Open custom dialogs
- `attributeService` - Read/write entity attributes
- `entityRelationService` - Manage entity relations
- `entityGroupService` - Manage entity groups
- `deviceService`, `assetService`, `customerService` - Entity CRUD operations
- `http` - HTTP requests within ThingsBoard context
- RxJS library - Observable/reactive programming

**ThingsBoard CSS Utilities:**
- Tailwind-like utility classes in widgets:
  - Flex: `flex`, `flex-1`, `flex-col`, `flex-wrap`
  - Alignment: `items-center`, `items-start`, `items-end`, `justify-end`, `justify-between`
  - Spacing: `gap-1`, `gap-2`, `gap-3`, `p-3`, `p-4`, `px-4`, `mb-2`, `mb-4`, `mt-2`, `mx-4`
  - Typography: `text-lg`, `font-semibold`

## JS Libraries (Synced as ThingsBoard Modules)

**Location:** `js library/` directory

**ECO Diagnostics Utils JS.js** (37.9 KB)
- Progress display functions: `getProgressColor()`, `getProgressHtml()`
- Styling helpers: `getMeasurementTypeStyle()`, `getInstallationTypeStyle()`
- Address search utilities

**ECO Data Importer.js** (156.9 KB)
- CSV data import dialog: `csvDataImportDialog()`
- Device assignment: `assignDeviceToMeasurement()`
- Telemetry import via `/api/plugins/telemetry/` endpoint

**ECO Project Wizard.js** (94.8 KB)
- Project management: `openAddProjectDialog()`
- Measurement creation: `openAddMeasurementDialog()`
- Parameter management: `openMeasurementParametersDialog()`

---

*Integration audit: 2026-01-26*

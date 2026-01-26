# Coding Conventions

**Analysis Date:** 2026-01-26

## Naming Patterns

**Files:**
- Node.js scripts: `lowercase.js` with hyphens for multi-word names (e.g., `fetch-templates.js`)
- ThingsBoard JS libraries: Title case with spaces (e.g., `ECO Project Wizard.js`, `ECO Data Importer.js`)
- Backup and output files: ISO timestamp format with hyphens and underscores (`2026-01-26_14-30-45`)
- Dashboard/configuration files: `lowercase_with_underscores.json` or `PascalCase.json` (e.g., `measurements.json`)

**Functions:**
- camelCase for all function names: `getProgressColor()`, `csvDataImportDialog()`, `getCustomTranslation()`
- Private/internal functions: No naming convention enforced, but context determines intent
- Factory/constructor functions: PascalCase for class names, camelCase for method names

Example from `sync/sync.js`:
```javascript
async function getJsonFiles(dirName) { ... }
async function loadJson(filePath) { ... }
async function syncDashboards(api) { ... }
```

Example from `ECO Project Wizard.js`:
```javascript
function getProgressColor(progress) { ... }
function getMeasurementTypeStyle(measurementType) { ... }
export function openAddProjectDialog(...) { ... }
```

**Variables:**
- camelCase: `filesToSync`, `dashboardsByTitle`, `existingDashboards`, `selectedMeasurement`
- Constants: UPPER_SNAKE_CASE when truly constant (e.g., `SOURCE_DIRS`, `BACKUP_ROOT`, `STATUS_FILE`)
- Boolean prefixes: `is`, `has`, `needs` (e.g., `isTenantAdmin`, `hasDevice`, `needsCustomerSelection`)

**Types/Interfaces:**
- No TypeScript, but object properties use camelCase: `{ resourceKey, resourceType, fileName }`
- Configuration objects: lowercase properties (e.g., `{ baseUrl, username, password }`)

## Code Style

**Formatting:**
- No linting configuration detected (.eslintrc, .prettierrc not present)
- Indentation: 2 spaces throughout codebase
- Line length: Varies but typically 80-100 characters for readability
- String quotes: Backticks for template literals with interpolation, single or double quotes for regular strings

Example from `sync/api.js`:
```javascript
const url = `${this.baseUrl}${path}`;
const headers = {
  'Content-Type': 'application/json',
  'X-Authorization': `Bearer ${this.token}`,
};
```

**Linting:**
- Not detected in codebase (no ESLint or Prettier config files)
- Manual code review appears to be the quality control

**Semicolons:**
- Semicolons consistently used to terminate statements

**Spacing:**
- Blank lines between function definitions
- Single blank line between logical sections within functions
- Section comments use format: `// ==================== SECTION NAME ====================`

Example from `sync/sync.js`:
```javascript
// ==================== JS Libraries Sync ====================

async function getJsFiles(dirName) {
  const dirPath = path.join(process.cwd(), dirName);
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
      .map((entry) => path.join(dirPath, entry.name));
  } catch (err) {
    return [];
  }
}
```

## Import Organization

**Order:**
1. Node.js built-in modules (`fs`, `path`, `buffer`)
2. Third-party packages (`dotenv`, `node-fetch`)
3. Local modules (relative imports with `./` or `../`)

Example from `sync/sync.js`:
```javascript
const fs = require('fs').promises;
const path = require('path');

const { loadConfig } = require('./config');
const { ThingsBoardApi } = require('./api');
const { backupFiles, listBackups, ... } = require('./backup');
```

**Module System:**
- CommonJS `require()` for Node.js files (sync tool)
- ES6 `export` keyword for ThingsBoard JS libraries that run in browser/dashboard context
- No path aliases detected

## Error Handling

**Patterns:**
- Try-catch for synchronous error-prone operations (JSON parsing)
- try-catch in async functions with explicit error type checking
- Error message format: `Action failed: ${method} ${path} ${status} ${text}`

Example from `sync/api.js`:
```javascript
async function login() {
  const response = await fetchFn(`${this.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: this.username, password: this.password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Login failed: ${response.status} ${text}`);
  }
  // ...
}
```

**HTTP Error Handling:**
- Check `response.ok` or `response.status` explicitly
- Handle 401 (unauthorized) with automatic token refresh
- Catch 404 errors with string matching: `err.message.includes('404')`

Example from `ECO Data Importer.js`:
```javascript
customers$.subscribe(
  function(customers) {
    config.customers = customers;
    openDialog(config);
  },
  function(error) {
    console.error('Failed to load initial data:', error);
    config.customers = [];
    openDialog(config);
  }
);
```

**Graceful Degradation:**
- Empty arrays returned instead of null on load failures
- Dialog still opens even if data fetch fails
- Default values provided for missing configuration

## Logging

**Framework:** `console` object (no specialized logging library)

**Patterns:**
- Logger injected as `logger` parameter defaulting to `console`
- Methods used: `logger.log()`, `logger.warn()`, `logger.error()`
- No structured logging; simple string messages

Example from `sync/sync.js`:
```javascript
async function syncCommand(args) {
  // ...
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  if (selections.dashboards) {
    await syncDashboards(api);
  }
  // ...
  await recordSync();
  logger.log('Sync completed');
}
```

Example from `sync/api.js`:
```javascript
class ThingsBoardApi {
  constructor({ baseUrl, username, password, logger = console }) {
    this.logger = logger;
  }

  async login() {
    // ...
    this.logger.log('Logged in to ThingsBoard');
  }

  async refresh() {
    // ...
    this.logger.warn('Token refresh failed, re-authenticating');
    this.logger.log('Token refreshed');
  }
}
```

**When to Log:**
- State changes: "Logged in", "Token refreshed", "Synced dashboard"
- Warnings: Missing files, failed operations with recovery
- Errors: Thrown to caller, includes context and details
- Progress: "Found X dashboards", "Backed up Y files"

## Comments

**When to Comment:**
- Function headers with JSDoc-style comments explaining purpose, parameters, and return
- Complex logic sections with explanation of "why" not "what"
- API endpoint paths and their purpose

**JSDoc/TSDoc:**
- Used extensively in ThingsBoard JS libraries
- Format: block comments with `/**` and parameter/return documentation
- Example from `ECO Diagnostics Utils JS.js`:

```javascript
/**
 * Gibt Farbe und Label für Progress Status zurück
 *
 * @param {string} progress - Progress Status
 * @returns {Object} { color, bgColor, label }
 */
export function getProgressColor(progress) {
  // implementation
}
```

- Minimal in sync tool files (less formal code)

**Section Comments:**
- Large divider comments for logical sections:
```javascript
// ==================== PROGRESS DISPLAY FUNCTIONS ====================
```

## Function Design

**Size:**
- Functions typically 5-50 lines
- Larger composite functions (100+ lines) exist for complex operations like dialog setup
- Generally favor shorter, single-purpose functions

**Parameters:**
- Positional parameters for core inputs
- Configuration objects for optional/many parameters
- Example from `sync/backup.js`:

```javascript
async function backupFiles(logger = console, filePaths = []) { ... }
async function createBackup(logger = console, selectedDirs = null) { ... }
```

**Return Values:**
- Functions return data structures: objects with properties, arrays, strings
- Async functions return Promises that resolve to data
- Example return structures:

```javascript
// From sync/backup.js
{ backupDir, timestamp, count: 0 }

// From API
{ color, bgColor, label }

// From sync/api.js
response.data || response || []
```

**Null/Undefined Handling:**
- Fallback to empty arrays: `response.data || response || []`
- Null checks before processing: `if (!response.ok) { throw ... }`
- Optional chaining not used (legacy JS compatibility)

## Module Design

**Exports:**
- CommonJS: Single class or multiple named exports via `module.exports = { ... }`
- ES6: Named exports with `export function` syntax

Example from `sync/backup.js`:
```javascript
module.exports = {
  createBackup,
  backupFiles,
  listBackups,
  restoreLatestBackup,
  readStatus,
  updateStatus,
  recordSync,
};
```

Example from `ECO Diagnostics Utils JS.js`:
```javascript
export function getProgressColor(progress) { ... }
export function getProgressHtml(progress) { ... }
export function getMeasurementTypeStyle(measurementType) { ... }
```

**Barrel Files:**
- Not used in this codebase

**File Cohesion:**
- Each file handles a single logical domain:
  - `sync.js` - main orchestration and pull/push commands
  - `api.js` - ThingsBoard API wrapper
  - `backup.js` - backup and restore operations
  - `config.js` - environment variable loading

---

*Convention analysis: 2026-01-26*

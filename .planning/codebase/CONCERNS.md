# Codebase Concerns

**Analysis Date:** 2026-01-26

## Security Concerns

### Credentials Exposed in .env File

**Risk:** Production credentials stored in repository despite .gitignore exclusion

**Files:**
- `.env` - Contains live ThingsBoard API credentials (username, password, base URL)

**Current mitigation:**
- `.gitignore` excludes `.env`, `.env.local`, `.env.production`

**Recommendations:**
1. **Immediately rotate** the exposed credentials in `.env`:
   - Change ThingsBoard password for user `j.dockal+api@pke.at`
   - Update `.env` with new credentials
   - This password has been committed in git history and is recoverable
2. **Add pre-commit hook** to prevent `.env` files from being committed
3. **Audit git history** to remove credentials from all commits using `git-filter-repo`
4. **Use secure credential management:**
   - For CI/CD: Use GitHub Secrets / environment variables
   - For local dev: Use `.env.local` with stricter ignore patterns
   - Consider using credential managers (e.g., `1Password CLI`, `Vault`)

### Password Embedded in Sync Tool Code

**Risk:** API credentials stored in environment variables without rotation/expiry management

**Files:**
- `sync/config.js` - Loads plain-text credentials from environment
- `sync/api.js` - Stores token in memory without expiry enforcement

**Current mitigation:**
- JWT token refresh mechanism exists (line 46-69 in `api.js`)
- Token has 60-second expiry buffer (line 311 in `api.js`)

**Recommendations:**
1. **Implement token expiry enforcement:**
   - Add explicit token invalidation on logout
   - Implement automatic session timeout (15-30 minutes)
   - Clear sensitive data from memory on process exit
2. **Add credential rotation alerts:**
   - Log when token refresh fails (currently continues without clear warning)
   - Track failed authentication attempts
3. **Never log credentials:**
   - Currently logs are sent to console - audit for any credential exposure
   - Sanitize error messages before display

---

## Performance Bottlenecks

### Large Dashboard Files (2-3 MB JSON)

**Problem:** Dashboard JSON files are extremely large, causing performance issues

**Files:**
- `dashboards/measurements.json` - 2.6 MB
- `dashboards/administration.json` - 2.2 MB

**Impact:**
- Slow file parsing and syncing (JSON.parse on 2+ MB takes time)
- High memory usage during operations
- Git operations slow (large binary-like files in history)
- Network transfer bottleneck when syncing with ThingsBoard

**Cause:**
- Complex nested widget structures with embedded action definitions
- Duplicated widget configuration across dashboard states
- No schema optimization or compression

**Improvement path:**
1. **Profile sync operations:**
   - Measure parse/stringify times for large dashboards
   - Identify bottleneck: file I/O, parsing, or API calls
2. **Optimize JSON structure:**
   - Extract common widget templates to reduce duplication
   - Consider binary serialization format for large payloads
3. **Implement streaming for large files:**
   - Use Node.js streams instead of fs.promises for large dashboards
   - Process in chunks rather than full file load
4. **Add compression:**
   - Gzip files in backups and for network transfer

### Missing Pagination Handling

**Problem:** API calls for fetching resources use hardcoded `pageSize=1000`

**Files:**
- `sync/api.js` - Lines 133, 142, 147, 154

**Potential issue:**
- If ThingsBoard contains >1000 dashboards, JS modules, rule chains, or widgets, only first 1000 are fetched
- No indication to user that results are truncated
- Silent failure: user won't know if resources are missing

**Improvement path:**
1. **Implement pagination loop:**
   - Fetch page size, then iterate until all results received
   - Return complete list, not partial results
2. **Add warning when pagination limit reached:**
   - Log warning if pageSize >= returned result count

---

## Tech Debt

### Module Import Inconsistency in api.js

**Issue:** Conditional and dynamic module loading creates maintenance burden

**Files:** `sync/api.js` (lines 3-11)

**Problem:**
```javascript
const getFetch = () => {
  if (typeof fetch === 'function') {
    return fetch;
  }
  return (...args) =>
    import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));
};
```

This pattern:
- Tries native fetch first (Node.js 18+), falls back to node-fetch
- Creates async import at runtime instead of static require
- Makes it unclear which fetch is actually used
- Complicates testing and debugging

**Recommendations:**
1. **Standardize on single approach:**
   - If supporting Node.js 18+: Use native fetch, remove node-fetch dependency
   - If supporting Node.js <18: Use `require('node-fetch')` consistently
2. **Document Node.js version requirement** in package.json engines field

### Duplicate Dashboard Sync Logic

**Issue:** `syncDashboards` function has custom logic that differs from generic `syncDir`

**Files:**
- `sync/sync.js` - Lines 131-192 (syncDashboards) vs lines 194-219 (syncDir)

**Problem:**
- Dashboard sync uses optimistic locking (fetches current version before update)
- Rule chains and widgets use generic sync (no version fetching)
- If rule chains need optimistic locking, code must be duplicated
- Harder to maintain consistency across resource types

**Recommendations:**
1. **Extract common sync pattern:**
   - Create `syncWithVersioning(api, dirName, label, uploader, getVersionFn)`
   - Allow custom version handling per resource type
2. **Document version requirements:**
   - Which resources require optimistic locking?
   - Does ThingsBoard API support it for all resource types?

### Implicit Locale Parsing from Filename

**Issue:** Locale is extracted via regex from filename, no validation

**Files:** `sync/sync.js` - Lines 358-362

**Problem:**
```javascript
const match = filename.match(/^([a-z]{2}_[A-Z]{2})_custom_translation\.json$/);
if (!match) {
  logger.warn(`Skipping ${filename}: does not match expected pattern...`);
  continue;
}
```

- Only supports `xx_YY` format (2 lowercase, underscore, 2 uppercase)
- No validation that locale is actually valid (e.g., `zz_ZZ` would pass)
- Breaking change if ThingsBoard requires different naming convention
- Silent skip on mismatch - user may not notice missing translations

**Recommendations:**
1. **Validate against list of known locales:**
   ```javascript
   const VALID_LOCALES = new Set(['de_DE', 'en_US', 'fr_FR', ...]);
   if (!VALID_LOCALES.has(locale)) { throw Error(...) }
   ```
2. **Make locale regex configurable**
3. **Add explicit error logging** when files are skipped due to naming

---

## Fragile Areas

### Backup File Comparison Logic

**Files:** `sync/backup.js` - Lines 80-105 (fileChanged function)

**Why fragile:**
- Compares file contents by reading from disk multiple times
- If file is being written concurrently, may get partial reads
- No locking or atomic operations
- Performance degrades with many previous backups (searches all backup dirs)

**Safe modification approach:**
1. **Add file locking:**
   - Use `fs.flock` or semaphore before reading
2. **Optimize backup search:**
   - Cache backup metadata instead of stat-checking every dir
3. **Handle concurrent writes:**
   - Test behavior when file is being written during backup operation

### Dashboard Title-based Lookup

**Files:** `sync/sync.js` - Lines 151-157

**Why fragile:**
- Dashboards identified by title field only (not ID)
- If two dashboards have same title, only first is used (Map behavior)
- No error if title mismatch found during update
- Title changes on server break synchronization (new dashboard created instead of update)

**Test coverage gaps:**
- No tests for title collision scenarios
- No tests for title change detection

**Safe modification:**
1. **Prefer ID-based matching when available**
2. **Add title change detection:**
   - Compare title before/after update
   - Log warning if titles diverge
3. **Handle collisions:**
   - Throw error or prompt user if multiple dashboards match title

### JS Module resourceKey Assumption

**Files:** `sync/sync.js` - Lines 254-260

**Problem:**
- Assumes `resourceKey` matches filename
- If key is undefined or null, lookup fails silently
- No fallback to ID-based matching
- Deletes previous module without checking if filename changed

**Risk:** If server resourceKey doesn't match filename, module is orphaned and duplicated on next sync

---

## Test Coverage Gaps

### No Automated Testing for API Layer

**Files:** `sync/api.js` - 314 lines of untested code

**What's not tested:**
- Authentication and token refresh flows
- 401 response handling and retry logic
- Multipart form-data construction for translation upload
- Response parsing for different content-types
- Edge cases: empty responses, malformed JSON, network errors

**Recommended tests:**
```javascript
describe('ThingsBoardApi', () => {
  describe('login', () => {
    it('should store token and refreshToken on success')
    it('should throw on 401 response')
    it('should handle network errors gracefully')
  })
  describe('refresh', () => {
    it('should fallback to login on 401')
    it('should preserve refreshToken if not provided')
  })
  describe('multipart translation upload', () => {
    it('should format multipart correctly')
    it('should handle special characters in locale')
  })
})
```

### No Tests for Backup/Restore Logic

**Files:** `sync/backup.js` - 260 lines of untested code

**What's not tested:**
- File comparison logic under concurrent writes
- Rollback restores correct files
- Status file persistence
- Backup directory cleanup
- Edge case: insufficient disk space during backup

### No Integration Tests for Sync Workflow

**Files:** `sync/sync.js` - 725 lines

**What's not tested:**
- Full sync cycle: backup → upload → status update
- Error handling when API call fails mid-sync
- Partial sync (e.g., --dashboards flag) behavior
- Pull command preserving existing files during error

---

## Known Bugs & Issues

### Error Handling Swallows Critical Information

**Files:** `sync/sync.js` - Lines 189, 216, 281, 330

**Problem:**
```javascript
try {
  await api.uploadDashboard(payload);
} catch (err) {
  logger.error(`Failed dashboard sync (${path.basename(file)}): ${err.message}`);
}
```

- Catches and logs error, but **continues silently**
- User doesn't know which files failed
- If all files fail, still reports "Sync completed"
- No exit code indicates failure (process exits 0)

**Impact:** Automation scripts can't detect failed syncs

**Fix approach:**
1. **Track failed operations:**
   ```javascript
   const failed = [];
   // ... on error: failed.push(file)
   if (failed.length > 0) {
     console.error(`Failed to sync: ${failed.join(', ')}`);
     process.exit(1);
   }
   ```
2. **Exit with error code on failure**
3. **Provide summary report** at end

### Translation Upload Using Legacy HTTP API

**Files:** `sync/api.js` - Lines 238-287

**Problem:**
- Implements manual multipart/form-data construction with `http`/`https` modules
- Duplicates code from REST client layer
- Difficult to debug: manual header construction, boundary management
- Not using fetch API like other endpoints

**Why it exists:**
- Comment (line 239): "Use native https module for full control over Content-Type"
- Suggests fetch couldn't handle multipart properly

**Improvement path:**
1. **Investigate modern fetch solutions:**
   - `FormData` API (Node.js 18+) supports multipart
   - Use fetch with FormData instead of manual construction
2. **If must keep manual approach:**
   - Extract boundary generation to helper function
   - Add tests for multipart format correctness

### Configuration Loading Doesn't Validate URL Format

**Files:** `sync/config.js` - Lines 13-28

**Problem:**
```javascript
const baseUrl = process.env.TB_BASE_URL || process.env.BASE_URL || '';
```

- No validation that baseUrl is valid HTTPS URL
- No check that URL is reachable
- Empty string passes validation
- Error only discovered at first API call

**Recommendation:**
```javascript
function validateBaseUrl(url) {
  if (!url) throw new Error('TB_BASE_URL is required');
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('TB_BASE_URL must use http or https');
    }
  } catch (err) {
    throw new Error(`Invalid TB_BASE_URL: ${err.message}`);
  }
  return url;
}
```

---

## Missing Critical Features

### No Conflict Resolution for Dashboard Versions

**Problem:** If dashboard is edited both locally and on server, sync will fail with optimistic locking error (409)

**Files:** `sync/sync.js` - Lines 169-177

**Current behavior:**
- Catches error and logs "Failed to fetch current version"
- Skips the dashboard without user prompt
- No indication which version wins

**Impact:** User loses work if unaware of conflict

**Recommendation:**
1. **Implement conflict resolution strategies:**
   - `--overwrite`: Use local version (dangerous)
   - `--theirs`: Use server version
   - `--merge`: Attempt structural merge
   - `--prompt`: Ask user interactively
2. **Add conflict detection before sync:**
   - Check if local and server versions differ
   - Warn user and offer resolution options

### No Dry-Run / Preview Mode

**Problem:** Users can't see what will be synced before confirming

**Impact:** Risky operations (pullall, sync all) without preview

**Recommendation:**
```bash
node sync/sync.js sync --dashboards --dry-run
# Output: Would sync 3 files, upload 50 MB, estimated time 30s
```

### No Incremental Sync Option

**Problem:** Always syncs all files in selected directories

**Impact:**
- Slow for large installations
- Wastes bandwidth
- High ThingsBoard API load

**Recommendation:**
```bash
node sync/sync.js sync --dashboards --since 2026-01-20
# Only sync files modified after 2026-01-20
```

---

## Dependency Risks

### node-fetch Version 2 Deprecated

**Files:** `package.json`, `sync/api.js`

**Risk:**
- node-fetch v2 is in maintenance mode, v3+ moved to ESM-only
- Security fixes may not be backported
- Using v2.7.0 (from 2021)

**Recommendation:**
1. **Plan migration to Node.js native fetch (v18+):**
   - Remove node-fetch dependency
   - Drop support for Node.js <18
   - Simplify code (remove conditional import)
2. **Or explicitly upgrade to node-fetch v3:**
   - Requires ESM module system
   - Significant code changes

**Timeline:**
- audit: Check for known node-fetch v2 CVEs
- plan: Set Node.js 18+ as minimum
- execute: Remove node-fetch dependency

---

## Missing Observability

### No Structured Logging

**Problem:** All logging uses `console.log/error/warn` with string templates

**Files:** Throughout `sync/`, `api.js`, `backup.js`

**Impact:**
- Can't parse logs programmatically
- Hard to aggregate errors in production
- No log levels or filtering
- Hard to correlate operations

**Recommendation:**
```javascript
// Use structured logging
const log = {
  debug: (msg, data) => console.log(JSON.stringify({level: 'debug', msg, ...data})),
  error: (msg, err, data) => console.error(JSON.stringify({level: 'error', msg, error: err.message, ...data}))
};

log.error('Dashboard sync failed', err, { dashboard: title, file: filename });
// Output: {"level":"error","msg":"Dashboard sync failed","error":"409 Conflict","dashboard":"Measurements","file":"measurements.json"}
```

### No Metrics or Performance Tracking

**Problem:** No way to measure sync performance over time

**Recommendation:**
- Track file sizes, sync duration, files per second
- Monitor API response times
- Log slow operations (>10s)

---

## Scaling Limits

### Single Tenant Only

**Problem:** Sync tool hardcoded for single ThingsBoard tenant

**Impact:**
- Can't manage multiple customers/instances in one codebase
- Configuration mixing for different environments

**Recommendation:**
```bash
node sync/sync.js --instance production sync --dashboards
# Uses .env.production or different config
```

### Memory Usage with Large Dashboards

**Problem:** Entire dashboard JSON loaded into memory

**Impact:**
- Limits to machines with >4GB RAM
- Risk of OOM during peak operations

**Recommendation:**
- Stream JSON parsing for large files (using streaming JSON parser)
- Process dashboards one-at-a-time instead of collecting all first

---

*Concerns audit: 2026-01-26*

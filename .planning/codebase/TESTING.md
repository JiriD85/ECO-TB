# Testing Patterns

**Analysis Date:** 2026-01-26

## Test Framework

**Runner:**
- Not detected - No test framework found (no Jest, Vitest, Mocha, or Jasmine config)
- No test files present in codebase (no `*.test.js`, `*.spec.js` files)

**Assertion Library:**
- Not applicable - No testing infrastructure present

**Run Commands:**
- No test scripts defined in `package.json`
- Current `package.json` only contains build dependencies:
```json
{
  "dependencies": {
    "dotenv": "^17.2.3",
    "node-fetch": "^2.7.0"
  }
}
```

## Test File Organization

**Location:**
- No test files present in codebase
- Proposed structure (if tests were added): Co-located or separate `__tests__/` directories alongside source

**Naming:**
- Would follow pattern: `[name].test.js` or `[name].spec.js`

**Structure:**
- Recommended: Organize by feature/module (one test file per source file)

## Test Structure

**Suite Organization:**
No existing test suites. Example pattern observed in similar Node.js projects:

```javascript
describe('ThingsBoardApi', () => {
  describe('login()', () => {
    it('should authenticate with valid credentials', async () => { ... });
    it('should throw error on invalid credentials', async () => { ... });
  });

  describe('request()', () => {
    it('should refresh token on 401 response', async () => { ... });
  });
});
```

**Patterns:**
- Setup: Would use `beforeEach()` to initialize mocks and instances
- Teardown: Would use `afterEach()` to clean up state
- Assertion: Would use standard matchers like `.toEqual()`, `.toThrow()`, `.rejects.toThrow()`

## Mocking

**Framework:**
- Not implemented - No mocking library (Jest, Sinon, Mocha mocking) present

**Patterns:**
What would need to be mocked based on code analysis:
- HTTP requests (fetch/node-fetch calls)
- File system operations (fs module)
- ThingsBoard API responses

Example structure for future tests:
```javascript
const mockFetch = jest.fn();
const mockFs = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn()
};

// Mock ThingsBoard API responses
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ token: 'test-token', refreshToken: 'refresh' })
});
```

**What to Mock:**
- External API calls (ThingsBoard endpoints)
- File I/O operations (fs.readFile, fs.writeFile)
- Network timeouts and errors
- Authentication tokens and refresh scenarios

**What NOT to Mock:**
- Core business logic (data transformation, validation)
- Configuration loading (but stub environment variables)
- Error handling paths (test actual error behavior)

## Fixtures and Factories

**Test Data:**
No fixtures currently exist. Based on code patterns, would create factories for:

```javascript
// Dashboard fixture
const createDashboard = (overrides = {}) => ({
  id: { id: 'dashboard-123' },
  title: 'Test Dashboard',
  name: 'test_dashboard',
  configuration: { widgets: {} },
  version: 1,
  ...overrides
});

// Config fixture
const createConfig = (overrides = {}) => ({
  baseUrl: 'https://test-thingsboard.com',
  username: 'test@example.com',
  password: 'test-password',
  ...overrides
});

// API response fixture
const createApiResponse = (data, pageSize = 10) => ({
  data: data,
  totalPages: 1,
  currentPage: 0,
  pageSize: pageSize,
  totalElements: data.length
});
```

**Location:**
- Would place in `test/fixtures/` or `__tests__/fixtures/`
- One fixture file per module being tested

## Coverage

**Requirements:**
- None enforced (no coverage configuration present)
- Recommended minimum: 80% for critical paths (API, backup/restore logic)

**View Coverage:**
- Not applicable (no test infrastructure)
- Would use: `jest --coverage` if Jest were configured

## Test Types

**Unit Tests:**
- Focus: Individual functions like `getProgressColor()`, `loadJson()`, `fileChanged()`
- Scope: Test logic in isolation with mocked dependencies
- Approach: Test happy path, error cases, edge cases

Example for `sync/api.js`:
```javascript
describe('ThingsBoardApi.request()', () => {
  it('should include authorization header', async () => {
    const api = new ThingsBoardApi(config);
    await api.login();
    // Assert header contains Bearer token
  });

  it('should refresh token on 401 response', async () => {
    // First request returns 401, second succeeds
    // Assert token was refreshed
  });
});
```

**Integration Tests:**
- Focus: Multi-function workflows like sync operations
- Scope: Test interaction between API, filesystem, and backup modules
- Approach: Use test fixtures with real file operations

Example for `sync/sync.js`:
```javascript
describe('syncDashboards()', () => {
  beforeEach(async () => {
    // Create temp test directory
    // Copy test dashboards
    // Mock API responses
  });

  it('should create new dashboard on server', async () => {
    // Run sync on new dashboard file
    // Assert API.uploadDashboard called with correct payload
  });

  it('should update existing dashboard using optimistic locking', async () => {
    // Run sync on modified dashboard
    // Assert version was fetched and included
  });
});
```

**E2E Tests:**
- Not applicable - Command-line tool (no UI to test)
- Workflow validation could be done as integration tests

## Common Patterns

**Async Testing:**
```javascript
// Pattern 1: async/await
it('should load dashboards', async () => {
  const dashboards = await api.getDashboards();
  expect(dashboards).toHaveLength(2);
});

// Pattern 2: return promise (older style)
it('should refresh token', () => {
  return api.refresh().then(() => {
    expect(api.token).toBeDefined();
  });
});

// Pattern 3: done callback (old style, avoid)
it('callback style', (done) => {
  asyncFn().then(() => done()).catch(done);
});
```

**Error Testing:**
```javascript
// Test throw behavior
it('should throw on invalid JSON', async () => {
  await expect(loadJson('invalid.json')).rejects.toThrow('Invalid JSON');
});

// Test error recovery
it('should retry on 401', async () => {
  mockFetch
    .mockResolvedValueOnce({ status: 401 }) // First call fails
    .mockResolvedValueOnce({ ok: true, json: () => ({ token: 'new' }) }); // Second succeeds

  await api.request('GET', '/api/test');
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

// Test error message content
it('should include context in error', async () => {
  try {
    await api.request('POST', '/api/test', {});
  } catch (err) {
    expect(err.message).toContain('POST');
    expect(err.message).toContain('/api/test');
  }
});
```

**Backup/Restore Testing:**
```javascript
it('should backup only changed files', async () => {
  // Setup: Create backup directory with previous state
  // Action: Modify one file, call backupFiles()
  // Assert: Only changed file was backed up
  expect(changedFiles).toHaveLength(1);
  expect(changedFiles[0]).toContain('modified-file.json');
});

it('should generate changelog', async () => {
  const { backupDir } = await backupFiles(logger, files);
  const changelog = fs.readFileSync(path.join(backupDir, 'CHANGELOG.md'), 'utf8');
  expect(changelog).toContain('Changed Files');
  expect(changelog).toContain('modified-file.json');
});
```

## Areas Needing Test Coverage

**Critical Paths (High Priority):**
- `sync/api.js` ThingsBoardApi class:
  - Login and token refresh logic
  - Request error handling (401, 409, 500)
  - Dashboard/JS module upload with version handling

- `sync/backup.js`:
  - File comparison logic (`fileChanged()`)
  - Backup directory structure creation
  - Rollback restoration

**Integration Paths (Medium Priority):**
- `sync/sync.js`:
  - Dashboard sync with optimistic locking
  - JS library sync and pulling
  - Translation sync

**Edge Cases (Medium Priority):**
- Large file handling (dashboards are 2-4 MB)
- Missing configuration/environment variables
- Network failures and retries
- Concurrent operations (if any)

**Domain Logic (Low Priority):**
- Color/styling functions in `ECO Project Wizard.js` and `ECO Diagnostics Utils.js`
- Data transformation and formatting

---

*Testing analysis: 2026-01-26*

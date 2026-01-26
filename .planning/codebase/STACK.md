# Technology Stack

**Analysis Date:** 2026-01-26

## Languages

**Primary:**
- JavaScript (Node.js) - Sync tool, scripts, and server-side logic
- JavaScript (Client-side) - ThingsBoard dashboard widgets, custom actions, JS libraries

**Supporting:**
- JSON - Dashboard configurations, rule chains, widget bundles, translations
- Bash - Command execution for sync operations

## Runtime

**Environment:**
- Node.js (v12 or higher) - Required for sync tool execution
- Browser (modern) - ThingsBoard dashboards and widgets

**Package Manager:**
- npm - Dependency management
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- ThingsBoard 4.2 PE (Professional Edition) - HVAC/Building Automation monitoring platform
  - REST API - For dashboard, rule chain, widget, and resource management
  - Dashboard UI Framework - Angular-based dashboard renderer

**Backend/Sync:**
- Node.js native modules - Core sync tool infrastructure (`sync/sync.js`, `sync/api.js`, `sync/backup.js`)
- No framework dependencies (minimal dependencies approach)

**Frontend:**
- Angular (via ThingsBoard) - Dashboard widget rendering
- Material Design (mat-toolbar, mat-icon) - UI components in custom dialogs

**Testing:**
- Not detected

**Build/Dev:**
- No build tooling detected (direct Node.js execution)
- No transpilation or bundling

## Key Dependencies

**Critical:**
- `dotenv` (^17.2.3) - Environment variable management for ThingsBoard credentials
  - Used in: `sync/config.js`, root `package.json`, `sync/package.json`
  - Why it matters: Provides secure credential loading from `.env` file

- `node-fetch` (^2.7.0) - HTTP client for Node.js
  - Used in: `sync/api.js` for ThingsBoard API communication
  - Why it matters: Enables fetch API in Node.js for REST API calls

- `form-data` (^4.0.5) - Multipart form-data handling
  - Used in: `sync/api.js` for translation file uploads
  - Why it matters: Handles multipart/form-data for ThingsBoard custom translation uploads

**Infrastructure:**
- `whatwg-url` (^5.0.0) - URL parsing for node-fetch compatibility
- `tr46` (^0.0.3) - URL domain name encoding for whatwg-url
- `webidl-conversions` (^3.0.1) - Type conversions for whatwg-url

## Configuration

**Environment:**
- `.env` file with ThingsBoard instance credentials:
  - `TB_BASE_URL` - ThingsBoard instance URL (e.g., `https://diagnostics.ecoenergygroup.com`)
  - `TB_USERNAME` - Login email address
  - `TB_PASSWORD` - User password
- `.env.example` - Template for required variables

**Build:**
- No build configuration required
- Direct Node.js script execution: `node sync/sync.js [command]`

## Platform Requirements

**Development:**
- Node.js v12 or higher installed
- npm installed
- `.env` file configured with ThingsBoard credentials
- File system access to local directories

**Production:**
- ThingsBoard 4.2 PE instance accessible via HTTP/HTTPS
- Valid tenant user account with appropriate permissions
- Network connectivity to ThingsBoard instance

## Sync Tool Architecture

**Main Scripts (`sync/` directory):**
- `sync.js` - Main CLI entry point (8.8 KB)
  - Commands: sync, pull, list, backup, rollback, status
  - Supports selective syncing via flags: `--dashboards`, `--js`, `--i18n`, `--rulechains`, `--widgets`

- `api.js` - ThingsBoard API client (9.0 KB)
  - Authentication: JWT token with refresh mechanism
  - Resource management: dashboards, rule chains, widgets, JS modules, translations

- `backup.js` - Backup and restore functionality (7.5 KB)
  - Automatic backups before sync
  - Timestamped backup directories with CHANGELOG tracking

- `config.js` - Configuration loader (0.8 KB)
  - Loads and validates ThingsBoard credentials from `.env`

- `fetch-templates.js` - Widget template fetching utility

**Entry Point:**
- `sync/sync.js` - Main executable (run via `node sync/sync.js`)
- Root `package.json` provides npm scripts: `sync`, `backup`, `rollback`, `status`, `fetch-templates`

---

*Stack analysis: 2026-01-26*

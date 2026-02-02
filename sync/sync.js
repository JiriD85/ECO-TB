#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const { loadConfig } = require('./config');
const { ThingsBoardApi } = require('./api');
const {
  backupFiles,
  listBackups,
  restoreLatestBackup,
  readStatus,
  recordSync,
} = require('./backup');

const SOURCE_DIRS = {
  dashboards: 'dashboards',
  rulechains: 'rule chains',
  widgets: 'widgets',
  jslibraries: 'js library',
  translations: 'translation',
};

const logger = console;

async function readJsonFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(dirPath, entry.name));
}

async function getJsonFiles(dirName) {
  const dirPath = path.join(process.cwd(), dirName);
  try {
    return await readJsonFiles(dirPath);
  } catch (err) {
    return [];
  }
}

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

async function syncCommand(args) {
  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const selections = {
    dashboards: flags.has('--dashboards'),
    rulechains: flags.has('--rulechains'),
    widgets: flags.has('--widgets'),
    jslibraries: flags.has('--jslibraries') || flags.has('--js'),
    translations: flags.has('--translations') || flags.has('--i18n'),
  };
  const noneSelected =
    !selections.dashboards && !selections.rulechains && !selections.widgets &&
    !selections.jslibraries && !selections.translations;
  if (noneSelected || flags.has('--all')) {
    selections.dashboards = true;
    selections.rulechains = true;
    selections.widgets = true;
    selections.jslibraries = true;
    selections.translations = true;
  }

  // Collect files to sync first, then backup only those files
  const filesToSync = [];

  if (selections.dashboards) {
    const dashboardFiles = await getJsonFiles(SOURCE_DIRS.dashboards);
    filesToSync.push(...dashboardFiles);
  }
  if (selections.rulechains) {
    const rulechainFiles = await getJsonFiles(SOURCE_DIRS.rulechains);
    filesToSync.push(...rulechainFiles);
  }
  if (selections.widgets) {
    const widgetFiles = await getJsonFiles(SOURCE_DIRS.widgets);
    filesToSync.push(...widgetFiles);
  }
  if (selections.jslibraries) {
    const jsFiles = await getJsFiles(SOURCE_DIRS.jslibraries);
    filesToSync.push(...jsFiles);
  }
  if (selections.translations) {
    const translationFiles = await getJsonFiles(SOURCE_DIRS.translations);
    filesToSync.push(...translationFiles);
  }

  // Backup only the files that will be synced (if changed)
  if (filesToSync.length > 0) {
    await backupFiles(logger, filesToSync);
  }

  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  if (selections.dashboards) {
    await syncDashboards(api);
  }

  if (selections.rulechains) {
    await syncDir(api, SOURCE_DIRS.rulechains, 'rule chain', (payload) =>
      api.uploadRuleChain(payload)
    );
  }

  if (selections.widgets) {
    await syncDir(api, SOURCE_DIRS.widgets, 'widget bundle', (payload) =>
      api.uploadWidgetsBundle(payload)
    );
  }

  if (selections.jslibraries) {
    await syncJsLibraries(api);
  }

  if (selections.translations) {
    await syncTranslations(api);
  }

  await recordSync();
  logger.log('Sync completed');
}

async function syncDashboards(api, fileFilter = null) {
  const dirPath = path.join(process.cwd(), SOURCE_DIRS.dashboards);
  let files;
  try {
    files = await readJsonFiles(dirPath);
  } catch (err) {
    logger.warn(`Skipping dashboards: ${err.message}`);
    return;
  }

  if (!files.length) {
    logger.warn('No dashboards found');
    return;
  }

  // Filter files if specific names provided
  if (fileFilter && fileFilter.length > 0) {
    files = files.filter(f => {
      const basename = path.basename(f, '.json').toLowerCase();
      // Exact match or filter matches the full basename
      return fileFilter.some(filter => {
        const filterLower = filter.toLowerCase().replace('.json', '');
        return basename === filterLower || basename === filterLower.replace(/-/g, '_');
      });
    });
    if (!files.length) {
      logger.warn('No matching dashboards found for filter: ' + fileFilter.join(', '));
      return;
    }
  }

  // Get existing dashboards from server
  logger.log('Fetching existing dashboards from server...');
  const existingDashboards = await api.getDashboards();

  // Create lookup by title
  const dashboardsByTitle = new Map();
  for (const d of existingDashboards) {
    const title = d.title || d.name;
    if (!dashboardsByTitle.has(title)) {
      dashboardsByTitle.set(title, d);
    }
  }
  logger.log(`Found ${existingDashboards.length} existing dashboards`);

  for (const file of files) {
    const payload = await loadJson(file);
    const title = payload.title || payload.name;

    // Check if dashboard already exists
    const existing = dashboardsByTitle.get(title);

    if (existing) {
      // Fetch current version from server to avoid 409 conflicts (optimistic locking)
      try {
        const current = await api.getDashboard(existing.id.id);
        payload.id = current.id;
        payload.version = current.version;
        logger.log(`Updating dashboard: ${title} (ID: ${existing.id.id}, version: ${current.version})`);
      } catch (err) {
        logger.error(`Failed to fetch current version for ${title}: ${err.message}`);
        continue;
      }
    } else {
      // New dashboard - remove any ID to create new
      delete payload.id;
      delete payload.version;
      logger.log(`Creating new dashboard: ${title}`);
    }

    try {
      await api.uploadDashboard(payload);
      logger.log(`Synced dashboard: ${path.basename(file)}`);
    } catch (err) {
      logger.error(`Failed dashboard sync (${path.basename(file)}): ${err.message}`);
    }
  }
}

async function syncDir(api, dirName, label, uploader) {
  const dirPath = path.join(process.cwd(), dirName);
  let files;
  try {
    files = await readJsonFiles(dirPath);
  } catch (err) {
    logger.warn(`Skipping ${label}s: ${err.message}`);
    return;
  }

  if (!files.length) {
    logger.warn(`No ${label}s found in ${dirName}`);
    return;
  }

  for (const file of files) {
    const payload = await loadJson(file);
    logger.log(`Uploading ${label}: ${path.basename(file)}`);
    try {
      await uploader(payload);
      logger.log(`Uploaded ${label}: ${path.basename(file)}`);
    } catch (err) {
      logger.error(`Failed ${label} upload (${path.basename(file)}): ${err.message}`);
    }
  }
}

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

async function syncJsLibraries(api) {
  const dirPath = path.join(process.cwd(), SOURCE_DIRS.jslibraries);
  let files;
  try {
    files = await getJsFiles(SOURCE_DIRS.jslibraries);
  } catch (err) {
    logger.warn(`Skipping JS libraries: ${err.message}`);
    return;
  }

  if (!files.length) {
    logger.warn('No JS libraries found');
    return;
  }

  // Get existing JS modules from server
  logger.log('Fetching existing JS modules from server...');
  const existingModules = await api.getJsModules();

  // Create lookup by resourceKey (filename)
  const modulesByKey = new Map();
  for (const m of existingModules) {
    if (m.resourceKey) {
      modulesByKey.set(m.resourceKey, m);
    }
  }
  logger.log(`Found ${existingModules.length} existing JS modules`);

  for (const file of files) {
    const filename = path.basename(file);
    const title = filename.replace(/\.js$/, '');
    const content = await fs.readFile(file, 'utf8');

    // Check if module already exists
    const existing = modulesByKey.get(filename);

    try {
      if (existing) {
        logger.log(`Updating JS module: ${filename} (ID: ${existing.id.id})`);
        await api.uploadJsModule(title, filename, content, existing.id.id);
      } else {
        logger.log(`Creating new JS module: ${filename}`);
        await api.uploadJsModule(title, filename, content);
      }
      logger.log(`Synced JS module: ${filename}`);
    } catch (err) {
      logger.error(`Failed JS module sync (${filename}): ${err.message}`);
    }
  }
}

async function pullJsLibraries(api, names = []) {
  logger.log('Fetching JS modules from server...');
  const allModules = await api.getJsModules();
  logger.log(`Found ${allModules.length} JS modules on server`);

  let modulesToPull = [];

  if (names.length === 0) {
    // Pull all
    modulesToPull = allModules;
  } else {
    // Pull specific modules by name (partial match)
    for (const m of allModules) {
      const title = (m.title || m.resourceKey || '').toLowerCase();
      for (const search of names) {
        if (title.includes(search.toLowerCase())) {
          modulesToPull.push(m);
          break;
        }
      }
    }
  }

  if (modulesToPull.length === 0) {
    logger.warn('No matching JS modules found');
    return;
  }

  // Ensure js library directory exists
  const jsDir = path.join(process.cwd(), SOURCE_DIRS.jslibraries);
  await fs.mkdir(jsDir, { recursive: true });

  for (const m of modulesToPull) {
    const resourceId = m.id.id;
    const filename = m.resourceKey || `${m.title}.js`;

    try {
      logger.log(`Downloading: ${filename}`);
      const content = await api.downloadResource(resourceId);

      const filePath = path.join(jsDir, filename);
      await fs.writeFile(filePath, content);
      logger.log(`Saved: ${filename}`);
    } catch (err) {
      logger.error(`Failed to download ${filename}: ${err.message}`);
    }
  }

  logger.log(`Pull completed: ${modulesToPull.length} JS module(s)`);
}

// ==================== Translations Sync ====================

async function syncTranslations(api) {
  const dirPath = path.join(process.cwd(), SOURCE_DIRS.translations);
  let files;
  try {
    files = await readJsonFiles(dirPath);
  } catch (err) {
    logger.warn(`Skipping translations: ${err.message}`);
    return;
  }

  if (!files.length) {
    logger.warn('No translation files found');
    return;
  }

  // Translation files are named like: de_DE_custom_translation.json, en_US_custom_translation.json
  for (const file of files) {
    const filename = path.basename(file);
    // Extract locale from filename (e.g., "de_DE" from "de_DE_custom_translation.json")
    const match = filename.match(/^([a-z]{2}_[A-Z]{2})_custom_translation\.json$/);
    if (!match) {
      logger.warn(`Skipping ${filename}: does not match expected pattern (e.g., de_DE_custom_translation.json)`);
      continue;
    }

    const locale = match[1];
    const translationMap = await loadJson(file);

    try {
      logger.log(`Uploading translation: ${locale}`);
      await api.saveCustomTranslation(locale, translationMap);
      logger.log(`Synced translation: ${locale}`);
    } catch (err) {
      logger.error(`Failed translation sync (${locale}): ${err.message}`);
    }
  }
}

async function pullTranslations(api, locales = []) {
  logger.log('Fetching available locales...');

  // If no specific locales requested, try to get from white labeling params
  let localesToPull = locales;

  if (localesToPull.length === 0) {
    // Try some common locales
    localesToPull = ['de_DE', 'en_US', 'fr_FR', 'es_ES', 'it_IT'];
    logger.log('No locales specified, trying common locales...');
  }

  // Ensure translations directory exists
  const translationDir = path.join(process.cwd(), SOURCE_DIRS.translations);
  await fs.mkdir(translationDir, { recursive: true });

  let downloadedCount = 0;

  for (const locale of localesToPull) {
    try {
      logger.log(`Downloading translation: ${locale}`);
      const translationMap = await api.getCustomTranslation(locale);

      if (Object.keys(translationMap).length === 0) {
        logger.log(`No custom translation for ${locale}`);
        continue;
      }

      const filename = `${locale}_custom_translation.json`;
      const filePath = path.join(translationDir, filename);
      await fs.writeFile(filePath, JSON.stringify(translationMap, null, 2));
      logger.log(`Saved: ${filename}`);
      downloadedCount++;
    } catch (err) {
      if (!err.message.includes('404')) {
        logger.error(`Failed to download ${locale}: ${err.message}`);
      }
    }
  }

  logger.log(`Pull completed: ${downloadedCount} translation(s)`);
}

async function pushCommand(args) {
  // Push specific dashboards by name
  const names = args.filter((arg) => !arg.startsWith('--'));

  if (names.length === 0) {
    logger.error('Usage: node sync/sync.js push <dashboard-name> [dashboard-name2...]');
    logger.log('Example: node sync/sync.js push administration');
    process.exit(1);
  }

  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  await syncDashboards(api, names);
  logger.log('Push completed');
}

async function pushJsCommand(args) {
  // Push specific JS libraries by name
  const names = args.filter((arg) => !arg.startsWith('--'));

  if (names.length === 0) {
    logger.error('Usage: node sync/sync.js push-js <library-name> [library-name2...]');
    logger.log('Example: node sync/sync.js push-js "ECO Project Wizard"');
    process.exit(1);
  }

  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  // Get existing JS modules from server
  logger.log('Fetching existing JS modules from server...');
  const existingModules = await api.getJsModules();

  // Create lookup by resourceKey (filename) and title
  const modulesByKey = new Map();
  for (const m of existingModules) {
    if (m.resourceKey) modulesByKey.set(m.resourceKey.toLowerCase(), m);
    if (m.title) modulesByKey.set(m.title.toLowerCase(), m);
  }

  // Find and upload matching local files
  let localFiles;
  try {
    localFiles = await getJsFiles(SOURCE_DIRS.jslibraries);
  } catch (err) {
    logger.error(`Cannot read JS libraries directory: ${err.message}`);
    process.exit(1);
  }

  let pushedCount = 0;
  for (const searchName of names) {
    const searchLower = searchName.toLowerCase();

    // Find local file that matches the search name
    const matchingFile = localFiles.find((f) => {
      const basename = path.basename(f, '.js').toLowerCase();
      return basename.includes(searchLower) || basename === searchLower;
    });

    if (!matchingFile) {
      logger.error(`No local file found matching: ${searchName}`);
      continue;
    }

    const filename = path.basename(matchingFile);
    const title = filename.replace(/\.js$/, '');
    const content = await fs.readFile(matchingFile, 'utf8');

    // Find existing module on server
    const existing = modulesByKey.get(filename.toLowerCase()) || modulesByKey.get(title.toLowerCase());

    try {
      if (existing) {
        logger.log(`Updating: ${filename} (ID: ${existing.id.id})`);
        await api.uploadJsModule(title, filename, content, existing.id.id);
      } else {
        logger.log(`Creating: ${filename}`);
        await api.uploadJsModule(title, filename, content);
      }
      logger.log(`Pushed: ${filename}`);
      pushedCount++;
    } catch (err) {
      logger.error(`Failed to push ${filename}: ${err.message}`);
    }
  }

  logger.log(`Push completed: ${pushedCount} JS module(s)`);
}

async function backupCommand() {
  const { createBackup } = require('./backup');
  await createBackup(logger);
}

async function rollbackCommand() {
  await restoreLatestBackup(logger);
}

async function statusCommand() {
  const status = await readStatus();
  const backups = await listBackups();
  logger.log('Status:');
  logger.log(`Last backup: ${status.lastBackup || 'n/a'}`);
  logger.log(`Last sync: ${status.lastSync || 'n/a'}`);
  logger.log(`Last pull: ${status.lastPull || 'n/a'}`);
  logger.log(`Last rollback: ${status.lastRollback || 'n/a'}`);
  logger.log(`Backups: ${backups.length}`);
  if (backups.length) {
    logger.log(`Latest backup: ${backups[backups.length - 1]}`);
  }
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, '_')
    .replace(/^_+|_+$/g, '');
}

async function pullCommand(args) {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  // Parse arguments: can be dashboard titles or --all
  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const titles = args.filter((arg) => !arg.startsWith('--'));

  logger.log('Fetching dashboards from server...');
  const allDashboards = await api.getDashboards();
  logger.log(`Found ${allDashboards.length} dashboards on server`);

  let dashboardsToPull = [];

  if (flags.has('--all') || titles.length === 0) {
    // Pull all dashboards
    dashboardsToPull = allDashboards;
  } else {
    // Pull specific dashboards by title (partial match)
    for (const d of allDashboards) {
      const title = (d.title || d.name || '').toLowerCase();
      for (const search of titles) {
        if (title.includes(search.toLowerCase())) {
          dashboardsToPull.push(d);
          break;
        }
      }
    }
  }

  if (dashboardsToPull.length === 0) {
    logger.warn('No matching dashboards found');
    return;
  }

  // Ensure dashboards directory exists
  const dashboardDir = path.join(process.cwd(), SOURCE_DIRS.dashboards);
  await fs.mkdir(dashboardDir, { recursive: true });

  // Backup existing files before overwriting
  const existingFiles = await getJsonFiles(SOURCE_DIRS.dashboards);
  if (existingFiles.length > 0) {
    await backupFiles(logger, existingFiles);
  }

  // Download and save each dashboard
  for (const d of dashboardsToPull) {
    const dashboardId = d.id.id;
    const title = d.title || d.name;

    try {
      logger.log(`Downloading: ${title}`);
      const fullDashboard = await api.getDashboard(dashboardId);

      // Generate filename from title
      const filename = sanitizeFilename(title) + '.json';
      const filePath = path.join(dashboardDir, filename);

      // Write formatted JSON
      await fs.writeFile(filePath, JSON.stringify(fullDashboard, null, 2));
      logger.log(`Saved: ${filename}`);
    } catch (err) {
      logger.error(`Failed to download ${title}: ${err.message}`);
    }
  }

  // Update status
  const { updateStatus } = require('./backup');
  await updateStatus({ lastPull: new Date().toISOString().replace('T', '_').substring(0, 19) });

  logger.log(`Pull completed: ${dashboardsToPull.length} dashboard(s)`);
}

async function listCommand() {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  logger.log('Fetching dashboards from server...');
  const dashboards = await api.getDashboards();

  logger.log(`\nFound ${dashboards.length} dashboards:\n`);
  for (const d of dashboards) {
    const title = d.title || d.name;
    const id = d.id.id;
    logger.log(`  ${title}`);
    logger.log(`    ID: ${id}`);
  }
}

async function listJsCommand() {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  logger.log('Fetching JS modules from server...');
  const modules = await api.getJsModules();

  logger.log(`\nFound ${modules.length} JS modules:\n`);
  for (const m of modules) {
    const title = m.title || m.resourceKey;
    const id = m.id.id;
    const key = m.resourceKey || '';
    logger.log(`  ${title}`);
    logger.log(`    ID: ${id}`);
    logger.log(`    Key: ${key}`);
  }
}

async function listTranslationsCommand() {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  // Try common locales and report which have translations
  const localesToCheck = ['de_DE', 'en_US', 'fr_FR', 'es_ES', 'it_IT', 'nl_NL', 'pl_PL', 'pt_PT', 'ru_RU', 'zh_CN'];

  logger.log('Checking for custom translations...\n');

  const foundLocales = [];
  for (const locale of localesToCheck) {
    try {
      const translation = await api.getCustomTranslation(locale);
      if (Object.keys(translation).length > 0) {
        foundLocales.push({ locale, keyCount: Object.keys(translation).length });
      }
    } catch (err) {
      // Locale not available, skip
    }
  }

  if (foundLocales.length === 0) {
    logger.log('No custom translations found.');
  } else {
    logger.log(`Found ${foundLocales.length} locale(s) with custom translations:\n`);
    for (const { locale, keyCount } of foundLocales) {
      logger.log(`  ${locale}`);
      logger.log(`    Keys: ${keyCount}`);
    }
  }
}

async function pullJsCommand(args) {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const names = args.filter((arg) => !arg.startsWith('--'));

  if (flags.has('--all') || names.length === 0) {
    await pullJsLibraries(api, []);
  } else {
    await pullJsLibraries(api, names);
  }

  // Update status
  const { updateStatus } = require('./backup');
  await updateStatus({ lastPull: new Date().toISOString().replace('T', '_').substring(0, 19) });
}

async function pullTranslationsCommand(args) {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const locales = args.filter((arg) => !arg.startsWith('--'));

  if (flags.has('--all')) {
    await pullTranslations(api, []);
  } else if (locales.length > 0) {
    await pullTranslations(api, locales);
  } else {
    // Default: try de_DE and en_US
    await pullTranslations(api, ['de_DE', 'en_US']);
  }

  // Update status
  const { updateStatus } = require('./backup');
  await updateStatus({ lastPull: new Date().toISOString().replace('T', '_').substring(0, 19) });
}

function printUsage() {
  logger.log('Usage: node sync/sync.js <command> [options]');
  logger.log('');
  logger.log('Commands:');
  logger.log('  sync [options]       Push ALL local files to ThingsBoard');
  logger.log('  push <name...>       Push SPECIFIC dashboard(s) to ThingsBoard');
  logger.log('  push-js <name...>    Push SPECIFIC JS library/ies to ThingsBoard');
  logger.log('  pull [titles...]     Download dashboards from ThingsBoard');
  logger.log('  pull-js [names...]   Download JS modules from ThingsBoard');
  logger.log('  pull-i18n [locales]  Download custom translations');
  logger.log('  list                 List all dashboards on server');
  logger.log('  list-js              List all JS modules on server');
  logger.log('  list-i18n            List available custom translations');
  logger.log('  backup               Create a backup of local files');
  logger.log('  rollback             Restore from latest backup');
  logger.log('  status               Show sync status');
  logger.log('');
  logger.log('Sync options:');
  logger.log('  --dashboards         Sync only dashboards');
  logger.log('  --rulechains         Sync only rule chains');
  logger.log('  --widgets            Sync only widgets');
  logger.log('  --jslibraries, --js  Sync only JS libraries');
  logger.log('  --translations, --i18n  Sync only translations');
  logger.log('  --all                Sync everything (default)');
  logger.log('');
  logger.log('Push options:');
  logger.log('  <name>               Dashboard filename (partial match)');
  logger.log('');
  logger.log('Pull options:');
  logger.log('  --all                Download all items');
  logger.log('  <title/name/locale>  Download items matching pattern');
  logger.log('');
  logger.log('Examples:');
  logger.log('  node sync/sync.js push administration');
  logger.log('  node sync/sync.js push measurements navigation');
  logger.log('  node sync/sync.js push-js "ECO Project Wizard"');
  logger.log('  node sync/sync.js sync --dashboards');
  logger.log('  node sync/sync.js sync --js');
  logger.log('  node sync/sync.js sync --i18n');
  logger.log('  node sync/sync.js pull "Smart Diagnostics"');
  logger.log('  node sync/sync.js pull-js "ECO Data"');
  logger.log('  node sync/sync.js pull-js --all');
  logger.log('  node sync/sync.js pull-i18n de_DE en_US');
  logger.log('  node sync/sync.js list-js');
  logger.log('  node sync/sync.js list-i18n');
}

async function main() {
  const [, , command, ...args] = process.argv;
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  try {
    switch (command) {
      case 'sync':
        await syncCommand(args);
        break;
      case 'push':
        await pushCommand(args);
        break;
      case 'push-js':
        await pushJsCommand(args);
        break;
      case 'pull':
        await pullCommand(args);
        break;
      case 'pull-js':
        await pullJsCommand(args);
        break;
      case 'pull-i18n':
      case 'pull-translations':
        await pullTranslationsCommand(args);
        break;
      case 'list':
        await listCommand();
        break;
      case 'list-js':
        await listJsCommand();
        break;
      case 'list-i18n':
      case 'list-translations':
        await listTranslationsCommand();
        break;
      case 'backup':
        await backupCommand();
        break;
      case 'rollback':
        await rollbackCommand();
        break;
      case 'status':
        await statusCommand();
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();

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

async function pushTranslationsCommand(args) {
  const locales = args.filter((arg) => !arg.startsWith('--'));

  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  // Find local translation files
  let localFiles;
  try {
    localFiles = await readJsonFiles(path.join(process.cwd(), SOURCE_DIRS.translations));
  } catch (err) {
    logger.error(`Cannot read translations directory: ${err.message}`);
    process.exit(1);
  }

  if (localFiles.length === 0) {
    logger.warn('No translation files found');
    return;
  }

  // Filter files if specific locales provided
  let filesToPush = localFiles;
  if (locales.length > 0) {
    filesToPush = localFiles.filter(f => {
      const filename = path.basename(f).toLowerCase();
      return locales.some(locale => filename.includes(locale.toLowerCase()));
    });

    if (filesToPush.length === 0) {
      logger.error(`No matching translation files found for: ${locales.join(', ')}`);
      process.exit(1);
    }
  }

  let pushedCount = 0;
  for (const file of filesToPush) {
    const filename = path.basename(file);
    // Extract locale from filename (e.g., "de_DE" from "de_DE_custom_translation.json")
    const match = filename.match(/^([a-z]{2}_[A-Z]{2})_custom_translation\.json$/);
    if (!match) {
      logger.warn(`Skipping ${filename}: does not match expected pattern`);
      continue;
    }

    const locale = match[1];
    const translationMap = await loadJson(file);

    try {
      logger.log(`Uploading: ${locale}`);
      await api.saveCustomTranslation(locale, translationMap);
      logger.log(`Pushed: ${filename}`);
      pushedCount++;
    } catch (err) {
      logger.error(`Failed to push ${locale}: ${err.message}`);
    }
  }

  logger.log(`Push completed: ${pushedCount} translation(s)`);
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

// ==================== Rule Chains ====================

async function listRuleChainsCommand() {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  logger.log('Fetching rule chains from server...');
  const ruleChains = await api.getRuleChains();

  logger.log(`\nFound ${ruleChains.length} rule chains:\n`);
  for (const rc of ruleChains) {
    const name = rc.name;
    const id = rc.id.id;
    const type = rc.type || 'CORE';
    const root = rc.root ? ' (ROOT)' : '';
    logger.log(`  ${name}${root}`);
    logger.log(`    ID: ${id}`);
    logger.log(`    Type: ${type}`);
  }
}

async function pullRuleChainCommand(args) {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const names = args.filter((arg) => !arg.startsWith('--'));

  logger.log('Fetching rule chains from server...');
  const allRuleChains = await api.getRuleChains();
  logger.log(`Found ${allRuleChains.length} rule chains on server`);

  let ruleChainsToPull = [];

  if (flags.has('--all')) {
    ruleChainsToPull = allRuleChains;
  } else if (names.length > 0) {
    // Pull specific rule chains by name (partial match)
    for (const rc of allRuleChains) {
      const rcName = (rc.name || '').toLowerCase();
      for (const search of names) {
        if (rcName.includes(search.toLowerCase()) || rcName === search.toLowerCase()) {
          ruleChainsToPull.push(rc);
          break;
        }
      }
    }
  } else {
    logger.error('Usage: node sync/sync.js pull-rulechain <name> [name2...]');
    logger.log('       node sync/sync.js pull-rulechain --all');
    process.exit(1);
  }

  if (ruleChainsToPull.length === 0) {
    logger.warn('No matching rule chains found');
    return;
  }

  // Ensure rule chains directory exists
  const rcDir = path.join(process.cwd(), SOURCE_DIRS.rulechains);
  await fs.mkdir(rcDir, { recursive: true });

  for (const rc of ruleChainsToPull) {
    const ruleChainId = rc.id.id;
    const name = rc.name;

    try {
      logger.log(`Downloading: ${name}`);
      const exported = await api.exportRuleChain(ruleChainId);

      // Generate filename from name
      const filename = sanitizeFilename(name) + '.json';
      const filePath = path.join(rcDir, filename);

      // Write formatted JSON
      await fs.writeFile(filePath, JSON.stringify(exported, null, 2));
      logger.log(`Saved: ${filename}`);
    } catch (err) {
      logger.error(`Failed to download ${name}: ${err.message}`);
    }
  }

  // Update status
  const { updateStatus } = require('./backup');
  await updateStatus({ lastPull: new Date().toISOString().replace('T', '_').substring(0, 19) });

  logger.log(`Pull completed: ${ruleChainsToPull.length} rule chain(s)`);
}

async function pushRuleChainCommand(args) {
  const names = args.filter((arg) => !arg.startsWith('--'));

  if (names.length === 0) {
    logger.error('Usage: node sync/sync.js push-rulechain <name> [name2...]');
    logger.log('Example: node sync/sync.js push-rulechain "Measurement"');
    process.exit(1);
  }

  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  // Get existing rule chains from server for ID lookup
  logger.log('Fetching existing rule chains from server...');
  const existingRuleChains = await api.getRuleChains();

  // Create lookup by name
  const rcByName = new Map();
  for (const rc of existingRuleChains) {
    if (rc.name) {
      rcByName.set(rc.name.toLowerCase(), rc);
    }
  }

  // Find local files
  let localFiles;
  try {
    localFiles = await readJsonFiles(path.join(process.cwd(), SOURCE_DIRS.rulechains));
  } catch (err) {
    logger.error(`Cannot read rule chains directory: ${err.message}`);
    process.exit(1);
  }

  let pushedCount = 0;
  for (const searchName of names) {
    const searchLower = searchName.toLowerCase();

    // Find local file that matches the search name
    const matchingFile = localFiles.find((f) => {
      const basename = path.basename(f, '.json').toLowerCase();
      return basename.includes(searchLower) || basename === searchLower;
    });

    if (!matchingFile) {
      logger.error(`No local file found matching: ${searchName}`);
      continue;
    }

    const filename = path.basename(matchingFile);
    const payload = await loadJson(matchingFile);

    // Get rule chain name from payload
    const rcName = payload.ruleChain?.name || payload.name;
    if (!rcName) {
      logger.error(`Invalid rule chain file (no name found): ${filename}`);
      continue;
    }

    // Check if rule chain exists on server
    const existing = rcByName.get(rcName.toLowerCase());

    try {
      if (existing) {
        logger.log(`Updating: ${rcName} (ID: ${existing.id.id})`);
        await api.importRuleChain(payload, existing.id.id);
      } else {
        // Remove ID for new creation
        if (payload.ruleChain.id) delete payload.ruleChain.id;
        logger.log(`Creating: ${rcName}`);
        await api.importRuleChain(payload);
      }
      logger.log(`Pushed: ${filename}`);
      pushedCount++;
    } catch (err) {
      logger.error(`Failed to push ${filename}: ${err.message}`);
    }
  }

  logger.log(`Push completed: ${pushedCount} rule chain(s)`);
}

// ==================== Widgets ====================

async function listWidgetsCommand() {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  logger.log('Fetching widget bundles from server...');
  const bundles = await api.getWidgetsBundles();

  logger.log(`\nFound ${bundles.length} widget bundles:\n`);
  for (const b of bundles) {
    const title = b.title;
    const id = b.id.id;
    const alias = b.alias || '';
    const isSystem = b.tenantId?.id === '13814000-1dd2-11b2-8080-808080808080' ? ' (SYSTEM)' : '';
    logger.log(`  ${title}${isSystem}`);
    logger.log(`    ID: ${id}`);
    logger.log(`    Alias: ${alias}`);
  }
}

async function pullWidgetCommand(args) {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const names = args.filter((arg) => !arg.startsWith('--'));

  logger.log('Fetching widget bundles from server...');
  const allBundles = await api.getWidgetsBundles();

  // Filter out system bundles (tenant ID is null or system tenant)
  const tenantBundles = allBundles.filter(b => {
    const tenantId = b.tenantId?.id;
    return tenantId && tenantId !== '13814000-1dd2-11b2-8080-808080808080';
  });
  logger.log(`Found ${tenantBundles.length} tenant widget bundles (${allBundles.length} total)`);

  let bundlesToPull = [];

  if (flags.has('--all')) {
    bundlesToPull = tenantBundles;
  } else if (names.length > 0) {
    // Pull specific bundles by name (partial match)
    for (const b of tenantBundles) {
      const bName = (b.title || b.alias || '').toLowerCase();
      for (const search of names) {
        if (bName.includes(search.toLowerCase()) || bName === search.toLowerCase()) {
          bundlesToPull.push(b);
          break;
        }
      }
    }
  } else {
    logger.error('Usage: node sync/sync.js pull-widget <name> [name2...]');
    logger.log('       node sync/sync.js pull-widget --all');
    process.exit(1);
  }

  if (bundlesToPull.length === 0) {
    logger.warn('No matching widget bundles found');
    return;
  }

  // Ensure widgets directory exists
  const widgetDir = path.join(process.cwd(), SOURCE_DIRS.widgets);
  await fs.mkdir(widgetDir, { recursive: true });

  for (const b of bundlesToPull) {
    const bundleId = b.id.id;
    const title = b.title || b.alias;

    try {
      logger.log(`Downloading: ${title}`);
      const exported = await api.exportWidgetsBundle(bundleId);

      // Generate filename from title
      const filename = sanitizeFilename(title) + '.json';
      const filePath = path.join(widgetDir, filename);

      // Write formatted JSON
      await fs.writeFile(filePath, JSON.stringify(exported, null, 2));
      logger.log(`Saved: ${filename} (${exported.widgetTypes?.length || 0} widget types)`);
    } catch (err) {
      logger.error(`Failed to download ${title}: ${err.message}`);
    }
  }

  // Update status
  const { updateStatus } = require('./backup');
  await updateStatus({ lastPull: new Date().toISOString().replace('T', '_').substring(0, 19) });

  logger.log(`Pull completed: ${bundlesToPull.length} widget bundle(s)`);
}

async function pushWidgetCommand(args) {
  const names = args.filter((arg) => !arg.startsWith('--'));

  if (names.length === 0) {
    logger.error('Usage: node sync/sync.js push-widget <name> [name2...]');
    logger.log('Example: node sync/sync.js push-widget "SD Map Projects"');
    process.exit(1);
  }

  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  // Get existing widget bundles from server for ID lookup
  logger.log('Fetching existing widget bundles from server...');
  const existingBundles = await api.getWidgetsBundles();

  // Create lookup by title and alias
  const bundleByName = new Map();
  for (const b of existingBundles) {
    if (b.title) bundleByName.set(b.title.toLowerCase(), b);
    if (b.alias) bundleByName.set(b.alias.toLowerCase(), b);
  }

  // Find local files
  let localFiles;
  try {
    localFiles = await readJsonFiles(path.join(process.cwd(), SOURCE_DIRS.widgets));
  } catch (err) {
    logger.error(`Cannot read widgets directory: ${err.message}`);
    process.exit(1);
  }

  let pushedCount = 0;
  for (const searchName of names) {
    const searchLower = searchName.toLowerCase();

    // Find local file that matches the search name
    const matchingFile = localFiles.find((f) => {
      const basename = path.basename(f, '.json').toLowerCase();
      return basename.includes(searchLower) || basename === searchLower;
    });

    if (!matchingFile) {
      logger.error(`No local file found matching: ${searchName}`);
      continue;
    }

    const filename = path.basename(matchingFile);
    const payload = await loadJson(matchingFile);

    // Get bundle name from payload
    const bundleTitle = payload.widgetsBundle?.title || payload.widgetsBundle?.alias;
    if (!bundleTitle) {
      logger.error(`Invalid widget bundle file (no title found): ${filename}`);
      continue;
    }

    // Check if bundle exists on server
    const existing = bundleByName.get(bundleTitle.toLowerCase());

    try {
      if (existing) {
        logger.log(`Updating: ${bundleTitle} (ID: ${existing.id.id})`);
        await api.importWidgetsBundle(payload, existing.id.id);
      } else {
        logger.log(`Creating: ${bundleTitle}`);
        await api.importWidgetsBundle(payload);
      }
      logger.log(`Pushed: ${filename}`);
      pushedCount++;
    } catch (err) {
      logger.error(`Failed to push ${filename}: ${err.message}`);
    }
  }

  logger.log(`Push completed: ${pushedCount} widget bundle(s)`);
}

function printUsage() {
  logger.log('Usage: node sync/sync.js <command> [options]');
  logger.log('');
  logger.log('Commands:');
  logger.log('  sync [options]            Push ALL local files to ThingsBoard (BATCH - use with caution!)');
  logger.log('');
  logger.log('  Dashboards:');
  logger.log('    push <name...>          Push SPECIFIC dashboard(s)');
  logger.log('    pull [name...]          Download dashboard(s)');
  logger.log('    list                    List all dashboards on server');
  logger.log('');
  logger.log('  JS Libraries:');
  logger.log('    push-js <name...>       Push SPECIFIC JS library/ies');
  logger.log('    pull-js [name...]       Download JS module(s)');
  logger.log('    list-js                 List all JS modules on server');
  logger.log('');
  logger.log('  Rule Chains:');
  logger.log('    push-rulechain <name>   Push SPECIFIC rule chain(s)');
  logger.log('    pull-rulechain <name>   Download rule chain(s)');
  logger.log('    list-rulechains         List all rule chains on server');
  logger.log('');
  logger.log('  Widgets:');
  logger.log('    push-widget <name>      Push SPECIFIC widget bundle(s)');
  logger.log('    pull-widget <name>      Download widget bundle(s)');
  logger.log('    list-widgets            List all widget bundles on server');
  logger.log('');
  logger.log('  Translations:');
  logger.log('    push-i18n [locales]     Push custom translation(s)');
  logger.log('    pull-i18n [locales]     Download custom translations');
  logger.log('    list-i18n               List available custom translations');
  logger.log('');
  logger.log('  Utilities:');
  logger.log('    backup                  Create a backup of local files');
  logger.log('    rollback                Restore from latest backup');
  logger.log('    status                  Show sync status');
  logger.log('');
  logger.log('Sync options (BATCH - dangerous!):');
  logger.log('  --dashboards              Sync only dashboards');
  logger.log('  --rulechains              Sync only rule chains');
  logger.log('  --widgets                 Sync only widgets');
  logger.log('  --jslibraries, --js       Sync only JS libraries');
  logger.log('  --translations, --i18n    Sync only translations');
  logger.log('  --all                     Sync everything (default)');
  logger.log('');
  logger.log('Examples:');
  logger.log('  node sync/sync.js push administration');
  logger.log('  node sync/sync.js push-js "ECO Project Wizard"');
  logger.log('  node sync/sync.js push-rulechain "Measurement"');
  logger.log('  node sync/sync.js pull measurements');
  logger.log('  node sync/sync.js pull-js "ECO Data"');
  logger.log('  node sync/sync.js pull-rulechain "Measurement"');
  logger.log('  node sync/sync.js pull-rulechain --all');
  logger.log('  node sync/sync.js list-rulechains');
  logger.log('  node sync/sync.js push-widget "SD Map Projects"');
  logger.log('  node sync/sync.js pull-widget --all');
  logger.log('  node sync/sync.js list-widgets');
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
      case 'push-i18n':
      case 'push-translations':
        await pushTranslationsCommand(args);
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
      case 'push-rulechain':
        await pushRuleChainCommand(args);
        break;
      case 'pull-rulechain':
        await pullRuleChainCommand(args);
        break;
      case 'list-rulechains':
        await listRuleChainsCommand();
        break;
      case 'push-widget':
        await pushWidgetCommand(args);
        break;
      case 'pull-widget':
        await pullWidgetCommand(args);
        break;
      case 'list-widgets':
        await listWidgetsCommand();
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

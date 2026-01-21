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
  };
  const noneSelected =
    !selections.dashboards && !selections.rulechains && !selections.widgets;
  if (noneSelected || flags.has('--all')) {
    selections.dashboards = true;
    selections.rulechains = true;
    selections.widgets = true;
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

  // Backup only the files that will be synced
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

  await recordSync();
  logger.log('Sync completed');
}

async function syncDashboards(api) {
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
      // Update existing dashboard - add the ID
      payload.id = existing.id;
      logger.log(`Updating dashboard: ${title} (ID: ${existing.id.id})`);
    } else {
      // New dashboard - remove any ID to create new
      delete payload.id;
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

async function backupCommand() {
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

function printUsage() {
  logger.log('Usage: node sync/sync.js <command> [options]');
  logger.log('');
  logger.log('Commands:');
  logger.log('  sync [options]     Push local dashboards to ThingsBoard');
  logger.log('  pull [titles...]   Download dashboards from ThingsBoard');
  logger.log('  list               List all dashboards on server');
  logger.log('  backup             Create a backup of local files');
  logger.log('  rollback           Restore from latest backup');
  logger.log('  status             Show sync status');
  logger.log('');
  logger.log('Sync options:');
  logger.log('  --dashboards       Sync only dashboards');
  logger.log('  --rulechains       Sync only rule chains');
  logger.log('  --widgets          Sync only widgets');
  logger.log('  --all              Sync everything (default)');
  logger.log('');
  logger.log('Pull options:');
  logger.log('  --all              Download all dashboards');
  logger.log('  <title>            Download dashboards matching title (partial match)');
  logger.log('');
  logger.log('Examples:');
  logger.log('  node sync/sync.js sync --dashboards');
  logger.log('  node sync/sync.js pull "Smart Diagnostics"');
  logger.log('  node sync/sync.js pull --all');
  logger.log('  node sync/sync.js list');
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
      case 'pull':
        await pullCommand(args);
        break;
      case 'list':
        await listCommand();
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

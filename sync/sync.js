#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

const { loadConfig } = require('./config');
const { ThingsBoardApi } = require('./api');
const {
  createBackup,
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

  await createBackup(logger);

  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger });
  await api.login();

  if (selections.dashboards) {
    await syncDir(api, SOURCE_DIRS.dashboards, 'dashboard', (payload) =>
      api.uploadDashboard(payload)
    );
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
  logger.log(`Last rollback: ${status.lastRollback || 'n/a'}`);
  logger.log(`Backups: ${backups.length}`);
  if (backups.length) {
    logger.log(`Latest backup: ${backups[backups.length - 1]}`);
  }
}

function printUsage() {
  logger.log('Usage: node sync/sync.js <command> [options]');
  logger.log('Commands: sync, backup, rollback, status');
  logger.log('Sync options: --dashboards --rulechains --widgets --all');
}

async function main() {
  const [, , command, ...args] = process.argv;
  if (!command) {
    printUsage();
    process.exit(1);
  }

  try {
    switch (command) {
      case 'sync':
        await syncCommand(args);
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
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();

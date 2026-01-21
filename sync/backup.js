const fs = require('fs/promises');
const path = require('path');

const BACKUP_ROOT = path.join(process.cwd(), 'backups');
const STATUS_FILE = path.join(BACKUP_ROOT, '.sync-status.json');
const SOURCE_DIRS = ['dashboards', 'rule chains', 'widgets'];

function getTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyDir(source, target) {
  await ensureDir(target);
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await ensureDir(path.dirname(destPath));
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function pathExists(testPath) {
  try {
    await fs.access(testPath);
    return true;
  } catch (err) {
    return false;
  }
}

async function createBackup(logger = console) {
  await ensureDir(BACKUP_ROOT);
  const timestamp = getTimestamp();
  const backupDir = path.join(BACKUP_ROOT, timestamp);
  await ensureDir(backupDir);

  for (const dirName of SOURCE_DIRS) {
    const src = path.join(process.cwd(), dirName);
    if (await pathExists(src)) {
      await copyDir(src, path.join(backupDir, dirName));
      logger.log(`Backed up ${dirName}`);
    } else {
      logger.warn(`Skipped missing directory: ${dirName}`);
    }
  }

  await updateStatus({ lastBackup: timestamp });
  logger.log(`Backup created at ${backupDir}`);
  return { backupDir, timestamp };
}

async function listBackups() {
  if (!(await pathExists(BACKUP_ROOT))) return [];
  const entries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function restoreLatestBackup(logger = console) {
  const backups = await listBackups();
  if (!backups.length) {
    throw new Error('No backups available to restore');
  }

  const latest = backups[backups.length - 1];
  const backupDir = path.join(BACKUP_ROOT, latest);

  for (const dirName of SOURCE_DIRS) {
    const src = path.join(backupDir, dirName);
    const dest = path.join(process.cwd(), dirName);
    if (await pathExists(dest)) {
      await fs.rm(dest, { recursive: true, force: true });
    }
    if (await pathExists(src)) {
      await copyDir(src, dest);
      logger.log(`Restored ${dirName}`);
    } else {
      logger.warn(`Backup missing directory: ${dirName}`);
    }
  }

  await updateStatus({ lastRollback: getTimestamp() });
  logger.log(`Rollback completed from ${latest}`);
  return latest;
}

async function readStatus() {
  if (!(await pathExists(STATUS_FILE))) return {};
  try {
    const data = await fs.readFile(STATUS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

async function updateStatus(update) {
  await ensureDir(BACKUP_ROOT);
  const current = await readStatus();
  const next = { ...current, ...update };
  await fs.writeFile(STATUS_FILE, JSON.stringify(next, null, 2));
  return next;
}

async function recordSync() {
  return updateStatus({ lastSync: getTimestamp() });
}

module.exports = {
  createBackup,
  listBackups,
  restoreLatestBackup,
  readStatus,
  recordSync,
};

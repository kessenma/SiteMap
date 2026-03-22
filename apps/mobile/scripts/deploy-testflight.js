#!/usr/bin/env node
/**
 * Deploy to TestFlight via Fastlane rock_beta lane.
 *
 * Usage:
 *   node scripts/deploy-testflight.js          # beta (default)
 *   node scripts/deploy-testflight.js release   # release
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IOS_DIR = path.join(ROOT, 'ios');

const mode = process.argv[2] || 'beta';
const lane = mode === 'release' ? 'rock_release' : 'rock_beta';
const logDir = mode === 'release' ? 'deploy-release' : 'deploy-beta';

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function run(cmd, opts = {}) {
  const result = spawnSync('bash', ['-lc', cmd], {
    stdio: opts.silent ? 'pipe' : 'inherit',
    cwd: opts.cwd || ROOT,
    env: { ...process.env, ...opts.env },
  });
  if (!opts.ignoreError && result.status !== 0) {
    throw new Error(`Command failed (exit ${result.status}): ${cmd}`);
  }
  return result;
}

// ── Pre-flight checks ───────────────────────────────────────────────────────

function ensureBuildDirs() {
  // Re.Pack needs this directory and placeholder files to exist
  const dirs = [
    path.join(ROOT, 'build', 'generated', 'ios'),
    path.join(ROOT, 'build', 'generated', 'android'),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Re.Pack tries to open these files on startup; touch them if missing
  for (const name of ['index.bundle', 'index.bundle.map']) {
    const f = path.join(ROOT, 'build', 'generated', 'ios', name);
    if (!fs.existsSync(f)) fs.writeFileSync(f, '');
  }
}

// ── Build log setup ─────────────────────────────────────────────────────────

function setupBuildLog() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = [
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
  ].join('-');

  const dir = path.join(ROOT, 'build-logs', logDir, dateStr);
  fs.mkdirSync(dir, { recursive: true });

  const logPath = path.join(dir, `${logDir}-${timeStr}.log`);
  return logPath;
}

// ── Log cleanup ─────────────────────────────────────────────────────────────

const MAX_LOGS = 10;

function pruneOldLogs() {
  const baseDir = path.join(ROOT, 'build-logs', logDir);
  if (!fs.existsSync(baseDir)) return;

  // Collect all .log files across all date subdirectories
  const allLogs = [];
  for (const entry of fs.readdirSync(baseDir)) {
    const dateDir = path.join(baseDir, entry);
    if (!fs.statSync(dateDir).isDirectory()) continue;
    for (const file of fs.readdirSync(dateDir)) {
      if (!file.endsWith('.log')) continue;
      const fullPath = path.join(dateDir, file);
      allLogs.push({ path: fullPath, dir: dateDir, mtime: fs.statSync(fullPath).mtimeMs });
    }
  }

  if (allLogs.length <= MAX_LOGS) return;

  // Sort newest first, delete the rest
  allLogs.sort((a, b) => b.mtime - a.mtime);
  const toDelete = allLogs.slice(MAX_LOGS);
  let freed = 0;
  for (const entry of toDelete) {
    freed += fs.statSync(entry.path).size;
    fs.unlinkSync(entry.path);
  }

  // Remove empty date directories
  for (const entry of fs.readdirSync(baseDir)) {
    const dateDir = path.join(baseDir, entry);
    if (fs.statSync(dateDir).isDirectory() && fs.readdirSync(dateDir).length === 0) {
      fs.rmdirSync(dateDir);
    }
  }

  const freedMB = (freed / 1024 / 1024).toFixed(1);
  log('🧹', `Pruned ${toDelete.length} old log${toDelete.length === 1 ? '' : 's'} (freed ${freedMB} MB)`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  log('🚀', `Deploying iOS app to ${mode === 'release' ? 'App Store' : 'TestFlight'}...`);

  // Cleanup old logs before starting
  pruneOldLogs();

  // Pre-flight
  ensureBuildDirs();

  // Build log
  const logPath = setupBuildLog();
  log('📄', `Log: ${path.relative(ROOT, logPath)}`);

  // Run fastlane using async spawn to avoid pipe buffer deadlocks
  // (xcodebuild produces massive output that exceeds spawnSync's 1MB maxBuffer)
  const fastlaneCmd = [
    `cd "${IOS_DIR}"`,
    `BUNDLE_GEMFILE="$(pwd)/../Gemfile" bundle exec fastlane ${lane}`,
  ].join(' && ');

  const logStream = fs.createWriteStream(logPath);
  const exitCode = await new Promise((resolve) => {
    const child = spawn('bash', ['-lc', fastlaneCmd], {
      cwd: ROOT,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (data) => {
      process.stdout.write(data);
      logStream.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
      logStream.write(data);
    });

    child.on('close', (code) => {
      logStream.end();
      resolve(code);
    });
  });

  if (exitCode === 0) {
    console.log('');
    log('✅', 'Deploy completed successfully!');
    log('📄', `Full log: ${path.relative(ROOT, logPath)}`);
  } else {
    console.log('');
    log('❌', 'Deploy failed!');
    log('📄', `Full log: ${path.relative(ROOT, logPath)}`);
    process.exit(1);
  }
}

main();

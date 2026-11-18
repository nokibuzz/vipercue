'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

let selectedCodexPath = '';

function setCodexPath(value) {
  selectedCodexPath = String(value || '').trim();
}

function executable(file) {
  try {
    fs.accessSync(file, fs.constants.X_OK);
    return fs.statSync(file).isFile();
  } catch { return false; }
}

function codexPath() {
  if (selectedCodexPath) {
    const file = selectedCodexPath.startsWith('~/')
      ? path.join(os.homedir(), selectedCodexPath.slice(2)) : selectedCodexPath;
    if (executable(file)) return file;
    throw new Error(`Codex CLI is not executable at ${file}. Choose the path printed by "command -v codex" in ViperCue.`);
  }
  const candidates = [
    process.env.CODEX_CLI_PATH,
    path.join(os.homedir(), '.local', 'bin', 'codex'),
    '/usr/local/bin/codex',
    '/opt/homebrew/bin/codex'
  ].filter(Boolean);
  for (const candidate of candidates) if (executable(candidate)) return candidate;
  for (const directory of (process.env.PATH || '').split(path.delimiter)) {
    const candidate = path.join(directory, 'codex');
    if (executable(candidate)) return candidate;
  }
  throw new Error('Codex CLI was not found. In Terminal run "command -v codex", then paste that path into the Codex CLI path field.');
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => { stdout += data.toString().slice(0, 30000); });
    child.stderr.on('data', data => { stderr += data.toString().slice(0, 30000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr.trim() || `Codex exited with code ${code}`)));
    child.stdin.end(options.input || '');
  });
}

async function checkCodexLogin() {
  const file = codexPath();
  const result = await run(file, ['login', 'status']);
  if (!/Logged in using ChatGPT/i.test(result.stdout + result.stderr)) {
    throw new Error(`Codex CLI at ${file} is not signed in with ChatGPT. Run "codex login status" and, if needed, "codex login" in Terminal.`);
  }
  return file;
}

async function generateWithCodex(prompt, signal, { model = 'gpt-6-luna' } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-codex-'));
  const output = path.join(directory, 'answer.txt');
  try {
    const child = spawn(codexPath(), [
      'exec', '--ephemeral', '--ignore-user-config', '--ignore-rules',
      '--json',
      '-m', model, '-c', 'model_reasoning_effort="low"',
      '--sandbox', 'read-only', '--skip-git-repo-check',
      '-C', directory, '-o', output, '-'
    ], { cwd: directory, stdio: ['pipe', 'pipe', 'pipe'], signal });
    let usage = null;
    let lines = '';
    const parseLine = line => {
      try {
        const event = JSON.parse(line);
        if (event.type === 'turn.completed' && event.usage) usage = event.usage;
      } catch { /* Codex may print an incomplete line during shutdown. */ }
    };
    await new Promise((resolve, reject) => {
      let error = '';
      const timeout = setTimeout(() => child.kill(), 60000);
      child.stdout.on('data', data => {
        lines += data.toString();
        let end;
        while ((end = lines.indexOf('\n')) !== -1) {
          parseLine(lines.slice(0, end));
          lines = lines.slice(end + 1);
        }
      });
      child.stderr.on('data', data => { error += data.toString().slice(0, 30000); });
      child.on('error', err => { clearTimeout(timeout); reject(err); });
      child.on('close', code => {
        clearTimeout(timeout);
        if (lines.trim()) parseLine(lines);
        if (code === 0) resolve();
        else reject(new Error(error.trim().slice(-1200) || `Codex exited with code ${code}`));
      });
      child.stdin.end(prompt);
    });
    return { text: fs.readFileSync(output, 'utf8').trim(), usage };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function readCodexLimits() {
  return new Promise((resolve, reject) => {
    const child = spawn(codexPath(), ['app-server', '--stdio'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let pending = '';
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      child.kill();
      if (error) reject(error); else resolve(value);
    };
    const timeout = setTimeout(() => finish(new Error('Codex limits are currently unavailable.')), 10000);
    child.on('error', error => finish(error));
    child.on('close', () => { if (!settled) finish(new Error('Codex did not return usage limits.')); });
    child.stdout.on('data', data => {
      pending += data.toString();
      let end;
      while ((end = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 1);
        let message;
        try { message = JSON.parse(line); } catch { continue; }
        if (message.id === 1 && message.result) {
          child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'initialized', params: {} }) + '\n');
          child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'account/rateLimits/read', params: {} }) + '\n');
        } else if (message.id === 1 && message.error) {
          finish(new Error(message.error.message));
        } else if (message.id === 2) {
          if (message.error) finish(new Error(message.error.message));
          else {
            const limits = message.result?.rateLimits || {};
            const window = value => value ? { usedPercent: value.usedPercent, resetsAt: value.resetsAt } : null;
            finish(null, {
              primary: window(limits.primary), secondary: window(limits.secondary),
              credits: limits.credits ? { hasCredits: limits.credits.hasCredits, unlimited: limits.credits.unlimited, balance: limits.credits.balance } : null,
              individualLimit: limits.individualLimit ? { limit: limits.individualLimit.limit, used: limits.individualLimit.used, remainingPercent: limits.individualLimit.remainingPercent } : null
            });
          }
        }
      }
    });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { clientInfo: { name: 'vipercue', version: require('../package.json').version } } }) + '\n');
  });
}

module.exports = { codexPath, setCodexPath, checkCodexLogin, generateWithCodex, readCodexLimits };

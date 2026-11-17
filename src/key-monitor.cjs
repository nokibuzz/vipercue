'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function monitorPath() {
  const packaged = path.join(process.resourcesPath || '', 'shift-monitor', 'shift-monitor');
  return fs.existsSync(packaged) ? packaged : path.join(__dirname, '..', 'vendor', 'shift-monitor', 'shift-monitor');
}

function startKeyMonitor(onKey, onStatus) {
  const executable = monitorPath();
  if (process.platform !== 'darwin' || !fs.existsSync(executable)) {
    onStatus('unavailable');
    return () => {};
  }
  const child = spawn(executable, [], { stdio: ['ignore', 'pipe', 'ignore'] });
  let pending = '';
  let stopped = false;
  child.stdout.on('data', data => {
    pending += data.toString();
    let end;
    while ((end = pending.indexOf('\n')) !== -1) {
      const line = pending.slice(0, end).trim();
      pending = pending.slice(end + 1);
      if (line === 'DOWN' || line === 'UP') onKey(line === 'DOWN');
      else if (line === 'READY') onStatus('ready');
      else if (line === 'ACCESSIBILITY_REQUIRED' || line === 'INPUT_MONITORING_REQUIRED') onStatus('permission');
    }
  });
  child.on('error', () => { if (!stopped) onStatus('unavailable'); });
  child.on('close', () => { if (!stopped) onStatus('permission'); });
  return () => { stopped = true; child.kill(); };
}

module.exports = { startKeyMonitor };

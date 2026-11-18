'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setCodexPath, codexPath, checkCodexLogin } = require('../src/codex-backend.cjs');

test('a selected Codex executable works outside standard Homebrew paths', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vipercue-codex-test-'));
  const cli = path.join(directory, 'codex');
  try {
    fs.writeFileSync(cli, '#!/bin/sh\necho "Logged in using ChatGPT"\n', { mode: 0o755 });
    setCodexPath(cli);
    assert.equal(codexPath(), cli);
    assert.equal(await checkCodexLogin(), cli);
    setCodexPath(path.join(directory, 'missing'));
    await assert.rejects(checkCodexLogin(), /not executable/);
  } finally {
    setCodexPath('');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

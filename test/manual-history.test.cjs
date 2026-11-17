const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ManualCapture } = require('../src/manual-capture.cjs');
const { HistoryStore } = require('../src/history.cjs');

test('holding Shift captures until release; two taps toggle until next press', () => {
  let now = 0;
  let timer;
  const captured = [];
  const controller = new ManualCapture({ onComplete: value => captured.push(value), onState: () => {}, now: () => now, wait: callback => { timer = callback; return 1; }, cancel: () => { timer = null; } });
  controller.key(true);
  controller.audio(new Int16Array(4800));
  now = 500;
  controller.key(false);
  assert.equal(captured.length, 1);
  assert.equal(captured[0].audioMs, 200);
  now = 1000;
  controller.key(true);
  now = 1100;
  controller.key(false);
  assert.equal(controller.state, 'pending');
  now = 1250;
  controller.key(true);
  controller.key(false);
  assert.equal(controller.state, 'toggle');
  controller.audio(new Int16Array(4800));
  now = 2000;
  controller.key(true);
  controller.key(false);
  assert.equal(captured.length, 2);
  assert.equal(controller.state, 'idle');
});

test('history survives a new store instance with timings and token counts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-history-test-'));
  try {
    const store = new HistoryStore(dir);
    store.start({ mode: 'live', model: 'gpt-6-luna' });
    const id = store.question({ question: 'How does caching work?', audioMs: 1500 });
    store.update(id, { answer: 'It stores recent results.', generationMs: 2100, inputTokens: 100, outputTokens: 20 });
    store.finish();
    const saved = new HistoryStore(dir).list();
    assert.equal(saved[0].questions[0].inputTokens, 100);
    assert.equal(saved[0].questions[0].generationMs, 2100);
    assert.ok(saved[0].endedAt);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

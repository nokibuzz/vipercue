const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBank, findOfflineAnswer } = require('../src/offline-answers.cjs');
const { summarize } = require('../src/analytics.cjs');

test('offline library covers requested categories in Serbian and English', () => {
  const bank = loadBank();
  assert.ok(bank.length >= 45);
  for (const category of ['Java', 'React', 'Python', '.NET', 'DevOps', 'Front-end', 'Data analytics', 'Systems', 'HR']) {
    assert.ok(bank.some(item => item.Category === category), category);
  }
  assert.match(findOfflineAnswer('What is a database index?', 'en').answer, /find rows/);
  assert.match(findOfflineAnswer('Koja je razlika između List i Set u Javi?', 'sr').answer, /duplikate/);
  assert.match(findOfflineAnswer('How would you optimize a slow SQL query?', 'en').answer, /execution plan/);
  assert.equal(findOfflineAnswer('What do you know about our company?', 'en'), null);
  assert.equal(findOfflineAnswer('Do you have any questions?', 'en'), null);
  assert.equal(findOfflineAnswer('Why should we avoid database indexes?', 'en'), null);
});

test('dashboard averages actual stored timings and reports zero tokens for offline', () => {
  const data = summarize([{ mode: 'live', provider: 'offline', questions: [
    { status: 'complete', transcriptionMs: 1000, generationMs: 8, totalProcessingMs: 1008, inputTokens: 0, outputTokens: 0 },
    { status: 'complete', transcriptionMs: 1200, generationMs: 12, totalProcessingMs: 1212, inputTokens: 0, outputTokens: 0 }
  ] }, { mode: 'live', provider: 'codex', questions: [
    { status: 'complete', transcriptionMs: 900, generationMs: 3000, totalProcessingMs: 3900, inputTokens: 100, outputTokens: 30 }
  ] }]);
  assert.equal(data.questions, 3);
  assert.equal(data.tokens, 130);
  assert.equal(data.byProvider.offline.averageTokens, 0);
  assert.equal(data.byProvider.codex.averageTokens, 130);
  assert.equal(data.averageWaitMs, 2040);
});

test('dashboard reports mock practice separately from live AI usage', () => {
  const data = summarize([{ mode: 'mock', provider: 'offline', questions: [
    { status: 'complete', responseDurationMs: 12000, inputTokens: 0, outputTokens: 0 },
    { status: 'skipped', responseDurationMs: 0, inputTokens: 0, outputTokens: 0 }
  ] }]);
  assert.equal(data.questions, 0);
  assert.equal(data.tokens, 0);
  assert.deepEqual(data.practice, { questions: 2, completed: 1, averageResponseMs: 12000 });
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { FeedbackRound, makeAsmaPrompt, offlineAsmaScaffold } = require('../src/feedbacker.cjs');
const { summarize } = require('../src/analytics.cjs');

test('feedback round keeps candidate and both peer reviewers separate', () => {
  const round = new FeedbackRound();
  round.setPhase('question');
  round.append('How did you handle a breaking API change?');
  round.setPhase('candidate');
  round.append('I versioned the library and wrote migration notes.');
  round.setPhase('reviewer1');
  round.append('The trade-off was clear.');
  round.setPhase('reviewer2');
  round.append('The impact on dependent teams was not covered.');
  assert.match(round.snapshot().transcripts.candidate, /versioned the library/);
  assert.match(round.snapshot().transcripts.question, /breaking API change/);
  assert.match(round.snapshot().transcripts.reviewer1, /trade-off/);
  assert.match(round.snapshot().transcripts.reviewer2, /dependent teams/);
  assert.throws(() => round.setPhase('facilitator'));
});

test('ASMA prompt requires evidence, concise English and no unsupported red flag', () => {
  const round = new FeedbackRound();
  round.append('I versioned the library and wrote migration notes.');
  round.setPhase('reviewer1');
  round.append('Good reasoning.');
  const prompt = makeAsmaPrompt(round);
  assert.match(prompt, /Assessment.*Strength.*Missing evidence.*Actionable improvement/s);
  assert.match(prompt, /45–75 seconds/);
  assert.match(prompt, /missing detail alone is never a Red Flag/);
  assert.match(prompt, /versioned the library/);
  assert.match(prompt, /untrusted source data/);
});

test('offline ASMA remains a scaffold without inventing a rating', () => {
  const round = new FeedbackRound();
  round.append('I changed the deployment pipeline.');
  const output = offlineAsmaScaffold(round);
  assert.match(output, /Choose Good, Great, or Best/);
  assert.match(output, /I changed the deployment pipeline/);
  assert.match(output, /do not assume the work never happened/);
  round.setRating('Great');
  assert.match(offlineAsmaScaffold(round), /Assessment — Great/);
});

test('workshop analytics count completed rounds separately from interview questions', () => {
  const stats = summarize([{ mode: 'feedbacker', questions: [{ status: 'complete', inputTokens: 50, outputTokens: 40, totalProcessingMs: 1200 }, { status: 'unfinished', inputTokens: 0, outputTokens: 0 }] }]);
  assert.equal(stats.questions, 0);
  assert.equal(stats.feedback.rounds, 2);
  assert.equal(stats.feedback.completed, 1);
  assert.equal(stats.feedback.tokens, 90);
  assert.equal(stats.feedback.averageWaitMs, 1200);
});

'use strict';

function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0;
}

function percentile(values, fraction) {
  const valid = values.filter(Number.isFinite).sort((a, b) => a - b);
  return valid.length ? valid[Math.ceil(valid.length * fraction) - 1] : 0;
}

function summarize(sessions) {
  const live = (sessions || []).filter(session => session.mode === 'live');
  const practiceQuestions = (sessions || []).filter(session => session.mode === 'mock').flatMap(session => session.questions || []);
  const feedbackRounds = (sessions || []).filter(session => session.mode === 'feedbacker').flatMap(session => session.questions || []);
  const questions = live.flatMap(session => (session.questions || []).map(question => ({ ...question, provider: session.provider || 'unknown' })));
  const answered = questions.filter(item => ['complete', 'fallback', 'unmatched'].includes(item.status));
  const sumTokens = items => items.reduce((sum, item) => sum + (Number(item.inputTokens) || 0) + (Number(item.outputTokens) || 0), 0);
  const metrics = items => ({
    questions: items.length,
    tokens: sumTokens(items),
    averageTokens: items.length ? Math.round(sumTokens(items) / items.length) : 0,
    averageAudioMs: average(items.map(item => item.audioMs)),
    averageRecognitionMs: average(items.map(item => item.transcriptionMs)),
    averageAnswerMs: average(items.map(item => item.generationMs)),
    averageWaitMs: average(items.map(item => item.totalProcessingMs)),
    p90WaitMs: percentile(items.map(item => item.totalProcessingMs), 0.9)
  });
  const byProvider = {};
  for (const name of ['offline', 'codex', 'api']) {
    const items = answered.filter(item => item.provider === name);
    byProvider[name] = { ...metrics(items), matched: items.filter(item => item.status === 'complete').length };
  }
  return {
    sessions: live.length,
    ...metrics(answered),
    byProvider,
    practice: {
      questions: practiceQuestions.length,
      completed: practiceQuestions.filter(item => item.status === 'complete').length,
      averageResponseMs: average(practiceQuestions.filter(item => item.status === 'complete').map(item => item.responseDurationMs))
    },
    feedback: {
      rounds: feedbackRounds.length,
      completed: feedbackRounds.filter(item => item.status === 'complete').length,
      tokens: sumTokens(feedbackRounds),
      averageWaitMs: average(feedbackRounds.filter(item => item.status === 'complete').map(item => item.totalProcessingMs))
    }
  };
}

module.exports = { summarize };

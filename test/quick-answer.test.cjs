const test = require('node:test');
const assert = require('node:assert/strict');
const { quickAnswer } = require('../src/quick-answer.cjs');

test('offers immediate standard answers only for clear technical topics', () => {
  assert.match(quickAnswer('Kako biste optimizovali spor SQL upit?', 'sr'), /plan izvršavanja/);
  assert.match(quickAnswer('What is a database index?', 'en'), /scanning the whole table/);
  assert.equal(quickAnswer('How did you optimize the team?', 'en'), '');
  assert.equal(quickAnswer('Tell me about your last project?', 'en'), '');
});

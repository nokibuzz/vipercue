'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { QuestionGate } = require('../src/question-gate.cjs');

test('introductory company talk and check-ins never request an answer', () => {
  const gate = new QuestionGate();
  assert.equal(gate.observe('Do you mind if I invite the meeting notetaker?').action, 'ignore');
  assert.deepEqual(gate.observe('For the agenda today, this is an introduction call.'), { action: 'ignore', phase: 'intro', phaseChanged: true });
  assert.equal(gate.observe('Does that make sense?').action, 'ignore');
  assert.equal(gate.observe('Does it make any sense?').action, 'ignore');
  assert.equal(gate.observe('What do you know about us so far?').action, 'ignore');
  assert.equal(gate.observe('Our company builds workflow software.').action, 'ignore');
  assert.equal(gate.phase, 'intro');
});

test('a spoken transition opens the interview without using a fixed timestamp', () => {
  const gate = new QuestionGate();
  gate.observe('Today’s agenda starts with a short introduction.');
  assert.deepEqual(gate.observe("Let's move to my questions."), { action: 'ignore', phase: 'interview', phaseChanged: true });
  assert.equal(gate.observe('What made you apply for this role?').action, 'question');
  assert.equal(gate.observe('Do you have any questions for me?').action, 'ignore');
});

test('direct interview questions work without an introduction', () => {
  const gate = new QuestionGate();
  assert.equal(gate.observe('How are you?').action, 'ignore');
  assert.deepEqual(gate.observe('Tell me about your experience with React.'), { action: 'question', phase: 'interview', phaseChanged: true });
  assert.equal(gate.observe('I can explain how our team works.').action, 'ignore');
  assert.equal(gate.observe('What is the difference between props and state?').action, 'question');
  assert.equal(gate.observe('Could you repeat the question?', true).action, 'followup');
});

test('manual capture bypasses intro gate and explicit start resumes automatic mode', () => {
  const gate = new QuestionGate();
  gate.observe('Prvo ću vam predstaviti naš proizvod.');
  assert.equal(gate.phase, 'intro');
  assert.equal(gate.observe('Opišite projekat na kojem ste radili.', false, 'manual').action, 'question');
  assert.equal(gate.phase, 'intro');
  gate.startQuestions();
  assert.equal(gate.observe('Kako biste optimizovali spor SQL upit?').action, 'question');
});

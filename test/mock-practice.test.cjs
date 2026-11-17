'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadMockDeck, mockCommand, MockPractice } = require('../src/mock-practice.cjs');

test('mock deck has bilingual prepared questions and answers across categories', () => {
  const deck = loadMockDeck();
  assert.ok(deck.length >= 12);
  assert.ok(new Set(deck.map(item => item.Category)).size >= 7);
  for (const item of deck) {
    assert.ok(item['Q-SR'].length > 12 && item['A-SR'].length > 20);
    assert.ok(item['Q-EN'].length > 12 && item['A-EN'].length > 20);
  }
});

test('mock session advances, records speech, and reveals prepared answer without tokens', () => {
  const practice = new MockPractice({ language: 'sr', category: 'React' });
  const first = practice.next();
  assert.equal(first.index, 1);
  assert.equal(first.total, 2);
  assert.match(first.question, /React/);
  assert.ok(!practice.revealed);
  assert.equal(practice.appendResponse('Props dolaze spolja.'), 'Props dolaze spolja.');
  assert.equal(practice.appendResponse('State se menja.'), 'Props dolaze spolja. State se menja.');
  const revealed = practice.reveal();
  assert.match(revealed.answer, /Props/);
  assert.equal(revealed.response, 'Props dolaze spolja. State se menja.');
  assert.equal(practice.next().index, 2);
  assert.equal(practice.next(), null);
});

test('mock voice controls accept English and Serbian exact commands', () => {
  assert.equal(mockCommand('start MOC'), 'start');
  assert.equal(mockCommand('show answer'), 'reveal');
  assert.equal(mockCommand('pokaži odgovor'), 'reveal');
  assert.equal(mockCommand('sledeće pitanje'), 'next');
  assert.equal(mockCommand('repeat the question'), 'repeat');
  assert.equal(mockCommand('I used a cache for faster reads.'), null);
});

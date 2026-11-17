'use strict';

const fs = require('fs');
const path = require('path');
const { parseBank } = require('./offline-answers.cjs');

const DECK_PATH = path.join(__dirname, 'data', 'mock-interview.md');
let cachedDeck;

function loadMockDeck() {
  if (!cachedDeck) cachedDeck = parseBank(fs.readFileSync(DECK_PATH, 'utf8'));
  return cachedDeck;
}

function normalizeCommand(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!?,]+$/g, '').replace(/\s+/g, ' ').trim();
}

function mockCommand(value) {
  const text = normalizeCommand(value);
  if (/^(start (?:mock|moc)|restart (?:mock|moc)|pokreni (?:mock|moc)|pocni (?:mock|moc))$/.test(text)) return 'start';
  if (/^(show (?:the |model |reference )?answer|reveal (?:the )?answer|i am done|i'm done|poka(?:zi|zite) odgovor|prikazi odgovor|gotovo)$/.test(text)) return 'reveal';
  if (/^(next (?:question|one)|skip (?:this )?question|sledece pitanje|sljedece pitanje|preskoci pitanje)$/.test(text)) return 'next';
  if (/^(repeat (?:the )?question|ponovi pitanje)$/.test(text)) return 'repeat';
  return null;
}

class MockPractice {
  constructor({ language = 'en', category = 'all', deck = loadMockDeck() } = {}) {
    this.language = language === 'sr' ? 'sr' : 'en';
    this.deck = category === 'all' ? deck : deck.filter(item => item.Category === category);
    if (!this.deck.length) throw new Error(`No mock questions in category: ${category}`);
    this.index = -1;
    this.current = null;
    this.response = '';
    this.revealed = false;
  }

  next() {
    this.index++;
    if (this.index >= this.deck.length) {
      this.current = null;
      return null;
    }
    const item = this.deck[this.index];
    const suffix = this.language === 'sr' ? 'SR' : 'EN';
    this.current = {
      id: item.id,
      category: item.Category,
      index: this.index + 1,
      total: this.deck.length,
      question: item[`Q-${suffix}`],
      answer: item[`A-${suffix}`]
    };
    this.response = '';
    this.revealed = false;
    return { ...this.current };
  }

  appendResponse(text) {
    if (!this.current || this.revealed) return this.response;
    const segment = String(text || '').trim();
    if (segment) this.response = [this.response, segment].filter(Boolean).join(' ');
    return this.response;
  }

  reveal() {
    if (!this.current) return null;
    this.revealed = true;
    return { ...this.current, response: this.response };
  }
}

module.exports = { DECK_PATH, loadMockDeck, mockCommand, MockPractice };

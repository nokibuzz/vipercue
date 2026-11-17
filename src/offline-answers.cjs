'use strict';

const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, 'data', 'interview-questions.md');
const STOP = new Set('a an the is are what why how when where who which do does did can could would should tell me about your you us in on of for to with and or i we za je su sta sto kako koji koja koje kada zasto da li mi nam vas vase se u na od iz po sa o i a to'.split(' '));

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9čćđšž+#.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function words(value) {
  return normalize(value).split(' ').filter(word => word.length > 1 && !STOP.has(word));
}

function parseBank(markdown) {
  const blocks = markdown.split(/^## /m).slice(1);
  return blocks.map(block => {
    const [id, ...lines] = block.split('\n');
    const data = { id: id.trim() };
    for (const line of lines) {
      const match = /^([A-Za-z-]+):\s*(.+)$/.exec(line);
      if (match) data[match[1]] = match[2].trim();
    }
    for (const field of ['Category', 'Aliases', 'Q-SR', 'A-SR', 'Q-EN', 'A-EN', 'Source']) {
      if (!data[field]) throw new Error(`Offline answer ${data.id} is missing ${field}`);
    }
    data.aliases = data.Aliases.split(';').map(alias => alias.trim()).filter(Boolean);
    return data;
  });
}

let cached;
function loadBank() {
  if (!cached) cached = parseBank(fs.readFileSync(BANK_PATH, 'utf8'));
  return cached;
}

function matchesToken(queryWords, token) {
  return queryWords.some(word => word === token || (word.length >= 5 && token.length >= 5 && (word.startsWith(token) || token.startsWith(word))));
}

function candidateScore(query, queryWords, phrases) {
  let best = 0;
  for (const phrase of phrases) {
    const normalized = normalize(phrase);
    const tokens = words(phrase);
    if (normalized.length >= 9 && query.includes(normalized)) best = Math.max(best, 1 + Math.min(tokens.length, 5) * 0.025);
    if (!tokens.length) continue;
    const matched = tokens.filter(token => matchesToken(queryWords, token)).length;
    if (tokens.length >= 2 && matched === tokens.length) best = Math.max(best, 0.78 + Math.min(tokens.length, 5) * 0.035);
    else if (tokens.length >= 3 && matched / tokens.length >= 0.8) best = Math.max(best, 0.7);
    else if (tokens.length === 1 && tokens[0].length >= 7 && matched === 1) best = Math.max(best, 0.72);
  }
  return best;
}

function findOfflineAnswer(question, language, bank = loadBank()) {
  const query = normalize(question);
  if (query.length < 8) return null;
  if (/\b(why not|avoid|disadvantage|drawback|zasto ne|izbegavati|nedostaci)\b/.test(query)) return null;
  const queryWords = words(question);
  const domains = ['react', 'java', 'python', 'dotnet', 'csharp', 'docker', 'kubernetes', 'sql', 'pandas'];
  const mentioned = domains.filter(domain => queryWords.includes(domain));
  const ranked = bank.map(item => ({
    item,
    score: mentioned.some(domain => !words([item.Category, item.Aliases, item['Q-SR'], item['Q-EN']].join(' ')).includes(domain))
      ? 0 : candidateScore(query, queryWords, [...item.aliases, item['Q-SR'], item['Q-EN']])
  })).sort((a, b) => b.score - a.score);
  const [first, second] = ranked;
  if (!first || first.score < 0.72 || (second && first.score - second.score < 0.035)) return null;
  const locale = language === 'en' ? 'EN' : 'SR';
  return {
    id: first.item.id,
    category: first.item.Category,
    question: first.item[`Q-${locale}`],
    answer: first.item[`A-${locale}`],
    source: first.item.Source,
    confidence: Math.min(1, first.score)
  };
}

module.exports = { BANK_PATH, normalize, words, parseBank, loadBank, findOfflineAnswer };

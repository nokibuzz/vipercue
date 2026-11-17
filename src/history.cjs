'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class HistoryStore {
  constructor(directory) {
    this.file = path.join(directory, 'interview-history.json');
    this.sessions = this.read();
    this.current = null;
  }

  read() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
    } catch { return []; }
  }

  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temporary = this.file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(this.sessions, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, this.file);
  }

  start(meta) {
    this.finish();
    this.current = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), endedAt: null, ...meta, questions: [] };
    this.sessions.unshift(this.current);
    this.sessions = this.sessions.slice(0, 100);
    this.save();
    return this.current;
  }

  question(entry) {
    if (!this.current) return null;
    const item = { id: crypto.randomUUID(), ...entry };
    this.current.questions.push(item);
    this.save();
    return item.id;
  }

  update(id, patch) {
    const entry = this.current?.questions.find(item => item.id === id);
    if (entry) { Object.assign(entry, patch); this.save(); }
  }

  finish() {
    if (!this.current) return;
    this.current.endedAt = new Date().toISOString();
    this.save();
    this.current = null;
  }

  list() { return this.sessions; }
}

module.exports = { HistoryStore };

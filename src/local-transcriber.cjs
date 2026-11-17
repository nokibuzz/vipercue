'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { pcmRms } = require('./logic.cjs');

function assetPaths() {
  const packaged = process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, 'whisper', 'whisper-cli'));
  const base = packaged ? path.join(process.resourcesPath, 'whisper') : path.join(__dirname, '..', 'vendor', 'whisper');
  return {
    binary: packaged ? path.join(base, 'whisper-cli') : path.join(base, 'build', 'bin', 'whisper-cli'),
    model: packaged ? path.join(base, 'ggml-base.bin') : path.join(base, 'model', 'ggml-base.bin')
  };
}

function pcm24ToWav16(pcm) {
  const count = Math.floor(pcm.length * 2 / 3);
  const wav = Buffer.alloc(44 + count * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(16000, 24);
  wav.writeUInt32LE(32000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const position = i * 1.5;
    const index = Math.floor(position);
    const fraction = position - index;
    const value = pcm[index] * (1 - fraction) + pcm[Math.min(index + 1, pcm.length - 1)] * fraction;
    wav.writeInt16LE(Math.round(value), 44 + i * 2);
  }
  return wav;
}

function concatChunks(chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Int16Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

class LocalTranscriber {
  constructor({ language, onEvent }) {
    this.language = language === 'sr' ? 'sr' : 'en';
    this.onEvent = onEvent;
    this.ready = false;
    this.active = false;
    this.preRoll = [];
    this.chunks = [];
    this.speechMs = 0;
    this.silenceMs = 0;
    this.turn = 0;
    this.epoch = 0;
    this.lastPreviewAt = 0;
    this.previewChild = null;
    this.finalQueue = Promise.resolve();
    this.children = new Set();
  }

  async connect() {
    const { binary, model } = assetPaths();
    if (!fs.existsSync(binary) || !fs.existsSync(model)) {
      throw new Error('The local Whisper model is missing from this installation.');
    }
    this.ready = true;
  }

  ingest(arrayBuffer, durationMs) {
    if (!this.ready) return;
    const chunk = new Int16Array(arrayBuffer);
    const voiced = pcmRms(chunk) > 0.009;
    if (!this.active) {
      this.preRoll.push(chunk);
      if (this.preRoll.length > 3) this.preRoll.shift();
      this.speechMs = voiced ? this.speechMs + durationMs : 0;
      if (this.speechMs >= 160) {
        this.active = true;
        this.chunks = this.preRoll;
        this.preRoll = [];
        this.silenceMs = 0;
        this.turn++;
        this.lastPreviewAt = Date.now();
      }
      return;
    }
    this.chunks.push(chunk);
    this.silenceMs = voiced ? 0 : this.silenceMs + durationMs;
    const duration = this.chunks.reduce((sum, part) => sum + part.length, 0) / 24;
    if (this.silenceMs >= 900 || duration >= 15000) {
      this.finishTurn();
    } else if (duration >= 2000 && Date.now() - this.lastPreviewAt >= 1800 && !this.previewChild) {
      this.preview();
    }
  }

  async runWhisper(pcm, preview = false) {
    const { binary, model } = assetPaths();
    const file = path.join(os.tmpdir(), `vipercue-${crypto.randomUUID()}.wav`);
    fs.writeFileSync(file, pcm24ToWav16(pcm));
    return new Promise((resolve, reject) => {
      const child = spawn(binary, ['-m', model, '-f', file, '-l', this.language, '-nt', '-np', '-t', '4'], { stdio: ['ignore', 'pipe', 'pipe'] });
      this.children.add(child);
      if (preview) this.previewChild = child;
      let output = '';
      let error = '';
      child.stdout.on('data', data => { output += data.toString().slice(0, 20000); });
      child.stderr.on('data', data => { error += data.toString().slice(0, 2000); });
      child.on('error', reject);
      child.on('close', code => {
        this.children.delete(child);
        if (this.previewChild === child) this.previewChild = null;
        fs.rm(file, { force: true }, () => {});
        if (code === 0) resolve(output.replace(/\s+/g, ' ').trim());
        else reject(new Error(`Local transcription failed: ${error.trim() || code}`));
      });
    });
  }

  preview() {
    const turn = this.turn;
    this.lastPreviewAt = Date.now();
    const pcm = concatChunks(this.chunks);
    this.runWhisper(pcm, true).then(text => {
      if (this.ready && this.active && turn === this.turn && text) this.onEvent('partial', text);
    }).catch(() => {});
  }

  finishTurn() {
    if (!this.active) return;
    this.previewChild?.kill();
    const pcm = concatChunks(this.chunks);
    const audioMs = Math.round(pcm.length / 24);
    const endedAt = Date.now();
    const epoch = this.epoch;
    this.active = false;
    this.chunks = [];
    this.preRoll = [];
    this.speechMs = 0;
    this.silenceMs = 0;
    this.finalQueue = this.finalQueue.then(async () => {
      if (!this.ready) return '';
      const started = Date.now();
      const text = await this.runWhisper(pcm);
      if (this.ready && epoch === this.epoch && text) this.onEvent('final', { text, audioMs, endedAt, transcriptionMs: Date.now() - started });
      return text;
    }).catch(error => {
      if (this.ready) this.onEvent('error', error.message);
    });
  }

  reset() {
    this.epoch++;
    this.turn++;
    this.previewChild?.kill();
    this.active = false;
    this.preRoll = [];
    this.chunks = [];
    this.speechMs = 0;
    this.silenceMs = 0;
  }

  close() {
    this.ready = false;
    for (const child of this.children) child.kill();
    this.children.clear();
    this.active = false;
  }
}

module.exports = { LocalTranscriber, assetPaths, pcm24ToWav16 };

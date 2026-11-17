'use strict';

class ManualCapture {
  constructor({ onComplete, onState, now = () => Date.now(), wait = setTimeout, cancel = clearTimeout }) {
    this.onComplete = onComplete;
    this.onState = onState;
    this.now = now;
    this.wait = wait;
    this.cancel = cancel;
    this.state = 'idle';
    this.chunks = [];
    this.startedAt = 0;
    this.downAt = 0;
    this.timer = null;
    this.ignoreUp = false;
  }

  audio(pcm) {
    if (this.state === 'idle') return;
    const length = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (length < 24_000 * 60) this.chunks.push(new Int16Array(pcm));
  }

  key(down) {
    if (down) {
      if (this.state === 'toggle') {
        this.ignoreUp = true;
        this.finish();
      } else if (this.state === 'pending') {
        this.cancel(this.timer);
        this.timer = null;
        this.state = 'toggle';
        this.onState('toggle');
      } else if (this.state === 'idle') {
        this.state = 'hold';
        this.startedAt = this.downAt = this.now();
        this.chunks = [];
        this.onState('hold');
      }
    } else if (this.ignoreUp) {
      this.ignoreUp = false;
    } else if (this.state === 'hold') {
      if (this.now() - this.downAt >= 350) this.finish();
      else {
        this.state = 'pending';
        this.onState('pending');
        this.timer = this.wait(() => this.reset(), 400);
      }
    }
  }

  toggle() {
    if (this.state !== 'idle') { this.finish(); return; }
    this.state = 'toggle';
    this.startedAt = this.now();
    this.chunks = [];
    this.onState('toggle');
  }

  finish() {
    if (this.timer) this.cancel(this.timer);
    const samples = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const pcm = new Int16Array(samples);
    let offset = 0;
    for (const chunk of this.chunks) { pcm.set(chunk, offset); offset += chunk.length; }
    const startedAt = this.startedAt;
    this.state = 'idle';
    this.chunks = [];
    this.onState('processing');
    if (samples >= 2400) this.onComplete({ pcm, startedAt, endedAt: this.now(), audioMs: Math.round(samples / 24) });
    else this.onState('idle');
  }

  reset() {
    if (this.timer) this.cancel(this.timer);
    this.timer = null;
    this.state = 'idle';
    this.chunks = [];
    this.onState('idle');
  }
}

module.exports = { ManualCapture };

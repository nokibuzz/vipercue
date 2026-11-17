const test = require('node:test');
const assert = require('node:assert/strict');
const { isLikelyQuestion, isRepeatOrClarification, classifyUtterance, makePrompt, downsampleToPcm16, pcmRms } = require('../src/logic.cjs');
const { LocalTranscriber, pcm24ToWav16 } = require('../src/local-transcriber.cjs');

test('detects interview questions in English and Serbian', () => {
  assert.equal(isLikelyQuestion('How did you solve the problem?'), true);
  assert.equal(isLikelyQuestion('Možeš li mi reći nešto o sebi?'), true);
  assert.equal(isLikelyQuestion('Recite mi nešto o svom iskustvu.'), true);
  assert.equal(isLikelyQuestion('Možete li opisati izazovan projekat'), true);
  assert.equal(isLikelyQuestion('Šta biste prvo promenili'), true);
  assert.equal(isLikelyQuestion('Thank you for joining.'), false);
});

test('prompt uses supplied facts and requires honesty', () => {
  const prompt = makePrompt('Tell me about yourself?', '', 'Five years of backend work.');
  assert.match(prompt, /Five years of backend work/);
  assert.match(prompt, /Never invent personal experience/);
});

test('keeps repeat requests separate from new technical questions', () => {
  assert.equal(isRepeatOrClarification('Could you repeat the question?'), true);
  assert.equal(isRepeatOrClarification('Možeš li da ponoviš?'), true);
  assert.equal(isRepeatOrClarification('Možeš li da objasniš to?'), true);
  assert.equal(isRepeatOrClarification('Objasni razliku između SQL i NoSQL baza?'), false);
  assert.equal(isRepeatOrClarification('Can you explain caching in Redis?'), false);
  assert.equal(classifyUtterance('Could you repeat the question?', true), 'followup');
  assert.equal(classifyUtterance('What is a database index?', true), 'question');
  assert.equal(classifyUtterance('Thanks for the answer.', true), 'ignore');
  assert.equal(classifyUtterance('Tell us about your last project', true, 'manual'), 'question');
});

test('audio conversion produces 24kHz PCM and measures speech energy', () => {
  const samples = Float32Array.from({ length: 48000 }, (_, i) => Math.sin(i / 10) * 0.2);
  const pcm = downsampleToPcm16(samples, 48000);
  assert.equal(pcm.length, 24000);
  assert.ok(pcmRms(pcm) > 0.1);
});

test('local transcription uses selected Serbian or English language', () => {
  assert.equal(new LocalTranscriber({ language: 'sr', onEvent: () => {} }).language, 'sr');
  assert.equal(new LocalTranscriber({ language: 'en', onEvent: () => {} }).language, 'en');
});

test('local transcription converts 24kHz PCM to 16kHz WAV', () => {
  const wav = pcm24ToWav16(new Int16Array(24000));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 16000);
  assert.equal(wav.readUInt32LE(40), 32000);
});

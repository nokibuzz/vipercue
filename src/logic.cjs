'use strict';

function isLikelyQuestion(text) {
  const s = String(text || '').trim();
  if (!s || s.length < 8) return false;
  if (/[?？]/.test(s)) return true;
  const lead = /(?:^|[.!]\s+)(?:so |now |and |okay |all right |dakle |sada )?(?:what|why|how|when|where|who|which|could you|can you|would you|do you|have you|are you|tell me|describe|explain|walk me through|give me an example|šta|sto|kako|zašto|zasto|kada|gde|gdje|ko|koji|koja|koliko|čime|cime|da li|možeš|mozes|možete|mozete|reci|recite|kaži|kazi|kažite|kazite|navedi|navedite|opiši|opisi|opišite|opisite|objasni|objasnite|ispričaj|ispricaj|ispričajte|ispricajte)(?=$|[^\p{L}])/iu;
  return lead.test(s);
}

function isRepeatOrClarification(text) {
  const s = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[?.!,]+/g, '').trim();
  if (s.length > 85) return false;
  return /^(please )?(repeat (the |your |that )?question|say (that|it) again|(could|can) you (repeat|explain|clarify)( (that|it|the question))?|clarify (that|it|the question)|explain (that|it|the question)|what do you mean( by that)?)( please)?$/.test(s)
    || /^(molim te )?((mozes li da|mozete li da) (ponovis|ponovite|objasnis|objasnite|pojasnis|pojasnite)( mi)?( to|ovo|pitanje|jos jednom)?|ponovi(te)?( mi)?( pitanje|to|jos jednom)?|sta mislis pod tim|sta znaci to)$/.test(s);
}

function classifyUtterance(text, hasCurrentQuestion, source = 'automatic') {
  if (hasCurrentQuestion && isRepeatOrClarification(text)) return 'followup';
  if (source === 'manual' || isLikelyQuestion(text)) return 'question';
  return 'ignore';
}

function makePrompt(question, context, profile) {
  return [
    'Give an immediate, natural interview answer in the question language. Maximum 2 short sentences, 45 words. Start with the answer; no introduction or headings.',
    'For technical questions use a standard, accurate explanation. Never invent personal experience, projects or numbers. If personal facts are missing, use [your example].',
    `Candidate facts: ${profile || '(none provided)'}`,
    `Prior question, if relevant: ${context || '(none)'}`,
    `Question: ${question}`
  ].join('\n');
}

function downsampleToPcm16(floatSamples, sourceRate, targetRate = 24000) {
  if (!Number.isFinite(sourceRate) || sourceRate < targetRate) throw new Error('Unsupported audio sample rate');
  const ratio = sourceRate / targetRate;
  const count = Math.floor(floatSamples.length / ratio);
  const output = new Int16Array(count);
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.min(floatSamples.length, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = start; j < end; j++) sum += floatSamples[j];
    const sample = Math.max(-1, Math.min(1, sum / (end - start)));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}

function pcmRms(pcm) {
  if (!pcm.length) return 0;
  let sum = 0;
  for (const n of pcm) sum += (n / 32768) ** 2;
  return Math.sqrt(sum / pcm.length);
}

module.exports = { isLikelyQuestion, isRepeatOrClarification, classifyUtterance, makePrompt, downsampleToPcm16, pcmRms };

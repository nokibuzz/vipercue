'use strict';

const el = id => document.getElementById(id);
let uiLanguage = 'en';
let mode = 'live';
let interviewMode = 'live';
let language = 'en';
let provider = 'offline';
let interviewProvider = 'offline';
let captureMode = 'automatic';
let captureState = 'idle';
let questionPhase = 'open';
let mockResponse = '';
let running = false;
let starting = false;
let mediaStream;
let audioContext;
let sourceNode;
let workletNode;
let silentNode;
let audioBuffer = [];
let usageVisible = false;
let usageTimer;
let feedbackSnapshot;
let feedbackActionBusy = false;
const CODEX_PATH_STORAGE_KEY = 'vipercue-codex-path';

const t = key => window.ViperCueI18n.translate(key, uiLanguage);
function number(value) { return Number(value || 0).toLocaleString(uiLanguage === 'sr' ? 'sr-RS' : 'en-US'); }
function duration(ms) { return ms > 0 && ms < 100 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`; }

function setUiLanguage(next) {
  if (running || starting) return;
  uiLanguage = next === 'sr' ? 'sr' : 'en';
  document.documentElement.lang = uiLanguage;
  el('uiEnglish').classList.toggle('selected', uiLanguage === 'en');
  el('uiSerbian').classList.toggle('selected', uiLanguage === 'sr');
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-title]')) node.title = t(node.dataset.i18nTitle);
  for (const node of document.querySelectorAll('[data-i18n-aria]')) node.setAttribute('aria-label', t(node.dataset.i18nAria));
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);
  setMode(mode);
  setCaptureMode(captureMode);
  loadHistory();
}

function setCaptureMode(next) {
  captureMode = next === 'manual' ? 'manual' : 'automatic';
  el('autoCapture').classList.toggle('selected', captureMode === 'automatic');
  el('manualCapture').classList.toggle('selected', captureMode === 'manual');
  el('captureModeButton').textContent = captureMode === 'automatic' ? t('AUTO') : t('MANUAL MODE');
  el('manualAction').classList.toggle('hidden', mode !== 'live' || captureMode !== 'manual');
  el('startQuestions').classList.toggle('hidden', mode !== 'live' || captureMode !== 'automatic' || questionPhase !== 'intro');
  if (running) {
    el('statusText').textContent = captureMode === 'automatic' ? t('LISTENING TO INTERVIEWER') : t('SHIFT: READY');
  }
}

function setQuestionPhase(next) {
  questionPhase = next;
  el('startQuestions').classList.toggle('hidden', mode !== 'live' || captureMode !== 'automatic' || questionPhase !== 'intro');
  if (questionPhase === 'intro') el('statusText').textContent = t('INTRO · WAITING FOR QUESTIONS');
  else if (running && captureMode === 'automatic') el('statusText').textContent = t('READY FOR A NEW QUESTION');
}

function setCaptureState(next) {
  captureState = next;
  if (next === 'hold' || next === 'toggle') {
    el('statusText').textContent = t('RECORDING QUESTION');
    el('manualAction').textContent = t('■ FINISH RECORDING');
  } else if (next === 'processing') {
    el('statusText').textContent = t('RECOGNIZING QUESTION');
    el('manualAction').textContent = t('PROCESSING…');
  } else {
    if (!el('answer').classList.contains('loading')) el('statusText').textContent = captureMode === 'automatic' ? t('LISTENING TO INTERVIEWER') : t('SHIFT: READY');
    el('manualAction').textContent = t('● RECORD QUESTION');
  }
}

function applyDisplaySettings() {
  const font = Number(el('answerFont').value);
  const area = Number(el('answerArea').value);
  document.documentElement.style.setProperty('--question-share', `${100 - area}%`);
  document.documentElement.style.setProperty('--answer-font', `${font}px`);
  el('answerFontValue').textContent = `${font} px`;
  el('answerAreaValue').textContent = `${area}%`;
  fitAnswer();
}

function fitAnswer() {
  requestAnimationFrame(() => {
    const node = el('answer');
    if (!node || node.closest('.hidden')) return;
    let size = Number(el('answerFont').value);
    node.style.fontSize = `${size}px`;
    while (node.scrollHeight > node.clientHeight && size > 11) {
      node.style.fontSize = `${--size}px`;
    }
  });
}

async function loadHistory() {
  const [sessions, stats] = await Promise.all([
    window.overlay.history().catch(() => []),
    window.overlay.historySummary().catch(() => null)
  ]);
  const dashboard = el('dashboard');
  dashboard.replaceChildren();
  if (stats) {
    const cells = [
      [t('Questions'), number(stats.questions)],
      [t('Total tokens'), number(stats.tokens)],
      [t('Tokens / question'), number(stats.averageTokens)],
      [t('Average wait'), duration(stats.averageWaitMs)],
      [t('Recognition'), duration(stats.averageRecognitionMs)],
      [t('Answer'), duration(stats.averageAnswerMs)],
      [t('90% of questions within'), duration(stats.p90WaitMs)],
      [t('Offline match'), stats.byProvider.offline.questions ? `${Math.round(100 * stats.byProvider.offline.matched / stats.byProvider.offline.questions)}%` : '—']
    ];
    if (stats.practice?.questions) {
      cells.push([t('Practice questions'), number(stats.practice.questions)]);
      cells.push([t('Practice completed'), number(stats.practice.completed)]);
    }
    if (stats.feedback?.rounds) {
      cells.push([t('Feedback rounds'), number(stats.feedback.rounds)]);
      cells.push([t('Completed feedback'), number(stats.feedback.completed)]);
      cells.push([t('Feedback tokens'), number(stats.feedback.tokens)]);
      cells.push([t('Feedback wait'), duration(stats.feedback.averageWaitMs)]);
    }
    for (const [label, value] of cells) {
      const cell = document.createElement('div');
      cell.className = 'dashboard-cell';
      const name = document.createElement('span');
      name.textContent = label;
      const amount = document.createElement('strong');
      amount.textContent = value;
      cell.append(name, amount);
      dashboard.append(cell);
    }
    const byProvider = document.createElement('div');
    byProvider.className = 'dashboard-breakdown';
    byProvider.textContent = ['offline', 'codex', 'anthropic', 'api'].map(key => {
      const item = stats.byProvider[key];
      const label = { offline: t('Offline'), codex: 'Codex', anthropic: 'Claude API', api: 'OpenAI API' }[key];
      return `${label}: ${item.questions} ${t('questions')} · ${number(item.averageTokens)} ${t('tokens/question')} · ${duration(item.averageWaitMs)}`;
    }).join('\n');
    dashboard.append(byProvider);
  }
  const list = el('historyList');
  list.replaceChildren();
  if (!sessions.some(session => session.questions?.length)) {
    list.textContent = t('No completed questions yet.');
    return;
  }
  for (const session of sessions.filter(item => item.questions?.length).slice(0, 15)) {
    const box = document.createElement('details');
    box.className = 'history-item';
    const summary = document.createElement('summary');
    const tokens = session.questions.reduce((sum, q) => sum + (q.inputTokens || 0) + (q.outputTokens || 0), 0);
    summary.textContent = `${new Date(session.startedAt).toLocaleString(uiLanguage === 'sr' ? 'sr-RS' : 'en-US')} · ${session.mode === 'feedbacker' ? t('FEEDBACKER') : session.mode === 'mock' ? 'MOCK' : 'LIVE'} · ${session.questions.length} ${session.mode === 'feedbacker' ? t('rounds') : t('questions')} · ${number(tokens)} ${t('tokens')}`;
    box.append(summary);
    const meta = document.createElement('div');
    meta.className = 'history-meta';
    const duration = Math.round((new Date(session.endedAt || Date.now()) - new Date(session.startedAt)) / 1000);
    const complete = session.questions.filter(q => q.status === 'complete');
    const average = complete.length ? Math.round(complete.reduce((sum, q) => sum + (q.totalProcessingMs || 0), 0) / complete.length / 1000 * 10) / 10 : 0;
    meta.textContent = `${session.language?.toUpperCase()} · ${session.captureMode} · ${session.provider} · ${session.model} · ${t('duration')} ${duration}s · ${t('average processing')} ${average}s`;
    box.append(meta);
    for (const q of session.questions) {
      const row = document.createElement('div');
      row.className = 'history-question';
      const title = document.createElement('strong');
      title.textContent = q.question;
      const answer = document.createElement('p');
      answer.textContent = q.answer || t('No suggested answer.');
      if (q.candidateAnswer) {
        const candidate = document.createElement('p');
        candidate.className = 'history-candidate';
        candidate.textContent = `${session.mode === 'feedbacker' ? t('CANDIDATE') : t('Your response')}: ${q.candidateAnswer}`;
        row.append(candidate);
      }
      if (session.mode === 'feedbacker') {
        for (const [key, label] of [['reviewer1', 'REVIEWER 1'], ['reviewer2', 'REVIEWER 2']]) {
          if (!q[key]) continue;
          const peer = document.createElement('p');
          peer.className = 'history-candidate';
          peer.textContent = `${t(label)}: ${q[key]}`;
          row.append(peer);
        }
      }
      const stats = document.createElement('small');
      stats.textContent = `${t('Speech')} ${Math.round((q.audioMs || 0) / 100) / 10}s · ${t('recognition')} ${Math.round((q.transcriptionMs || 0) / 100) / 10}s · ${t('answer')} ${Math.round((q.generationMs || 0) / 100) / 10}s · ${t('total processing')} ${Math.round((q.totalProcessingMs || 0) / 100) / 10}s · ${t('context')} ${number(q.inputTokens)} ${t('input tokens')} (${number(q.contextCharacters)} ${t('characters')}) · ${t('output')} ${number(q.outputTokens)} · ${q.model}`;
      row.append(title, answer, stats);
      box.append(row);
    }
    list.append(box);
  }
}

async function refreshUsage() {
  if (!running || !usageVisible) return;
  if (provider === 'offline') {
    el('usageLimitLabel').textContent = mode === 'feedbacker' ? t('ASMA scaffold') : t('Answer library');
    el('usageLast').textContent = t('0 tokens');
    el('usageSession').textContent = t('0 tokens');
    el('usageLimits').textContent = mode === 'feedbacker' ? t('Local checklist') : t('Local library');
    el('usageLimits').title = '';
    el('usageCredits').textContent = t('Not used');
    el('usageMoney').textContent = t('0 for AI answers');
    el('usageNote').textContent = mode === 'feedbacker' ? t('Local Whisper + ASMA checklist; no AI calls.') : t('Local Whisper + Markdown answers; no AI calls.');
    el('usageOpen').classList.add('hidden');
    return;
  }
  el('usageOpen').classList.remove('hidden');
  if (provider === 'api' || provider === 'anthropic') {
    el('usageLimitLabel').textContent = t('Billing');
    el('usageLimits').textContent = provider === 'anthropic' ? 'Claude API' : t('API mode');
    el('usageLimits').title = '';
    el('usageCredits').textContent = t('See Billing');
    el('usageMoney').textContent = t('See Billing');
    el('usageNote').textContent = t('API answer tokens; transcription is separate.');
    return;
  }
  el('usageLimitLabel').textContent = t('5 hours / week');
  el('usageLimits').textContent = t('Loading limits…');
  try {
    const data = await window.overlay.readUsage();
    if (!running || !usageVisible) return;
    const remaining = item => item && Number.isFinite(item.usedPercent) ? Math.max(0, 100 - item.usedPercent) + '%' : '—';
    el('usageLimits').textContent = `${remaining(data.primary)} / ${remaining(data.secondary)} ${t('remaining')}`;
    el('usageLimits').title = t('Remaining percentage of Codex 5-hour and weekly quotas');
    el('usageCredits').textContent = data.credits?.unlimited ? t('Unlimited') : data.credits?.hasCredits ? `${data.credits.balance ?? '—'} ${t('credits')}` : t('No extra credits');
    el('usageMoney').textContent = data.individualLimit ? `${data.individualLimit.used} / ${data.individualLimit.limit}` : t('Unavailable for this plan');
    el('usageNote').textContent = t('AI answer tokens; quotas are percentages, not token counts.');
  } catch {
    el('usageLimits').textContent = t('Currently unavailable');
    el('usageNote').textContent = t('Check your account with the ACCOUNT button.');
  }
}

async function setUsageVisible(value) {
  usageVisible = Boolean(value);
  el('usageEnabled').checked = usageVisible;
  el('usageToggle').classList.toggle('active', usageVisible);
  el('usageToggle').setAttribute('aria-pressed', String(usageVisible));
  el('usagePanel').classList.toggle('hidden', !usageVisible);
  clearInterval(usageTimer);
  if (running) {
    await window.overlay.usageSize(usageVisible);
    if (usageVisible) {
      refreshUsage();
      usageTimer = setInterval(refreshUsage, 60000);
    }
  }
}

function setMode(next) {
  if (running || starting) return;
  const enteringFeedback = next === 'feedbacker' && mode !== 'feedbacker';
  const leavingFeedback = mode === 'feedbacker' && next !== 'feedbacker';
  if (enteringFeedback) interviewProvider = provider;
  mode = next;
  if (mode !== 'feedbacker') interviewMode = mode;
  if (leavingFeedback) setProvider(interviewProvider);
  if (mode === 'mock') setProvider('offline');
  if (enteringFeedback && provider === 'offline') setProvider('codex');
  el('interviewWorkflow').classList.toggle('selected', mode !== 'feedbacker');
  el('feedbackWorkflow').classList.toggle('selected', mode === 'feedbacker');
  el('interviewModeField').classList.toggle('hidden', mode === 'feedbacker');
  el('feedbackIntro').classList.toggle('hidden', mode !== 'feedbacker');
  el('shiftNote').classList.toggle('hidden', mode === 'feedbacker');
  el('introDescription').textContent = mode === 'feedbacker' ? t('Capture workshop speech and draft evidence-based ASMA feedback.') : t('Choose your language and audio source. Offline mode recognizes speech and finds prepared answers without AI tokens.');
  el('providerFieldLabel').textContent = mode === 'feedbacker' ? t('FEEDBACK SOURCE') : t('ANSWER SOURCE');
  el('offlineProviderDescription').textContent = mode === 'feedbacker' ? t('ASMA checklist') : t('0 AI tokens');
  el('codexProviderDescription').textContent = mode === 'feedbacker' ? t('AI recap') : t('AI answer');
  el('microphoneOption').textContent = mode === 'feedbacker' ? t('Microphone · room audio') : t('Microphone · fallback');
  el('spokenLanguageField').classList.toggle('hidden', mode === 'feedbacker');
  el('liveMode').classList.toggle('selected', mode === 'live');
  el('mockMode').classList.toggle('selected', mode === 'mock');
  el('captureModeField').classList.toggle('hidden', mode !== 'live');
  el('mockCategoryField').classList.toggle('hidden', mode !== 'mock');
  el('providerField').classList.toggle('hidden', mode === 'mock');
  el('codexPathField').classList.toggle('hidden', mode === 'mock' || provider !== 'codex');
  el('sourceField').classList.toggle('hidden', mode === 'mock');
  el('profileField').classList.toggle('hidden', mode !== 'live');
  el('apiKeyField').classList.toggle('hidden', mode === 'mock' || !['api', 'anthropic'].includes(provider));
  el('apiKeyLabel').textContent = provider === 'anthropic' ? t('ANTHROPIC API KEY') : t('OPENAI API KEY');
  el('testAnthropic').classList.toggle('hidden', mode === 'mock' || provider !== 'anthropic');
  el('anthropicStatus').classList.toggle('hidden', mode === 'mock' || provider !== 'anthropic');
  el('start').textContent = mode === 'mock' ? t('▶ START MOCK') : mode === 'feedbacker' ? t('▶ START FEEDBACKER') : t('▶ START LIVE');
}

function setLanguage(next) {
  if (running || starting) return;
  language = next;
  el('serbian').classList.toggle('selected', language === 'sr');
  el('english').classList.toggle('selected', language === 'en');
}

function setProvider(next) {
  if (running || starting) return;
  if (next !== provider && (['api', 'anthropic'].includes(next) || ['api', 'anthropic'].includes(provider))) {
    el('apiKey').value = '';
    el('anthropicStatus').textContent = t('Claude API usage is billed to your Anthropic Console account.');
  }
  provider = next;
  if (mode !== 'feedbacker') interviewProvider = next;
  el('offlineProvider').classList.toggle('selected', provider === 'offline');
  el('codexProvider').classList.toggle('selected', provider === 'codex');
  el('anthropicProvider').classList.toggle('selected', provider === 'anthropic');
  el('apiProvider').classList.toggle('selected', provider === 'api');
  el('apiKeyField').classList.toggle('hidden', !['api', 'anthropic'].includes(provider) || mode === 'mock');
  el('apiKeyLabel').textContent = provider === 'anthropic' ? t('ANTHROPIC API KEY') : t('OPENAI API KEY');
  el('testAnthropic').classList.toggle('hidden', provider !== 'anthropic' || mode === 'mock');
  el('anthropicStatus').classList.toggle('hidden', provider !== 'anthropic' || mode === 'mock');
  el('codexPathField').classList.toggle('hidden', provider !== 'codex' || mode === 'mock');
}

function setTransparency(percent) {
  const value = Math.max(2, Math.min(65, Number(percent) || 12));
  document.documentElement.style.setProperty('--panel-alpha', String((100 - value) / 100));
  el('opacityValue').textContent = value + '%';
}

function showSetupError(message) {
  el('setupError').textContent = message;
  el('setupError').classList.remove('hidden');
}

function setText(id, text, state = '') {
  el(id).textContent = text;
  el(id).className = 'content-text' + (state ? ' ' + state : '');
  if (id === 'answer') fitAnswer();
}

function showMockSpeech(text) {
  const node = el('mockSpoken');
  node.classList.toggle('hidden', !text);
  node.textContent = text ? `${t('YOUR ANSWER')}: ${text}` : '';
}

function renderFeedback(snapshot) {
  feedbackSnapshot = snapshot;
  const roles = [['question', 'feedbackQuestion', 'QUESTION'], ['candidate', 'feedbackCandidate', 'CANDIDATE'], ['reviewer1', 'feedbackReviewer1', 'REVIEWER 1'], ['reviewer2', 'feedbackReviewer2', 'REVIEWER 2']];
  for (const [role, id] of roles) el(id).classList.toggle('selected', snapshot.phase === role);
  for (const [, id] of roles) el(id).disabled = Boolean(snapshot.generated);
  el('feedbackRating').value = snapshot.rating;
  el('feedbackRating').disabled = Boolean(snapshot.generated);
  const lines = roles.filter(([role]) => snapshot.transcripts[role]).map(([role, , label]) => `${t(label)} · ${snapshot.transcripts[role]}`);
  setText('question', lines.join('\n\n') || t('Listening to the candidate…'), lines.length ? '' : 'placeholder');
  el('statusText').textContent = `${t('ROUND')} ${snapshot.number} · ${t(roles.find(([role]) => role === snapshot.phase)[2])}`;
  el('feedbackGenerate').disabled = !snapshot.transcripts.candidate || Boolean(snapshot.generated);
  if (snapshot.generated) setText('answer', snapshot.generated);
  else if (!lines.length) setText('answer', t('Capture the candidate and peer reviewers, then generate ASMA feedback.'), 'placeholder');
}

async function feedbackAction(action) {
  if (!running || mode !== 'feedbacker' || feedbackActionBusy) return;
  feedbackActionBusy = true;
  try { await action(); }
  catch (error) { setText('answer', String(error.message).replace(/^Error invoking remote method '[^']+': Error: /, ''), 'error'); }
  finally { feedbackActionBusy = false; }
}

function downsample(samples, sourceRate) {
  const ratio = sourceRate / 24000;
  const length = Math.floor(samples.length / ratio);
  const output = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.min(samples.length, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    const value = Math.max(-1, Math.min(1, sum / (end - start)));
    output[i] = value < 0 ? value * 32768 : value * 32767;
  }
  return output;
}

async function captureAudio() {
  const system = mode !== 'mock' && el('source').value === 'system';
  mediaStream = system
    ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const track = mediaStream.getAudioTracks()[0];
  if (!track || track.readyState !== 'live') {
    throw new Error(system ? t('System audio is unavailable. Check recording permission or select the microphone.') : t('Microphone is unavailable. Check its permission.'));
  }
  track.onended = () => {
    if (running) {
      showSetupError(t('Audio source disconnected. Check permissions and restart the session.'));
      stop();
    }
  };
  audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('audio-worklet.js');
  sourceNode = audioContext.createMediaStreamSource(mediaStream);
  workletNode = new AudioWorkletNode(audioContext, 'capture-processor');
  silentNode = audioContext.createGain();
  silentNode.gain.value = 0;
  sourceNode.connect(workletNode).connect(silentNode).connect(audioContext.destination);
  workletNode.port.onmessage = ({ data }) => {
    if (!running && !starting) return;
    const chunk = downsample(data, audioContext.sampleRate);
    for (const sample of chunk) audioBuffer.push(sample);
    while (audioBuffer.length >= 4800) {
      const pcm = Int16Array.from(audioBuffer.splice(0, 4800));
      window.overlay.sendAudio(pcm.buffer, 200);
    }
  };
}

function endCapture() {
  workletNode?.disconnect();
  sourceNode?.disconnect();
  silentNode?.disconnect();
  workletNode = null;
  sourceNode = null;
  silentNode = null;
  mediaStream?.getTracks().forEach(track => track.stop());
  mediaStream = null;
  audioContext?.close();
  audioContext = null;
  audioBuffer = [];
}

async function start() {
  if (running || starting) return;
  starting = true;
  el('start').disabled = true;
  el('setupError').classList.add('hidden');
  try {
    const codexPath = el('codexPath').value.trim();
    localStorage.setItem(CODEX_PATH_STORAGE_KEY, codexPath);
    await window.overlay.start({ mode, captureMode, language: mode === 'feedbacker' ? 'en' : language, provider, codexPath, mockCategory: el('mockCategory').value, apiKey: el('apiKey').value, profile: mode === 'live' ? el('profile').value : '' });
    await captureAudio();
    running = true;
    questionPhase = 'open';
    mockResponse = '';
    el('apiKey').value = '';
    el('questionLabel').textContent = mode === 'feedbacker' ? t('WORKSHOP TRANSCRIPT') : mode === 'mock' ? t('Practice question') : t('QUESTION');
    el('answerLabel').textContent = mode === 'feedbacker' ? t('ASMA FEEDBACK') : mode === 'mock' ? t('MODEL ANSWER') : t('SUGGESTED ANSWER');
    el('languageBadge').textContent = (mode === 'feedbacker' ? 'en' : language).toUpperCase();
    el('providerBadge').textContent = mode === 'mock' || provider === 'offline' ? t('OFFLINE · 0 TOKENS') : provider === 'codex' ? 'CODEX' : provider === 'anthropic' ? 'CLAUDE API' : 'OPENAI API';
    el('statusText').textContent = mode === 'feedbacker' ? t('ROUND 1 · CANDIDATE') : mode === 'mock' ? t('LISTENING TO YOUR ANSWER') : t('LISTENING TO INTERVIEWER');
    el('captureHint').textContent = mode === 'mock' || el('source').value === 'microphone' ? t('MICROPHONE') : t('SYSTEM AUDIO');
    setText('question', mode === 'feedbacker' ? t('Listening to the candidate…') : t('Waiting for a question…'), 'placeholder');
    setText('answer', mode === 'feedbacker' ? t('Capture the candidate and peer reviewers, then generate ASMA feedback.') : mode === 'mock' ? t('Speak your answer, then press SHOW ANSWER.') : t('Your answer will appear here.'), 'placeholder');
    showMockSpeech('');
    el('captureModeButton').classList.toggle('hidden', mode !== 'live');
    el('feedbackControls').classList.toggle('hidden', mode !== 'feedbacker');
    el('mockReveal').classList.toggle('hidden', mode !== 'mock');
    el('mockNext').classList.toggle('hidden', mode !== 'mock');
    el('mockReveal').disabled = false;
    el('mockNext').disabled = false;
    el('setup').classList.add('hidden');
    el('sessionView').classList.remove('hidden');
    if (mode === 'feedbacker') renderFeedback({ number: 1, phase: 'candidate', rating: 'auto', transcripts: { question: '', candidate: '', reviewer1: '', reviewer2: '' }, generated: '' });
    await window.overlay.compact(true);
    if (mode === 'live') setCaptureMode(captureMode);
    else { el('manualAction').classList.add('hidden'); el('startQuestions').classList.add('hidden'); }
    if (mode === 'live') setCaptureState('idle');
    applyDisplaySettings();
    el('usageLast').textContent = '—';
    el('usageSession').textContent = t('0 tokens');
    if (usageVisible) await setUsageVisible(true);
    if (mode === 'mock') await window.overlay.mockBegin();
  } catch (error) {
    running = false;
    endCapture();
    await window.overlay.stop().catch(() => {});
    el('sessionView').classList.add('hidden');
    el('setup').classList.remove('hidden');
    await window.overlay.compact(false).catch(() => {});
    showSetupError(String(error.message).replace(/^Error invoking remote method '[^']+': Error: /, ''));
  } finally {
    starting = false;
    el('start').disabled = false;
  }
}

async function stop() {
  if (!running) return;
  running = false;
  questionPhase = 'open';
  clearInterval(usageTimer);
  endCapture();
  await window.overlay.stop();
  el('sessionView').classList.add('hidden');
  el('setup').classList.remove('hidden');
  await window.overlay.compact(false);
  await loadHistory();
  el('historyPanel').open = true;
  el('historyPanel').scrollIntoView({ block: 'nearest' });
}

el('liveMode').addEventListener('click', () => setMode('live'));
el('mockMode').addEventListener('click', () => setMode('mock'));
el('interviewWorkflow').addEventListener('click', () => setMode(interviewMode));
el('feedbackWorkflow').addEventListener('click', () => setMode('feedbacker'));
el('uiEnglish').addEventListener('click', () => setUiLanguage('en'));
el('uiSerbian').addEventListener('click', () => setUiLanguage('sr'));
el('autoCapture').addEventListener('click', () => { if (!running && !starting) setCaptureMode('automatic'); });
el('manualCapture').addEventListener('click', () => { if (!running && !starting) setCaptureMode('manual'); });
el('serbian').addEventListener('click', () => setLanguage('sr'));
el('english').addEventListener('click', () => setLanguage('en'));
el('codexProvider').addEventListener('click', () => setProvider('codex'));
el('anthropicProvider').addEventListener('click', () => setProvider('anthropic'));
el('apiKey').addEventListener('input', () => {
  if (provider === 'anthropic') el('anthropicStatus').textContent = t('Claude API usage is billed to your Anthropic Console account.');
});
el('codexPath').value = localStorage.getItem(CODEX_PATH_STORAGE_KEY) || '';
el('codexPath').addEventListener('change', () => localStorage.setItem(CODEX_PATH_STORAGE_KEY, el('codexPath').value.trim()));
el('browseCodex').addEventListener('click', async () => {
  const chosen = await window.overlay.chooseCodexPath();
  if (chosen) {
    el('codexPath').value = chosen;
    localStorage.setItem(CODEX_PATH_STORAGE_KEY, chosen);
    el('codexStatus').textContent = t('Path selected. Test the connection before starting.');
  }
});
el('testCodex').addEventListener('click', async () => {
  el('testCodex').disabled = true;
  el('codexStatus').textContent = t('Checking Codex…');
  try {
    const result = await window.overlay.testCodex(el('codexPath').value.trim());
    el('codexStatus').textContent = `${t('Connected to ChatGPT through')} ${result.path}`;
  } catch (error) {
    el('codexStatus').textContent = String(error.message).replace(/^Error invoking remote method '[^']+': Error: /, '');
  } finally { el('testCodex').disabled = false; }
});
el('testAnthropic').addEventListener('click', async () => {
  el('testAnthropic').disabled = true;
  el('anthropicStatus').textContent = t('Checking Claude…');
  try {
    const result = await window.overlay.testAnthropic(el('apiKey').value.trim());
    el('anthropicStatus').textContent = `${t('Connected to Claude API ·')} ${result.model}`;
  } catch (error) {
    el('anthropicStatus').textContent = String(error.message).replace(/^Error invoking remote method '[^']+': Error: /, '');
  } finally { el('testAnthropic').disabled = false; }
});
el('offlineProvider').addEventListener('click', () => setProvider('offline'));
el('apiProvider').addEventListener('click', () => setProvider('api'));
el('opacity').addEventListener('input', event => setTransparency(event.target.value));
el('answerFont').addEventListener('input', applyDisplaySettings);
el('answerArea').addEventListener('input', applyDisplaySettings);
el('fontDown').addEventListener('click', () => { el('answerFont').value = Math.max(11, Number(el('answerFont').value) - 1); applyDisplaySettings(); });
el('fontUp').addEventListener('click', () => { el('answerFont').value = Math.min(22, Number(el('answerFont').value) + 1); applyDisplaySettings(); });
el('captureModeButton').addEventListener('click', async () => { setCaptureMode(await window.overlay.captureMode(captureMode === 'automatic' ? 'manual' : 'automatic')); });
el('manualAction').addEventListener('click', () => window.overlay.captureButton());
el('startQuestions').addEventListener('click', () => window.overlay.startQuestions());
el('mockReveal').addEventListener('click', () => window.overlay.mockReveal());
el('mockNext').addEventListener('click', () => window.overlay.mockNext());
el('feedbackCandidate').addEventListener('click', () => feedbackAction(() => window.overlay.feedbackPhase('candidate')));
el('feedbackQuestion').addEventListener('click', () => feedbackAction(() => window.overlay.feedbackPhase('question')));
el('feedbackReviewer1').addEventListener('click', () => feedbackAction(() => window.overlay.feedbackPhase('reviewer1')));
el('feedbackReviewer2').addEventListener('click', () => feedbackAction(() => window.overlay.feedbackPhase('reviewer2')));
el('feedbackRating').addEventListener('change', event => feedbackAction(() => window.overlay.feedbackRating(event.target.value)));
el('feedbackGenerate').addEventListener('click', () => feedbackAction(() => window.overlay.feedbackGenerate()));
el('feedbackNext').addEventListener('click', () => feedbackAction(() => window.overlay.feedbackNext()));
el('historyPanel').addEventListener('toggle', () => { if (el('historyPanel').open) loadHistory(); });
el('historyReveal').addEventListener('click', () => window.overlay.revealHistory());
el('usageEnabled').addEventListener('change', event => setUsageVisible(event.target.checked));
el('usageToggle').addEventListener('click', () => setUsageVisible(!usageVisible));
el('usageRefresh').addEventListener('click', refreshUsage);
el('usageOpen').addEventListener('click', () => window.overlay.openUsage());
el('start').addEventListener('click', start);
el('stop').addEventListener('click', stop);
el('close').addEventListener('click', () => window.overlay.close());
el('minimize').addEventListener('click', () => window.overlay.minimize());
window.overlay.onEvent(({ type, payload }) => {
  if (!running && !starting) return;
  if (type === 'partial') {
    if (mode === 'mock') showMockSpeech([mockResponse, payload].filter(Boolean).join(' '));
    else if (mode === 'feedbacker') el('statusText').textContent = t('TRANSCRIBING WORKSHOP SPEECH');
    else el('statusText').textContent = questionPhase === 'intro' ? t('INTRO · WAITING FOR QUESTIONS') : t('LISTENING FOR A NEW QUESTION');
  } else if ((type === 'feedback-round' || type === 'feedback-transcript') && mode === 'feedbacker') {
    renderFeedback(payload);
    if (type === 'feedback-round' && payload.number > 1 && !payload.transcripts.candidate) setText('answer', t('Capture the candidate and peer reviewers, then generate ASMA feedback.'), 'placeholder');
  } else if (type === 'feedback-answer' && mode === 'feedbacker') {
    setText('answer', payload.text || t('Preparing ASMA feedback…'), payload.loading ? 'loading' : '');
    el('statusText').textContent = payload.loading ? t('PREPARING ASMA FEEDBACK') : t('ASMA READY');
    if (!payload.loading) {
      el('feedbackGenerate').disabled = true;
      for (const id of ['feedbackQuestion', 'feedbackCandidate', 'feedbackReviewer1', 'feedbackReviewer2', 'feedbackRating']) el(id).disabled = true;
    }
  } else if (type === 'mock-question' && mode === 'mock') {
    mockResponse = '';
    showMockSpeech('');
    setText('question', payload.question);
    setText('answer', t('Speak your answer, then press SHOW ANSWER.'), 'placeholder');
    el('statusText').textContent = `${t('PRACTICE')} ${payload.index}/${payload.total}`;
    el('mockReveal').disabled = false;
    el('mockNext').disabled = false;
  } else if (type === 'mock-response' && mode === 'mock') {
    mockResponse = payload;
    showMockSpeech(mockResponse);
    el('statusText').textContent = t('LISTENING TO YOUR ANSWER');
  } else if (type === 'mock-replay' && mode === 'mock') {
    el('statusText').textContent = `${t('PRACTICE')} ${payload.index}/${payload.total}`;
  } else if (type === 'mock-answer' && mode === 'mock') {
    setText('answer', payload.answer);
    el('statusText').textContent = t('ANSWER REVEALED');
    el('mockReveal').disabled = true;
  } else if (type === 'mock-complete' && mode === 'mock') {
    showMockSpeech('');
    setText('question', t('PRACTICE COMPLETE'));
    setText('answer', t('You completed the practice deck. Stop to review your answers, or choose another topic.'));
    el('statusText').textContent = t('PRACTICE COMPLETE');
    el('mockReveal').disabled = true;
    el('mockNext').disabled = true;
  } else if (type === 'question') {
    setText('question', payload);
    setText('answer', t('Preparing answer…'), 'loading');
    el('statusText').textContent = t('PREPARING ANSWER');
  } else if (type === 'followup') {
    el('statusText').textContent = t('REPEAT / CLARIFICATION');
  } else if (type === 'idle') {
    el('statusText').textContent = questionPhase === 'intro' && captureMode === 'automatic' ? t('INTRO · WAITING FOR QUESTIONS') : captureMode === 'automatic' ? t('READY FOR A NEW QUESTION') : t('SHIFT: READY');
  } else if (type === 'answer' && mode === 'live') {
    const answer = payload.text;
    setText('answer', answer || (payload.loading ? t('Preparing answer…') : t('Waiting for the next question…')), payload.loading ? 'loading' : (answer ? '' : 'placeholder'));
    if (!payload.loading) el('statusText').textContent = captureMode === 'automatic' ? t('READY FOR A NEW QUESTION') : t('SHIFT: READY');
  } else if (type === 'capture-mode') {
    setCaptureMode(payload);
  } else if (type === 'phase') {
    setQuestionPhase(payload);
  } else if (type === 'capture') {
    setCaptureState(payload);
  } else if (type === 'keyboard' && payload !== 'ready') {
    el('captureHint').textContent = t('SHIFT UNAVAILABLE · USE BUTTON');
  } else if (type === 'usage') {
    const last = payload.last;
    const total = payload.total;
    el('usageLast').textContent = `${number(last.input + last.output)} (${t('input')} ${number(last.input)}, ${t('output')} ${number(last.output)})`;
    el('usageLast').title = `${t('cached input')}: ${number(last.cached)} ${t('tokens')} (${t('part of input')})`;
    el('usageSession').textContent = `${number(total.input + total.output)} ${t('tokens')} · ${total.answers} ${t('answers')}`;
    if (usageVisible) refreshUsage();
  } else if (type === 'error') {
    setText('answer', payload, 'error');
    el('statusText').textContent = t('ERROR');
  } else if (type === 'closed' && running) {
    showSetupError(t('Transcription connection closed.'));
    stop();
  }
});
setTransparency(el('opacity').value);
applyDisplaySettings();
setUiLanguage('en');

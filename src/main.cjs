'use strict';

const { app, BrowserWindow, ipcMain, desktopCapturer, session, globalShortcut, screen, shell, dialog } = require('electron');
const path = require('path');
const { LocalTranscriber } = require('./local-transcriber.cjs');
const { setCodexPath, checkCodexLogin, generateWithCodex, readCodexLimits } = require('./codex-backend.cjs');
const { CLAUDE_MODEL, testAnthropicKey, generateWithClaude } = require('./anthropic-backend.cjs');
const { makePrompt } = require('./logic.cjs');
const { QuestionGate } = require('./question-gate.cjs');
const { ManualCapture } = require('./manual-capture.cjs');
const { HistoryStore } = require('./history.cjs');
const { startKeyMonitor } = require('./key-monitor.cjs');
const { quickAnswer } = require('./quick-answer.cjs');
const { findOfflineAnswer, loadBank } = require('./offline-answers.cjs');
const { MockPractice, loadMockDeck, mockCommand } = require('./mock-practice.cjs');
const { summarize } = require('./analytics.cjs');
const { FeedbackRound, makeAsmaPrompt, offlineAsmaScaffold } = require('./feedbacker.cjs');

let window;
let transcriber;
let facilitatorTranscriber;
let feedbackMicEnabled = false;
let apiKey = '';
let profile = '';
let mode = 'live';
let provider = 'offline';
let language = 'en';
let captureMode = 'automatic';
let currentQuestion = '';
let manualCapture;
let manualJobSerial = 0;
let stopKeyMonitor;
let history;
let questionGate;
let mockPractice;
let mockEntryId;
let mockQuestionStartedAt = 0;
let mockAudioMs = 0;
let mockTranscriptionMs = 0;
let sessionSerial = 0;
let answerAbort;
let answerSerial = 0;
let feedbackRound;
let feedbackEntryId;
let feedbackBusy = false;
let feedbackMicBusy = false;
let feedbackAudioMs = 0;
let feedbackTranscriptionMs = 0;
let feedbackGenerating = false;
let usageTotals = { input: 0, cached: 0, output: 0, answers: 0 };
const CODEX_MODEL = 'gpt-6-luna';
const API_MODEL = 'gpt-5-mini';
const OFFLINE_MODEL = 'local-qna-v1';
const MOCK_MODEL = 'mock-md-v1';

function recordUsage(raw) {
  if (!raw) return null;
  const input = Number(raw.input_tokens) || 0;
  const cached = Number(raw.cached_input_tokens ?? raw.input_tokens_details?.cached_tokens) || 0;
  const output = Number(raw.output_tokens) || 0;
  if (!input && !output) return null;
  usageTotals.input += input;
  usageTotals.cached += cached;
  usageTotals.output += output;
  usageTotals.answers++;
  emit('usage', { last: { input, cached, output }, total: { ...usageTotals } });
  return { inputTokens: input, cachedInputTokens: cached, outputTokens: output };
}

function emit(type, payload) {
  if (window && !window.isDestroyed()) window.webContents.send('session:event', { type, payload });
}

function createWindow() {
  const display = screen.getPrimaryDisplay().workArea;
  window = new BrowserWindow({
    width: 510,
    height: Math.min(700, display.height - 48),
    x: Math.round(display.x + (display.width - 510) / 2),
    y: Math.round(display.y + (display.height - Math.min(700, display.height - 48)) / 2),
    minWidth: 390,
    minHeight: 310,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    visibleOnAllWorkspaces: true,
    skipTaskbar: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  window.setAlwaysOnTop(true, 'floating');
  if (process.platform === 'darwin' || process.platform === 'win32') window.setContentProtection(true);
  window.loadFile(path.join(__dirname, 'index.html'));
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.on('closed', () => { stopSession(); window = null; });
}

function stopSession() {
  sessionSerial++;
  manualJobSerial++;
  answerAbort?.abort();
  answerAbort = undefined;
  answerSerial++;
  transcriber?.close();
  transcriber = undefined;
  facilitatorTranscriber?.close();
  facilitatorTranscriber = undefined;
  feedbackMicEnabled = false;
  manualCapture?.reset();
  manualCapture = undefined;
  stopKeyMonitor?.();
  stopKeyMonitor = undefined;
  if (mockEntryId && mockPractice?.current && !mockPractice.revealed) history?.update(mockEntryId, { status: 'unfinished', candidateAnswer: mockPractice.response });
  if (feedbackEntryId && feedbackRound) history?.update(feedbackEntryId, { status: feedbackRound.generated ? 'complete' : 'unfinished', question: feedbackRound.transcripts.question || feedbackRound.transcripts.candidate, candidateAnswer: feedbackRound.transcripts.candidate, reviewer1: feedbackRound.transcripts.reviewer1, reviewer2: feedbackRound.transcripts.reviewer2, feedbackTurns: feedbackRound.turns, rating: feedbackRound.rating, audioMs: feedbackAudioMs, transcriptionMs: feedbackTranscriptionMs });
  history?.finish();
  questionGate = undefined;
  mockPractice = undefined;
  mockEntryId = undefined;
  mockQuestionStartedAt = 0;
  mockAudioMs = 0;
  mockTranscriptionMs = 0;
  feedbackRound = undefined;
  feedbackEntryId = undefined;
  feedbackBusy = false;
  feedbackMicBusy = false;
  feedbackAudioMs = 0;
  feedbackTranscriptionMs = 0;
  feedbackGenerating = false;
  currentQuestion = '';
  apiKey = '';
  profile = '';
  emit('status', 'stopped');
}

function showMockQuestion(advance = false) {
  if (!mockPractice) return null;
  if (advance && mockEntryId && !mockPractice.revealed) {
    history?.update(mockEntryId, { status: 'skipped', candidateAnswer: mockPractice.response, finishedAt: new Date().toISOString() });
  }
  const item = advance || !mockPractice.current ? mockPractice.next() : mockPractice.current;
  if (!item) {
    mockEntryId = undefined;
    emit('mock-complete', { total: mockPractice.deck.length });
    return null;
  }
  if (advance || !mockEntryId) {
    mockQuestionStartedAt = Date.now();
    mockAudioMs = 0;
    mockTranscriptionMs = 0;
    mockEntryId = history?.question({ question: item.question, answer: item.answer, candidateAnswer: '', source: 'mock-md', category: item.category, deckId: item.id, audioMs: 0, transcriptionMs: 0, inputTokens: 0, outputTokens: 0, contextCharacters: 0, model: MOCK_MODEL, status: 'answering', askedAt: new Date(mockQuestionStartedAt).toISOString() });
    transcriber?.reset();
  }
  emit('mock-question', item);
  return item;
}

function revealMockAnswer() {
  if (!mockPractice?.current) return null;
  const item = mockPractice.reveal();
  history?.update(mockEntryId, { status: 'complete', candidateAnswer: item.response, audioMs: mockAudioMs, transcriptionMs: mockTranscriptionMs, generationMs: 0, totalProcessingMs: 0, responseDurationMs: Date.now() - mockQuestionStartedAt, finishedAt: new Date().toISOString() });
  emit('mock-answer', item);
  return item;
}

function startFeedbackRound(number) {
  feedbackRound = new FeedbackRound(number);
  feedbackAudioMs = 0;
  feedbackTranscriptionMs = 0;
  feedbackGenerating = false;
  feedbackEntryId = history?.question({ question: '', answer: '', candidateAnswer: '', reviewer1: '', reviewer2: '', feedbackTurns: [], rating: 'auto', source: 'feedbacker', audioMs: 0, transcriptionMs: 0, inputTokens: 0, outputTokens: 0, contextCharacters: 0, model: provider === 'offline' ? 'asma-scaffold-v1' : provider === 'codex' ? CODEX_MODEL : provider === 'anthropic' ? CLAUDE_MODEL : API_MODEL, status: 'capturing', askedAt: new Date().toISOString() });
  emit('feedback-round', feedbackRound.snapshot());
  return feedbackRound.snapshot();
}

async function flushFeedbackSpeech(includeFacilitator = false) {
  feedbackBusy = true;
  feedbackMicBusy = includeFacilitator;
  transcriber?.finishTurn();
  if (includeFacilitator) facilitatorTranscriber?.finishTurn();
  await Promise.all([transcriber?.finalQueue, includeFacilitator ? facilitatorTranscriber?.finalQueue : null]);
  transcriber?.reset();
  if (includeFacilitator) facilitatorTranscriber?.reset();
}

async function suggestAnswer(question, previousQuestion, entryId, transcriptionMs, instantAnswer = '', feedback = false) {
  if ((provider === 'api' || provider === 'anthropic') && !apiKey) return;
  answerAbort?.abort();
  const abort = new AbortController();
  answerAbort = abort;
  const serial = ++answerSerial;
  const roundForAnswer = feedback ? feedbackRound : null;
  const prompt = provider === 'offline' ? '' : feedback ? makeAsmaPrompt(roundForAnswer) : makePrompt(question, previousQuestion, profile);
  const started = Date.now();
  const model = provider === 'offline' ? feedback ? 'asma-scaffold-v1' : OFFLINE_MODEL : provider === 'codex' ? CODEX_MODEL : provider === 'anthropic' ? CLAUDE_MODEL : API_MODEL;
  history?.update(entryId, { model, contextCharacters: provider === 'offline' ? 0 : prompt.length, generationStartedAt: new Date(started).toISOString(), status: 'generating' });
  let answer = '';
  const eventType = feedback ? 'feedback-answer' : 'answer';
  if (provider !== 'offline') emit(eventType, { question, text: instantAnswer, loading: true });
  try {
    if (provider === 'offline') {
      const found = feedback ? null : findOfflineAnswer(question, language);
      if (serial !== answerSerial) return;
      const text = feedback ? offlineAsmaScaffold(roundForAnswer) : found?.answer || (language === 'sr' ? 'Nema pouzdanog lokalnog odgovora za ovo pitanje.' : 'No reliable offline answer found for this question.');
      if (feedback) { roundForAnswer.generated = text; feedbackGenerating = false; }
      const lookupMs = Date.now() - started;
      history?.update(entryId, { answer: text, matchId: found?.id || null, matchConfidence: found?.confidence || 0, answerSource: feedback ? 'asma-scaffold' : found?.source || null, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, generationMs: lookupMs, totalProcessingMs: transcriptionMs + lookupMs, finishedAt: new Date().toISOString(), status: feedback || found ? 'complete' : 'unmatched' });
      emit(eventType, { question, text, loading: false });
      return;
    }
    if (provider === 'codex') {
      const result = await generateWithCodex(prompt, abort.signal, { model });
      if (serial === answerSerial) {
        if (feedback) { roundForAnswer.generated = result.text; feedbackGenerating = false; }
        const tokens = recordUsage(result.usage) || {};
        history?.update(entryId, { answer: result.text, ...tokens, generationMs: Date.now() - started, totalProcessingMs: transcriptionMs + Date.now() - started, finishedAt: new Date().toISOString(), status: 'complete' });
        emit(eventType, { question, text: result.text, loading: false });
      }
      return;
    }
    if (provider === 'anthropic') {
      const result = await generateWithClaude(prompt, apiKey, abort.signal, {
        model, maxTokens: feedback ? 240 : 140,
        onDelta: text => {
          if (serial === answerSerial && (!instantAnswer || text.trim().length >= 60)) emit(eventType, { question, text, loading: true });
        }
      });
      if (serial === answerSerial) {
        if (feedback) { roundForAnswer.generated = result.text; feedbackGenerating = false; }
        const tokens = recordUsage(result.usage) || {};
        history?.update(entryId, { answer: result.text, ...tokens, generationMs: Date.now() - started, totalProcessingMs: transcriptionMs + Date.now() - started, finishedAt: new Date().toISOString(), status: 'complete' });
        emit(eventType, { question, text: result.text, loading: false });
      }
      return;
    }
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: feedback ? 240 : 140,
        reasoning: { effort: 'low' },
        stream: true
      }),
      signal: abort.signal
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error?.message || `AI request failed (${response.status})`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop();
      for (const block of blocks) {
        for (const line of block.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }
          if (event.type === 'response.output_text.delta') {
            answer += event.delta || '';
            if (serial === answerSerial && (!instantAnswer || answer.trim().length >= 60)) {
              emit(eventType, { question, text: answer, loading: true });
            }
          } else if (event.type === 'error' || event.type === 'response.failed') {
            throw new Error(event.error?.message || event.response?.error?.message || 'AI request failed');
          } else if (event.type === 'response.completed' && serial === answerSerial) {
            const tokens = recordUsage(event.response?.usage) || {};
            history?.update(entryId, tokens);
          }
        }
      }
    }
    if (serial === answerSerial) {
      if (feedback) { roundForAnswer.generated = answer.trim(); feedbackGenerating = false; }
      history?.update(entryId, { answer: answer.trim(), generationMs: Date.now() - started, totalProcessingMs: transcriptionMs + Date.now() - started, finishedAt: new Date().toISOString(), status: 'complete' });
      emit(eventType, { question, text: answer.trim(), loading: false });
    }
  } catch (error) {
    if (error.name !== 'AbortError' && serial === answerSerial) {
      if (feedback) feedbackGenerating = false;
      history?.update(entryId, { status: instantAnswer ? 'fallback' : 'error', answer: instantAnswer, error: error.message, generationMs: Date.now() - started });
      if (instantAnswer) emit(eventType, { question, text: instantAnswer, loading: false });
      else emit('error', error.message);
    }
  }
}

function handleFinal(payload, source = 'automatic') {
  const details = typeof payload === 'string' ? { text: payload } : payload;
  const utterance = String(details?.text || '').trim();
  if (!utterance) return;
  if (mode === 'feedbacker') {
    if (!feedbackRound || feedbackRound.generated || feedbackGenerating) return;
    if (source === 'facilitator') feedbackRound.appendAs('question', utterance, details.endedAt || Date.now(), 'microphone');
    else feedbackRound.appendAs(feedbackRound.phase, utterance, details.endedAt || Date.now(), 'selected');
    feedbackAudioMs += details.audioMs || 0;
    feedbackTranscriptionMs += details.transcriptionMs || 0;
    history?.update(feedbackEntryId, { question: feedbackRound.transcripts.question || feedbackRound.transcripts.candidate, candidateAnswer: feedbackRound.transcripts.candidate, reviewer1: feedbackRound.transcripts.reviewer1, reviewer2: feedbackRound.transcripts.reviewer2, feedbackTurns: feedbackRound.turns, audioMs: feedbackAudioMs, transcriptionMs: feedbackTranscriptionMs });
    emit('feedback-transcript', { ...feedbackRound.snapshot(), audioSource: source });
    return;
  }
  if (mode === 'mock') {
    const command = mockCommand(utterance);
    if (command === 'start' || command === 'repeat') {
      if (mockPractice?.current) emit('mock-replay', mockPractice.current);
      else showMockQuestion();
    }
    else if (command === 'reveal') revealMockAnswer();
    else if (command === 'next') showMockQuestion(true);
    else if (mockPractice?.current && !mockPractice.revealed) {
      mockAudioMs += details.audioMs || 0;
      mockTranscriptionMs += details.transcriptionMs || 0;
      const response = mockPractice.appendResponse(utterance);
      history?.update(mockEntryId, { candidateAnswer: response, audioMs: mockAudioMs, transcriptionMs: mockTranscriptionMs });
      emit('mock-response', response);
    }
    return;
  }
  const decision = questionGate?.observe(utterance, Boolean(currentQuestion), source);
  if (decision?.phaseChanged) emit('phase', decision.phase);
  if (decision?.action === 'followup') {
    emit('followup', utterance);
    return;
  }
  if (decision?.action !== 'question') { emit('idle'); return; }
  const previousQuestion = currentQuestion;
  currentQuestion = utterance;
  emit('question', utterance);
  const instant = provider === 'offline' ? '' : quickAnswer(utterance, language);
  const entryId = history?.question({ question: utterance, answer: instant, instantAnswer: Boolean(instant), source, audioMs: details.audioMs || 0, transcriptionMs: details.transcriptionMs || 0, capturedAt: new Date(details.endedAt || Date.now()).toISOString(), model: provider === 'offline' ? OFFLINE_MODEL : provider === 'codex' ? CODEX_MODEL : provider === 'anthropic' ? CLAUDE_MODEL : API_MODEL, status: 'transcribing' });
  suggestAnswer(utterance, previousQuestion, entryId, details.transcriptionMs || 0, instant);
}

app.whenReady().then(() => {
  history = new HistoryStore(app.getPath('userData'));
  loadBank();
  loadMockDeck();
  ipcMain.handle('codex:choose', async () => {
    const result = await dialog.showOpenDialog(window, {
      title: 'Choose the Codex CLI executable',
      properties: ['openFile', 'showHiddenFiles']
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('codex:test', async (_event, file) => {
    setCodexPath(file);
    return { path: await checkCodexLogin() };
  });
  ipcMain.handle('anthropic:test', async (_event, key) => testAnthropicKey(String(key || '').trim()));
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback) => {
    callback(contents === window?.webContents && (permission === 'display-capture' || permission === 'media'));
  });
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      if (!sources[0]) throw new Error('No screen available');
      callback({ video: sources[0], audio: 'loopback' });
    } catch (error) {
      emit('error', error.message);
    }
  });
  ipcMain.handle('session:start', async (_event, options) => {
    stopSession();
    usageTotals = { input: 0, cached: 0, output: 0, answers: 0 };
    mode = ['mock', 'feedbacker'].includes(options?.mode) ? options.mode : 'live';
    provider = mode === 'mock' ? 'offline' : options?.provider === 'api' ? 'api' : options?.provider === 'codex' ? 'codex' : options?.provider === 'anthropic' ? 'anthropic' : 'offline';
    captureMode = mode !== 'live' ? 'automatic' : options?.captureMode === 'manual' ? 'manual' : 'automatic';
    feedbackMicEnabled = mode === 'feedbacker' && Boolean(options?.feedbackMic);
    if (provider === 'api' && mode !== 'mock') {
      apiKey = String(options?.apiKey || '').trim();
      if (!apiKey) throw new Error('Enter your own OpenAI API key to use API mode.');
    } else if (provider === 'anthropic' && mode !== 'mock') {
      apiKey = String(options?.apiKey || '').trim();
      if (!apiKey) throw new Error('Enter your own Anthropic API key to use Claude.');
    } else if (provider === 'codex' && mode !== 'mock') {
      setCodexPath(options?.codexPath);
      await checkCodexLogin();
    }
    language = mode === 'feedbacker' ? 'en' : options?.language === 'sr' ? 'sr' : 'en';
    profile = String(options?.profile || '').slice(0, 4000);
    questionGate = new QuestionGate();
    if (mode === 'mock') mockPractice = new MockPractice({ language, category: options?.mockCategory || 'all' });
    const onEvent = (type, payload) => {
        if (transcriber !== current) return;
        if (type === 'final') {
          if (captureMode === 'automatic') handleFinal(payload);
        } else if (type === 'partial') {
          if (captureMode === 'automatic') emit('partial', payload);
        } else emit(type, payload);
      };
    const current = new LocalTranscriber({ language, onEvent });
    transcriber = current;
    try {
      await transcriber.connect();
      if (feedbackMicEnabled) {
        const mic = new LocalTranscriber({ language, onEvent: (type, payload) => {
          if (facilitatorTranscriber !== mic || mode !== 'feedbacker') return;
          if (type === 'final') handleFinal(payload, 'facilitator');
          else if (type === 'partial') emit('feedback-mic-partial', payload);
          else emit(type, payload);
        } });
        facilitatorTranscriber = mic;
        await mic.connect();
      }
      history.start({ mode, captureMode, language, provider, model: mode === 'mock' ? MOCK_MODEL : provider === 'offline' && mode === 'feedbacker' ? 'asma-scaffold-v1' : provider === 'offline' ? OFFLINE_MODEL : provider === 'codex' ? CODEX_MODEL : provider === 'anthropic' ? CLAUDE_MODEL : API_MODEL });
      if (mode === 'feedbacker') startFeedbackRound(1);
      const sessionId = sessionSerial;
      manualCapture = new ManualCapture({
        onState: state => {
          if (captureMode === 'automatic' && (state === 'toggle' || state === 'processing')) {
            captureMode = 'manual';
            current.reset();
            emit('capture-mode', 'manual');
          }
          emit('capture', state);
        },
        onComplete: async recording => {
          if (transcriber !== current) return;
          const job = ++manualJobSerial;
          const started = Date.now();
          try {
            const text = await current.runWhisper(recording.pcm);
            if (sessionId !== sessionSerial || job !== manualJobSerial) return;
            handleFinal({ text, audioMs: recording.audioMs, endedAt: recording.endedAt, transcriptionMs: Date.now() - started }, 'manual');
          } catch (error) {
            if (sessionId === sessionSerial) emit('error', error.message);
          } finally {
            if (sessionId === sessionSerial && job === manualJobSerial) emit('capture', 'idle');
          }
        }
      });
      if (mode === 'live') stopKeyMonitor = startKeyMonitor(down => manualCapture?.key(down), state => emit('keyboard', state));
      emit('capture-mode', captureMode);
      emit('status', 'listening');
      return true;
    } catch (error) {
      stopSession();
      throw new Error(`Speech recognition could not start: ${error.message}`);
    }
  });
  ipcMain.on('session:audio', (_event, data) => {
    if (!(data?.pcm instanceof ArrayBuffer) || !Number.isFinite(data.durationMs)) return;
    if (data.source === 'facilitator') {
      if (mode === 'feedbacker' && feedbackMicEnabled && !feedbackMicBusy && !feedbackRound?.generated && !feedbackGenerating) facilitatorTranscriber?.ingest(data.pcm, data.durationMs);
      return;
    }
    if (manualCapture?.state !== 'idle') manualCapture.audio(new Int16Array(data.pcm));
    if (captureMode === 'automatic' && !feedbackBusy && !(mode === 'feedbacker' && (feedbackRound?.generated || feedbackGenerating))) transcriber?.ingest(data.pcm, data.durationMs);
  });
  ipcMain.handle('capture:mode', (_event, next) => {
    manualJobSerial++;
    captureMode = next === 'manual' ? 'manual' : 'automatic';
    manualCapture?.reset();
    transcriber?.reset();
    emit('capture-mode', captureMode);
    return captureMode;
  });
  ipcMain.handle('questions:start', () => {
    if (mode !== 'live' || !questionGate) return false;
    questionGate.startQuestions();
    emit('phase', 'interview');
    return true;
  });
  ipcMain.handle('mock:begin', () => mode === 'mock' ? showMockQuestion() : null);
  ipcMain.handle('mock:reveal', () => mode === 'mock' ? revealMockAnswer() : null);
  ipcMain.handle('mock:next', () => mode === 'mock' ? showMockQuestion(true) : null);
  ipcMain.handle('feedback:phase', async (_event, phase) => {
    if (mode !== 'feedbacker' || !feedbackRound || feedbackRound.generated || feedbackGenerating) return null;
    try {
      if (!['question', 'candidate', 'reviewer1', 'reviewer2'].includes(phase)) throw new Error('Unknown workshop speaker');
      await flushFeedbackSpeech();
      const snapshot = feedbackRound.setPhase(phase);
      emit('feedback-round', snapshot);
      return snapshot;
    } finally { feedbackBusy = false; feedbackMicBusy = false; }
  });
  ipcMain.handle('feedback:rating', (_event, rating) => {
    if (mode !== 'feedbacker' || !feedbackRound || feedbackRound.generated || feedbackGenerating) return null;
    feedbackRound.setRating(rating);
    history?.update(feedbackEntryId, { rating: feedbackRound.rating });
    emit('feedback-round', feedbackRound.snapshot());
    return feedbackRound.snapshot();
  });
  ipcMain.handle('feedback:generate', async () => {
    if (mode !== 'feedbacker' || !feedbackRound || feedbackRound.generated || feedbackGenerating) return false;
    try {
      await flushFeedbackSpeech(true);
      if (!feedbackRound.transcripts.candidate) throw new Error('Capture the candidate answer before generating feedback.');
      feedbackGenerating = true;
      const question = `Workshop round ${feedbackRound.number}`;
      history?.update(feedbackEntryId, { question: feedbackRound.transcripts.question || feedbackRound.transcripts.candidate, candidateAnswer: feedbackRound.transcripts.candidate, reviewer1: feedbackRound.transcripts.reviewer1, reviewer2: feedbackRound.transcripts.reviewer2, feedbackTurns: feedbackRound.turns, rating: feedbackRound.rating, audioMs: feedbackAudioMs, transcriptionMs: feedbackTranscriptionMs });
      suggestAnswer(question, '', feedbackEntryId, feedbackTranscriptionMs, '', true);
      return true;
    } finally { feedbackBusy = false; feedbackMicBusy = false; }
  });
  ipcMain.handle('feedback:next', async () => {
    if (mode !== 'feedbacker' || !feedbackRound) return null;
    try {
      await flushFeedbackSpeech(true);
      answerAbort?.abort();
      answerSerial++;
      feedbackGenerating = false;
      history?.update(feedbackEntryId, { status: feedbackRound.generated ? 'complete' : 'unfinished', finishedAt: new Date().toISOString(), question: feedbackRound.transcripts.question || feedbackRound.transcripts.candidate, candidateAnswer: feedbackRound.transcripts.candidate, reviewer1: feedbackRound.transcripts.reviewer1, reviewer2: feedbackRound.transcripts.reviewer2, feedbackTurns: feedbackRound.turns });
      return startFeedbackRound(feedbackRound.number + 1);
    } finally { feedbackBusy = false; feedbackMicBusy = false; }
  });
  ipcMain.handle('capture:key', (_event, down) => {
    if (captureMode === 'automatic') {
      captureMode = 'manual';
      transcriber?.reset();
      emit('capture-mode', 'manual');
    }
    manualCapture?.key(Boolean(down));
  });
  ipcMain.handle('capture:button', () => {
    if (captureMode === 'automatic') {
      captureMode = 'manual';
      transcriber?.reset();
      emit('capture-mode', 'manual');
    }
    manualCapture?.toggle();
  });
  ipcMain.handle('history:list', () => history?.list() || []);
  ipcMain.handle('history:summary', () => summarize(history?.list() || []));
  ipcMain.handle('history:reveal', () => { if (history) shell.showItemInFolder(history.file); });
  ipcMain.handle('session:stop', () => { stopSession(); return true; });
  ipcMain.handle('window:compact', (_event, compact) => {
    if (!window || window.isDestroyed()) return;
    window.setSize(window.getSize()[0], Math.min(compact ? 530 : 700, screen.getDisplayMatching(window.getBounds()).workArea.height - 20), true);
  });
  ipcMain.handle('window:usage-size', (_event, visible) => {
    if (!window || window.isDestroyed()) return;
    window.setSize(window.getSize()[0], Math.min(visible ? 660 : 530, screen.getDisplayMatching(window.getBounds()).workArea.height - 20), true);
  });
  ipcMain.handle('usage:read', async () => provider === 'codex' ? readCodexLimits() : null);
  ipcMain.handle('usage:open', () => { if (provider !== 'offline') shell.openExternal(provider === 'codex' ? 'https://chatgpt.com/settings/usage' : provider === 'anthropic' ? 'https://platform.claude.com/usage' : 'https://platform.openai.com/settings/organization/billing/overview'); });
  ipcMain.handle('window:close', () => window?.close());
  ipcMain.handle('window:minimize', () => window?.minimize());
  ipcMain.handle('app:version', () => app.getVersion());
  createWindow();
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (window?.isVisible()) window.hide();
    else window?.show();
  });
  app.on('activate', () => { if (!window) createWindow(); else window.show(); });
});

app.on('before-quit', stopSession);
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());

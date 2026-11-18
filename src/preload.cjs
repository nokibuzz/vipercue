'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlay', {
  start: options => ipcRenderer.invoke('session:start', options),
  chooseCodexPath: () => ipcRenderer.invoke('codex:choose'),
  testCodex: path => ipcRenderer.invoke('codex:test', path),
  stop: () => ipcRenderer.invoke('session:stop'),
  sendAudio: (pcm, durationMs) => ipcRenderer.send('session:audio', { pcm, durationMs }),
  onEvent: callback => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('session:event', listener);
    return () => ipcRenderer.removeListener('session:event', listener);
  },
  close: () => ipcRenderer.invoke('window:close'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  compact: value => ipcRenderer.invoke('window:compact', value),
  usageSize: visible => ipcRenderer.invoke('window:usage-size', visible),
  readUsage: () => ipcRenderer.invoke('usage:read'),
  openUsage: () => ipcRenderer.invoke('usage:open'),
  captureMode: mode => ipcRenderer.invoke('capture:mode', mode),
  captureButton: () => ipcRenderer.invoke('capture:button'),
  startQuestions: () => ipcRenderer.invoke('questions:start'),
  mockBegin: () => ipcRenderer.invoke('mock:begin'),
  mockReveal: () => ipcRenderer.invoke('mock:reveal'),
  mockNext: () => ipcRenderer.invoke('mock:next'),
  feedbackPhase: phase => ipcRenderer.invoke('feedback:phase', phase),
  feedbackRating: rating => ipcRenderer.invoke('feedback:rating', rating),
  feedbackGenerate: () => ipcRenderer.invoke('feedback:generate'),
  feedbackNext: () => ipcRenderer.invoke('feedback:next'),
  history: () => ipcRenderer.invoke('history:list'),
  historySummary: () => ipcRenderer.invoke('history:summary'),
  revealHistory: () => ipcRenderer.invoke('history:reveal'),
  version: () => ipcRenderer.invoke('app:version')
});

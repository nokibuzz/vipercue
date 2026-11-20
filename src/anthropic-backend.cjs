'use strict';

const CLAUDE_MODEL = 'claude-haiku-5-5';
const API_VERSION = '2026-10-21';
const API_ROOT = 'https://api.anthropic.com/v1';

function headers(key) {
  return {
    Authorization: `Bearer ${key}`,
    'anthropic-version': API_VERSION,
    'content-type': 'application/json'
  };
}

async function responseError(response, key) {
  const detail = await response.json().catch(() => ({}));
  const message = detail.error?.message || `Claude API request failed (${response.status})`;
  return new Error(String(message).replaceAll(key, '[redacted]'));
}

async function testAnthropicKey(key, fetcher = fetch) {
  if (!key) throw new Error('Enter your own Anthropic API key.');
  const response = await fetcher(`${API_ROOT}/models/${CLAUDE_MODEL}`, {
    headers: headers(key),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw await responseError(response, key);
  const model = await response.json();
  return { model: model.id || CLAUDE_MODEL };
}

async function generateWithClaude(prompt, key, signal, { model = CLAUDE_MODEL, maxTokens = 140, onDelta = () => {}, fetcher = fetch } = {}) {
  if (!key) throw new Error('Enter your own Anthropic API key.');
  const response = await fetcher(`${API_ROOT}/messages`, {
    method: 'POST',
    headers: headers(key),
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }], stream: true }),
    signal: AbortSignal.any([AbortSignal.timeout(30000), ...(signal ? [signal] : [])])
  });
  if (!response.ok) throw await responseError(response, key);
  if (!response.body) throw new Error('Claude API returned no response stream.');

  let text = '';
  let inputTokens = 0;
  let cachedInputTokens = 0;
  let outputTokens = 0;
  let stopped = false;
  let buffer = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const handleBlock = block => {
    const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data) return;
    let event;
    try { event = JSON.parse(data); } catch { throw new Error('Claude API returned an invalid event.'); }
    if (event.type === 'message_start') {
      const usage = event.message?.usage || {};
      inputTokens = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
      cachedInputTokens = usage.cache_read_input_tokens || 0;
      outputTokens = usage.output_tokens || 0;
    } else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      text += event.delta.text || '';
      onDelta(text);
    } else if (event.type === 'message_delta') {
      outputTokens = event.usage?.output_tokens ?? outputTokens;
    } else if (event.type === 'message_stop') {
      stopped = true;
    } else if (event.type === 'error') {
      throw new Error(String(event.error?.message || 'Claude API stream failed').replaceAll(key, '[redacted]'));
    }
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      buffer = buffer.replace(/\r\n/g, '\n');
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        handleBlock(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
      }
      if (done) break;
    }
    if (buffer.trim()) handleBlock(buffer);
    if (!stopped) throw new Error('Claude API response ended before completion.');
    if (!text.trim()) throw new Error('Claude API returned an empty answer.');
    return { text: text.trim(), usage: { input_tokens: inputTokens, cached_input_tokens: cachedInputTokens, output_tokens: outputTokens } };
  } finally {
    reader.releaseLock();
  }
}

module.exports = { CLAUDE_MODEL, testAnthropicKey, generateWithClaude };

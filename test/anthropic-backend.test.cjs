'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CLAUDE_MODEL, testAnthropicKey, generateWithClaude } = require('../src/anthropic-backend.cjs');

test('Claude connection checks the model without exposing the API key', async () => {
  let request;
  const result = await testAnthropicKey('test-secret', async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ id: CLAUDE_MODEL }) };
  });
  assert.equal(result.model, CLAUDE_MODEL);
  assert.match(request.url, /\/v1\/models\/claude-haiku-5-5$/);
  assert.equal(request.options.headers.Authorization, 'Bearer test-secret');
  assert.doesNotMatch(JSON.stringify(result), /test-secret/);
});

test('Claude streaming answer records cumulative token usage across split SSE chunks', async () => {
  const events = [
    { type: 'message_start', message: { usage: { input_tokens: 12, cache_read_input_tokens: 3, output_tokens: 1 } } },
    { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Short ' } },
    { type: 'content_block_delta', delta: { type: 'text_delta', text: 'answer.' } },
    { type: 'message_delta', usage: { output_tokens: 6 } },
    { type: 'message_stop' }
  ];
  const payload = events.map(event => `event: ${event.type}\r\ndata: ${JSON.stringify(event)}\r\n\r\n`).join('');
  const chunks = [payload.slice(0, 47), payload.slice(47, 113), payload.slice(113, 190), payload.slice(190)];
  let request;
  const deltas = [];
  const result = await generateWithClaude('Interview question', 'test-secret', undefined, {
    onDelta: text => deltas.push(text),
    fetcher: async (url, options) => {
      request = { url, options };
      return { ok: true, body: new ReadableStream({ start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      } }) };
    }
  });
  assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body).messages, [{ role: 'user', content: 'Interview question' }]);
  assert.deepEqual(deltas, ['Short ', 'Short answer.']);
  assert.deepEqual(result, { text: 'Short answer.', usage: { input_tokens: 15, cached_input_tokens: 3, output_tokens: 6 } });
});

test('Claude errors redact the supplied key', async () => {
  await assert.rejects(
    testAnthropicKey('test-secret', async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid test-secret' } }) })),
    error => error.message === 'Invalid [redacted]'
  );
});

test('an interrupted Claude stream is not recorded as a completed answer', async () => {
  const payload = 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Partial"}}\n\n';
  await assert.rejects(
    generateWithClaude('Question', 'test-secret', undefined, {
      fetcher: async () => ({ ok: true, body: new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode(payload));
        controller.close();
      } }) })
    }),
    /ended before completion/
  );
});

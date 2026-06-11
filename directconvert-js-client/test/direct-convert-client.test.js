import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { DirectConvertClient } from '../src/index.js';

const originalFetch = globalThis.fetch;
const originalLocation = globalThis.location;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

test('default fetch is called with the global object as context', async () => {
  globalThis.fetch = function fetch(input, init) {
    assert.equal(this, globalThis);
    assert.equal(String(input), 'http://localhost:9753/api/channels');
    assert.equal(init.method, 'GET');
    assert.equal(init.headers.Authorization, '');
    return Promise.resolve(new Response('[]'));
  };

  const client = new DirectConvertClient();
  const channels = await client.getChannels();

  assert.deepEqual(channels, []);
});

test('relative base URLs resolve against the browser location', async () => {
  globalThis.location = new URL('http://127.0.0.1:9001/');
  globalThis.fetch = function fetch(input) {
    assert.equal(String(input), 'http://127.0.0.1:9001/dc-api/sources');
    return Promise.resolve(new Response('[]'));
  };

  const client = new DirectConvertClient({ baseUrl: '/dc-api/' });
  const sources = await client.getSources();

  assert.deepEqual(sources, []);
});

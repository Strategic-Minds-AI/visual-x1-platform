import test from 'node:test';
import assert from 'node:assert/strict';
import { loopbackOrigin, runCanary } from './visual-sandbox-canary.mjs';
const sha = 'a'.repeat(40);

test('strict loopback allowlist rejects remote, wrong port, credentials and paths', () => {
  assert.equal(loopbackOrigin('http://127.0.0.1:4311', 4311), 'http://127.0.0.1:4311');
  for (const address of [
    'https://127.0.0.1:4311', 'http://0.0.0.0:4311', 'http://localhost:4311',
    'http://127.0.0.1:11434', 'http://127.0.0.1:4311/admin',
    'http://user:pass@127.0.0.1:4311', 'http://attacker.example:4311'
  ]) assert.throws(() => loopbackOrigin(address, 4311));
});

test('invalid source SHA and remote base reject before any network call', async () => {
  let requests = 0;
  const fetchImpl = async () => { requests++; throw Error('unexpected call'); };
  await assert.rejects(runCanary({ sourceSha: 'not-sha', fetchImpl }));
  await assert.rejects(runCanary({ sourceSha: sha, ollamaOrigin: 'http://example.com:11434', fetchImpl }));
  assert.equal(requests, 0);
});

test('simulated local probes produce three checks without queue writes', async () => {
  const paths = [];
  const fetchImpl = async (url, init) => {
    paths.push([url, init.method || 'GET']);
    const payload = url.endsWith('/health') ? { ok: true, visual_engine: true }
      : url.endsWith('/api/version') ? { version: 'test' }
      : url.endsWith('/api/tags') ? { models: [{ name: 'phi3:latest' }] }
      : { model: 'phi3:latest', response: 'READY', done: true, total_duration: 1234 };
    return { ok: true, json: async () => payload };
  };
  const result = await runCanary({ sourceSha: sha, fetchImpl });
  assert.equal(result.status, 'PASS');
  assert.equal(result.checks.length, 3);
  assert.deepEqual(paths.map(p => p[1]), ['GET', 'GET', 'GET', 'POST']);
  assert(paths.every(([url]) => /127\.0\.0\.1:(4311|11434)\//.test(url)));
});

test('inference missing response never passes', async () => {
  const fetchImpl = async url => ({
    ok: true, json: async () => url.endsWith('/health') ? { ok: true, visual_engine: true }
      : url.endsWith('/api/version') ? { version: 'test' }
      : url.endsWith('/api/tags') ? { models: [{ name: 'phi3:latest' }] }
      : { model: 'phi3:latest', response: '', done: true }
  });
  const result = await runCanary({ sourceSha: sha, fetchImpl });
  assert.equal(result.status, 'FAIL');
  assert.equal(result.checks[2].status, 'FAIL');
});

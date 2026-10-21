// X1 Visual Sandbox: bounded local-only canary. No queue mutation, credentials or scheduler.
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function loopbackOrigin(input, port) {
  const u = new URL(input);
  if (u.protocol !== 'http:' || u.hostname !== '127.0.0.1' ||
      u.port !== String(port) || u.username || u.password ||
      (u.pathname !== '/' && u.pathname !== '') || u.search || u.hash) {
    throw new Error('Endpoint must be the expected uncredentialed loopback origin');
  }
  return u.origin;
}

export async function runCanary({
  controlOrigin = 'http://127.0.0.1:4311',
  ollamaOrigin = 'http://127.0.0.1:11434',
  sourceSha,
  model = 'phi3:latest',
  fetchImpl = fetch,
  timeoutMs = 60000
} = {}) {
  if (!/^[a-f0-9]{40}$/i.test(sourceSha || '')) throw new Error('Exact 40-character source SHA required');
  // Reject remote origins BEFORE issuing a single HTTP request.
  const control = loopbackOrigin(controlOrigin, 4311);
  const ollama = loopbackOrigin(ollamaOrigin, 11434);
  const checks = [];
  const started = Date.now();

  async function call(origin, path, init = {}, limit = 7000) {
    const response = await fetchImpl(origin + path, {
      ...init, signal: AbortSignal.timeout(limit),
      headers: { accept: 'application/json', ...(init.headers || {}) }
    });
    if (!response.ok) throw new Error('Endpoint ' + path + ' returned HTTP ' + response.status);
    return response.json();
  }
  async function check(name, operation) {
    const t = Date.now();
    try {
      const data = await operation();
      checks.push({ name, status: 'PASS', elapsed_ms: Date.now() - t, ...data });
    } catch (error) {
      checks.push({ name, status: 'FAIL', elapsed_ms: Date.now() - t,
        error: String(error?.message || error).slice(0, 180) });
    }
  }
  await check('local_control_plane_health', async () => {
    const data = await call(control, '/health');
    if (data.ok !== true || data.visual_engine !== true) throw new Error('Control plane did not confirm visual engine');
    return { service: 'strategic-minds-local-control-plane', visual_engine: true };
  });
  await check('ollama_version_and_installed_model', async () => {
    const [ver, tags] = await Promise.all([
      call(ollama, '/api/version'),
      call(ollama, '/api/tags')
    ]);
    const installed = (tags.models || []).map(m => m.name).filter(n => typeof n === 'string');
    if (!installed.includes(model)) throw new Error('Required model not installed');
    return { version: String(ver.version || ''), model, installed_model_count: installed.length };
  });
  // Harmless, bounded synthetic inference. Does not send local files or tenant data.
  if (checks.at(-1)?.status === 'PASS') {
    await check('ollama_synthetic_inference', async () => {
      const reply = await call(ollama, '/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model, prompt: 'Reply with exactly READY.', stream: false,
          options: { temperature: 0, num_predict: 8 }
        })
      }, timeoutMs);
      if (reply.model !== model || reply.done !== true || typeof reply.response !== 'string' ||
          !reply.response.trim()) throw new Error('No completed nonempty model reply');
      return { model, completed: true, ready_word: reply.response.trim() === 'READY',
        total_duration_ns: Number.isFinite(reply.total_duration) ? reply.total_duration : null };
    });
  } else {
    checks.push({ name: 'ollama_synthetic_inference', status: 'BLOCKED', reason: 'Model prerequisite failed' });
  }
  return {
    kind: 'X1_VISUAL_SANDBOX_LOCAL_CANARY',
    source_sha: sourceSha,
    environment: 'JARVIS-COMMAND-local-loopback',
    created_at: new Date().toISOString(),
    elapsed_ms: Date.now() - started,
    status: checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL',
    scope: 'local health and synthetic inference ONLY; no staging queue or Guardian certification',
    checks
  };
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  runCanary({ sourceSha: process.argv[2] }).then(receipt => {
    process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
    if (receipt.status !== 'PASS') process.exitCode = 1;
  }).catch(error => {
    process.stderr.write('CANARY_ERROR: ' + String(error?.message || error).slice(0, 180) + '\n');
    process.exitCode = 1;
  });
}

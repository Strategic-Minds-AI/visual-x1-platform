import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The local bridge. Docker and Ollama live on the operator's own machine, and
// nothing hosted can open a socket into that machine — so the worker on that
// machine comes here instead. It pulls one queued job at a time over HTTPS, runs
// it locally against Docker or Ollama, and reports exactly what came back, whether
// that is a result or a failure. One door, two ways in: the worker's bridge token,
// or a signed-in admin so the console and the chat agent can drive the same queue.
const ACTIONS = ['handshake', 'pull', 'report', 'queue'];
const KINDS = ['ollama', 'docker', 'http'];

function tokenMatches(candidate, expected) {
  if (!candidate || !expected || candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'handshake');
    const byAdmin = !!user && user.role === 'admin';
    const byToken = tokenMatches(String(req.headers.get('x-bridge-token') || body.token || ''), process.env.LOCAL_BRIDGE_TOKEN || '');

    if (!byAdmin && !byToken) {
      return Response.json(
        {
          error:
            'Not authorized. The worker sends the LOCAL_BRIDGE_TOKEN value in the x-bridge-token header; the console signs in as an admin.',
        },
        { status: 401 }
      );
    }
    if (!ACTIONS.includes(action)) {
      return Response.json({ error: `action must be one of ${ACTIONS.join(', ')}` }, { status: 400 });
    }

    const service = base44.asServiceRole;
    const worker = String(body.worker_id || '').slice(0, 80) || 'local-worker';

    if (action === 'handshake') {
      const queued = await service.entities.BridgeJob.count({ status: 'queued' });
      const claimed = await service.entities.BridgeJob.count({ status: 'claimed' });
      return Response.json({
        ok: true,
        worker_id: worker,
        via_token: byToken,
        authenticated_as: byAdmin ? user.email : 'bridge-token',
        queued,
        claimed,
      });
    }

    if (action === 'pull') {
      const page = await service.entities.BridgeJob.filter({ status: 'queued' }, { sort: 'created_date', limit: 1 });
      const job = (page.items || [])[0];
      if (!job) return Response.json({ job: null, note: 'The queue is empty.' });
      await service.entities.BridgeJob.update(job.id, {
        status: 'claimed',
        worker_id: worker,
        claimed_at: new Date().toISOString(),
      });
      return Response.json({
        job: {
          id: job.id,
          kind: job.kind,
          title: job.title,
          payload: JSON.parse(job.payload_json || '{}'),
          change_key: job.change_key || '',
        },
      });
    }

    if (action === 'report') {
      const id = String(body.job_id || '').trim();
      if (!id) return Response.json({ error: 'job_id is required' }, { status: 400 });
      const status = body.status === 'failed' ? 'failed' : body.status === 'done' ? 'done' : '';
      if (!status) return Response.json({ error: 'status must be done or failed' }, { status: 400 });

      const job = await service.entities.BridgeJob.get(id).catch(() => null);
      if (!job) return Response.json({ error: 'No bridge job with that id' }, { status: 404 });

      await service.entities.BridgeJob.update(id, {
        status,
        worker_id: worker,
        result_json: body.result ? JSON.stringify(body.result).slice(0, 20000) : '',
        error: String(body.error || '').slice(0, 1000),
        duration_ms: Number(body.duration_ms) || 0,
        completed_at: new Date().toISOString(),
      });
      await service.entities.AuditLog.create({
        entity_type: 'BridgeJob',
        entity_id: id,
        action: status === 'done' ? 'bridge_done' : 'bridge_failed',
        user_email: byAdmin ? user.email : `bridge:${worker}`,
        details: `${job.kind} job "${job.title}" reported ${status} by ${worker}${
          body.error ? ' — ' + String(body.error).slice(0, 300) : ''
        }`,
        severity: status === 'done' ? 'info' : 'warning',
      });
      return Response.json({ ok: true, id, status });
    }

    const title = String(body.title || '').trim();
    if (!title) return Response.json({ error: 'title is required' }, { status: 400 });
    const created = await service.entities.BridgeJob.create({
      title: title.slice(0, 200),
      kind: KINDS.includes(body.kind) ? body.kind : 'ollama',
      payload_json: typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload || {}),
      status: 'queued',
      requested_by: byAdmin ? user.email : `bridge:${worker}`,
      change_key: String(body.change_key || '').slice(0, 80),
    });
    return Response.json({ ok: true, job_id: created.id, status: 'queued' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
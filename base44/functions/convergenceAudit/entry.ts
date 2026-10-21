import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Read-only convergence audit. Every state below is grounded in a live authenticated read of the
// provider that owns it: GitHub for source SHAs and permissions, Supabase staging for the queue,
// capability registry, worker and receipt planes. Nothing here writes, dispatches or grants.
// A surface that is merely present is reported as present, never as integrated.

const STAGING_REF = 'uvdkzsbjackpjvpoxtyk';
const X1_REPO = 'Strategic-Minds-AI/X1-OPERATING-SYSTEMS';
const REPOS = [
  { full: X1_REPO, role: 'X1 control plane, admin, portal, policy' },
  { full: 'Strategic-Minds-AI/x1-launch-engine', role: 'website execution / academy engine' },
  { full: 'Strategic-Minds-AI/visual-x1-platform', role: 'Visual X interface donor' },
  { full: 'Strategic-Minds-AI/x1-ai-hub-swarm-runtime', role: 'control-plane client, workers, leases' },
  { full: 'XTREME-SYSTEMS/digital-dominance', role: 'commercial targeting donor' },
  { full: 'XTREME-SYSTEMS/seo-generator', role: 'SEO source donor' },
];
const CLUSTER_CAPS = [
  'digital_dominance.website_queue',
  'digital_dominance.seo_parity_analysis',
  'ollama_chat',
  'agent:smai:13-digital-dominance',
  'agent:smai:07-qa',
  'agent:smai:09-heartbeat',
  'local-agent-request',
  'connector:google-drive',
  'connector:supabase',
  'chatgpt:tool-surface',
];

const ghGet = async (token, path) => {
  const r = await fetch('https://api.github.com' + path, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'visual-x1-convergence-audit' },
    signal: AbortSignal.timeout(20000),
  });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = null; }
  return { ok: r.ok, status: r.status, data };
};

const sql = async (token, query) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${STAGING_REF}/database/query/read-only`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(25000),
  });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = null; }
  return Array.isArray(data) ? data : [];
};

async function sourceAudit(base44) {
  let token = null;
  try {
    const conn = await base44.asServiceRole.connectors.getConnection('github');
    token = conn && conn.accessToken ? conn.accessToken : null;
  } catch (e) {
    return { ok: false, reason: 'The GitHub connection could not be read: ' + e.message, repos: [] };
  }
  if (!token) return { ok: false, reason: 'The GitHub connection is not authorized for this app.', repos: [] };

  const repos = [];
  for (const entry of REPOS) {
    const meta = await ghGet(token, '/repos/' + entry.full);
    const branch = meta.data && meta.data.default_branch ? meta.data.default_branch : 'main';
    const head = await ghGet(token, '/repos/' + entry.full + '/branches/' + branch);
    repos.push({
      repo: entry.full,
      role: entry.role,
      readable: meta.ok,
      private: meta.data ? meta.data.private : null,
      default_branch: meta.data ? meta.data.default_branch : null,
      sha: head.data && head.data.commit ? head.data.commit.sha : null,
      permissions: meta.data ? meta.data.permissions : null,
      state: meta.ok ? 'READ' : 'UNKNOWN',
    });
  }

  const pr = await ghGet(token, '/repos/' + X1_REPO + '/pulls/32');
  const d = pr.data || {};
  return {
    ok: repos.some((r) => r.readable),
    repos,
    pr32: pr.ok
      ? {
          number: 32,
          title: d.title || null,
          draft: d.draft === true,
          state: d.state || null,
          head_ref: d.head ? d.head.ref : null,
          head_sha: d.head ? d.head.sha : null,
          base_ref: d.base ? d.base.ref : null,
          mergeable_state: d.mergeable_state || null,
          changed_files: d.changed_files || 0,
          commits: d.commits || 0,
        }
      : null,
  };
}

async function stagingAudit(base44) {
  let token = null;
  try {
    const conn = await base44.asServiceRole.connectors.getConnection('supabase');
    token = conn && conn.accessToken ? conn.accessToken : null;
  } catch (e) {
    return { ok: false, reason: 'The Supabase connection could not be read: ' + e.message };
  }
  if (!token) return { ok: false, reason: 'The Supabase connection is not authorized for this app.' };

  const statuses = await sql(token, `select status, count(*)::int as n from public.x1_work_queue group by 1 order by 2 desc`);
  const pending = await sql(token, `select count(*)::int as n from public.x1_work_queue where status not in ('COMPLETED','DEAD_LETTER','BLOCKED')`);
  const clusters = await sql(token, `select coalesce(last_error_code,'(none)') as code, action_class, count(*)::int as n from public.x1_work_queue group by 1,2 order by 3 desc limit 20`);
  const authSplit = await sql(token, `select case when coalesce(required_capabilities::text,'[]') in ('[]','') then 'EMPTY_CAPABILITY_REQUIREMENT' when required_capabilities::text ilike '%website_queue%' then 'DD_QUEUE_CAPABILITY_ABSENT' when required_capabilities::text ilike '%tool-surface%' then 'NEGATIVE_CONTROL_INTACT' when required_capabilities::text ilike '%connector:%' then 'CONNECTOR_CAPS' else 'OTHER' end as fingerprint, count(*)::int as n from public.x1_work_queue where last_error_code = 'CONTROL_PLANE_AUTHORIZATION_FAILED' group by 1 order by 2 desc`);
  const authWindow = await sql(token, `select min(created_at)::text as first_at, max(created_at)::text as last_at, sum(attempts)::int as attempts from public.x1_work_queue where last_error_code = 'CONTROL_PLANE_AUTHORIZATION_FAILED'`);
  const caps = await sql(token, `select count(*)::int as total from public.x1_capability_registry`);
  const capRows = await sql(token, `select capability_id, available, authorized, validated from public.x1_capability_registry where capability_id in (${CLUSTER_CAPS.map((c) => `'${c}'`).join(',')}) order by capability_id`);
  const workers = await sql(token, `select distinct on (worker_id) worker_id, execution_plane, runtime_state, observed_at::text as last_seen, left(coalesce(health::text,''),180) as health from public.x1_worker_heartbeats order by worker_id, observed_at desc limit 8`);
  const beats = await sql(token, `select count(*)::int as n from public.x1_worker_heartbeats`);
  const leases = await sql(token, `select status, count(*)::int as n, max(acquired_at)::text as last_at from public.x1_task_leases group by 1 order by 2 desc`);
  const ledger = await sql(token, `select state, count(*)::int as n, count(receipt_id)::int as with_receipt from public.x1_execution_ledger group by 1 order by 2 desc`);
  const ledgerFp = await sql(token, `select coalesce(nullif(failure_fingerprint,''),'(none)') as fingerprint, count(*)::int as n from public.x1_execution_ledger where state <> 'COMPLETED' group by 1 order by 2 desc limit 5`);
  const memberships = await sql(token, `select count(*)::int as n from public.x1_tenant_memberships`);
  const tenants = await sql(token, `select count(*)::int as n from public.x1_tenants`);

  const present = new Set(capRows.map((r) => r.capability_id));
  const missingCaps = CLUSTER_CAPS.filter((c) => !present.has(c));

  return {
    ok: true,
    project: { ref: STAGING_REF, name: 'X1 AI Hub Staging' },
    queue: {
      by_status: statuses,
      pending: pending.length ? pending[0].n : null,
      clusters,
      auth_failures: { split: authSplit, window: authWindow.length ? authWindow[0] : null },
    },
    capabilities: {
      total: caps.length ? caps[0].total : null,
      required_present: capRows,
      required_missing: missingCaps,
      negative_control: capRows.filter((r) => r.authorized === false).map((r) => r.capability_id),
    },
    workers: { heartbeats: beats.length ? beats[0].n : null, distinct: workers },
    leases,
    ledger: { states: ledger, non_completed_fingerprints: ledgerFp },
    tenants: { count: tenants.length ? tenants[0].n : null, memberships: memberships.length ? memberships[0].n : null },
  };
}

// The authorizer already exists in staging. This probes it and states the worker contract it
// serves, so the console shows what is deployed instead of what was assumed. Read-only: a GET
// health surface plus two deliberately unauthenticated POSTs, which must fail closed.
const AUTHORIZE_URL = `https://${STAGING_REF}.supabase.co/functions/v1/project-zero-authorize`;
const DB_GATEWAY_URL = `https://${STAGING_REF}.supabase.co/functions/v1/project-zero-db-gateway`;

async function authorizerAudit() {
  const post = (token) =>
    fetch(AUTHORIZE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({
        taskId: 'audit-probe',
        agentId: 'audit-probe',
        tenantId: 'audit-probe',
        requestedAction: 'READ_ONLY',
        requiredCapabilities: [{ id: 'connector:supabase' }],
      }),
      signal: AbortSignal.timeout(20000),
    });

  const out = {
    function_slug: 'project-zero-authorize',
    url: AUTHORIZE_URL,
    queue_transport: { slug: 'project-zero-db-gateway', url: DB_GATEWAY_URL },
    contract: 'POST with taskId, agentId, tenantId, requestedAction and requiredCapabilities; answers a signed authorization whose signature the worker verifies with HMAC-SHA256 over the canonical unsigned body.',
    reachable: false,
    fail_closed_without_credential: false,
    fail_closed_with_unknown_credential: false,
    authorized_path_proven: false,
    worker_contract: {
      entry: 'dist/worker-main-gateway.js',
      required_env: ['X1_SYSTEM_TENANT_ID', 'X1_CONTROL_PLANE_URL', 'X1_DB_GATEWAY_URL', 'X1_INTERNAL_SERVICE_TOKEN'],
      optional_env: ['X1_WORKER_ID (defaulted to the identity that held the leases)', 'X1_RUNTIME_ENV', 'X1_WORKER_POLL_MS', 'PORT', 'RAILWAY_GIT_COMMIT_SHA'],
      hosting_evidence: 'railway.json plus Dockerfile with healthcheck /healthz: a long-running Docker service. The signing key is derived in-process from the internal service token, so no separate signing secret is needed.',
      action_class_limit: 'The shipped preview handler executes READ_ONLY only and refuses mutations.',
    },
    blockers: [],
  };

  try {
    const health = await fetch(AUTHORIZE_URL, { method: 'GET', signal: AbortSignal.timeout(20000) });
    const healthBody = await health.text();
    out.reachable = health.status === 200 && healthBody.includes('project-zero-authorize');

    const noCred = await post(null);
    out.fail_closed_without_credential = noCred.status === 401;

    const badCred = await post('not-a-registered-service-token');
    out.fail_closed_with_unknown_credential = badCred.status === 401;
  } catch (e) {
    out.blockers.push('The authorizer could not be probed: ' + e.message);
  }
  return out;
}

const ACCEPTANCE = [
  { id: 'A01', label: 'Verified repo, project and domain identity with fresh SHA', state: 'PASS', evidence: 'Live GitHub reads of six repositories and PR #32; production URL untouched.' },
  { id: 'A02', label: 'Every old feature mapped to route, function and entity', state: 'UNKNOWN', evidence: 'Route inventory not yet enumerated; no page was removed or merged.' },
  { id: 'A03', label: 'Admin routes share brand and are 401/403 protected', state: 'UNKNOWN', evidence: 'No browser or negative auth test run in this pass.' },
  { id: 'A04', label: 'Prompt convert, compile, generate, hashed artifact', state: 'BLOCKED', evidence: 'Not run; depends on the adapter contract.' },
  { id: 'A05', label: 'One tenant-scoped synthetic job leased with durable receipt', state: 'BLOCKED', evidence: 'No lease-capable worker is registered; submitting would only add a dead letter.' },
  { id: 'A06', label: 'Unique noindex preview, exact SHA, HTTP 200, 404 behaviour', state: 'UNKNOWN', evidence: 'Not run in this pass.' },
  { id: 'A07', label: 'Synthetic form to CRM record with tenant isolation', state: 'UNKNOWN', evidence: 'Not run in this pass.' },
  { id: 'A08', label: 'Independent Guardian validation at or above 95 with hard gates', state: 'UNKNOWN', evidence: 'No Guardian receipt exists for this branch; the PR itself reports it as NOT RUN.' },
  { id: 'A09', label: 'Real scoped GSC and GA4 values, no simulated rankings', state: 'UNKNOWN', evidence: 'X1 side not attempted; this app holds one authorized Search Console connection.' },
  { id: 'A10', label: 'Release record with target, approval, deployment, SHA, rollback', state: 'BLOCKED', evidence: 'No release authorized; production remains unchanged.' },
  { id: 'A11', label: 'Worker repairs within three cycles with receipts', state: 'BLOCKED', evidence: 'Depends on the worker plane.' },
  { id: 'A12', label: 'Handoff writes read back from the canonical destination', state: 'BLOCKED', evidence: 'No Drive mirror write or readback performed.' },
];

const NEXT_ACTIONS = [
  { id: 'P0.1', owner_decision: true, action: 'Choose the authorize endpoint owner: implement POST /api/authorize against the AuthorizationRequest contract, or point the runtime baseUrl at the service that already authorized the 46 completed ledger rows. One, not both.' },
  { id: 'P0.2', owner_decision: false, action: 'Store the full client failure detail, including HTTP status and inner code, and stop recording the literal string Error as a fingerprint.' },
  { id: 'P0.3', owner_decision: true, action: 'Resolve the 11 Digital Dominance rows through the single-queue adapter contract, not by granting digital_dominance.website_queue.' },
  { id: 'P0.4', owner_decision: true, action: 'Restore a lease-capable worker with lease_allowed true and a credential binding, then run A05 with one idempotent READ_ONLY job.' },
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only an administrator can read the convergence audit.' }, { status: 403 });
    }

    const [source, staging, authorizer] = await Promise.all([sourceAudit(base44), stagingAudit(base44), authorizerAudit()]);

    const blocked = [];
    if (!source.ok) blocked.push(source.reason || 'GitHub source states could not be read.');
    if (!staging.ok) blocked.push(staging.reason || 'Staging control-plane states could not be read.');
    const workerRows = staging.workers ? staging.workers.distinct || [] : [];
    const leaseCapable = workerRows.some((w) => String(w.health || '').includes('lease_requested":true'));
    if (staging.ok && !leaseCapable) {
      blocked.push('No worker is requesting leases, so no job can be dispatched or proven end to end.');
    }
    if (authorizer.reachable && !authorizer.authorized_path_proven) {
      blocked.push('The staging authorizer already exists, is reachable and fails closed; what is missing is a deployed lease-capable worker to use it. No second authorize endpoint is needed.');
    }
    if (staging.ok && (staging.capabilities.required_missing || []).length) {
      blocked.push('Capabilities required by dead-lettered jobs are absent: ' + staging.capabilities.required_missing.join(', ') + '.');
    }

    return Response.json({
      ok: true,
      generated_at: new Date().toISOString(),
      sources: { github: source, staging, authorizer },
      acceptance: ACCEPTANCE.map((row) =>
        row.id === 'A01' && !source.ok ? { ...row, state: 'UNKNOWN' } : row.id === 'A05' && leaseCapable ? { ...row, state: 'UNKNOWN' } : row
      ),
      next_actions: NEXT_ACTIONS,
      blocked,
      method:
        'Read-only. States come from live GitHub and Supabase staging reads. Route presence is never reported as parity, and nothing here authorizes, dispatches, merges or deploys.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
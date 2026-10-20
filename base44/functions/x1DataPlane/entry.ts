import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// A read-only window into X1's Supabase data plane, through the Supabase Management API.
//
// X1's own server talks to PostgREST with the project's service_role key. That key bypasses
// RLS for every tenant, so it is deliberately never fetched and never used here: this
// function only calls the read-only SQL endpoint, and only with SQL that is defined below —
// never with SQL supplied by the caller.
//
// `select` only. There is no insert, update, delete or DDL path in this function.

const API_BASE = 'https://api.supabase.com/v1';
const X1_DOCUMENTED_REF = 'uvdkzsbjackpjvpoxtyk'; // X1's staging project, named in X1's own docs
const X1_TABLES = [
  'x1_tenants',
  'x1_tenant_memberships',
  'x1_work_queue',
  'x1_prompt_assets',
  'x1_prompt_runs',
  'x1_intelligence_ingest',
  'x1_admin_chat_turns',
  'apex_output_events'
];
const X1_ROUTINES = ['x1_worker_status_summary', 'x1_enqueue_work'];
const SCOPES = ['projects', 'probe', 'inventory'];

const headers = (token) => ({ authorization: `Bearer ${token}`, 'content-type': 'application/json' });

const readSql = async (token, ref, query) => {
  const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(ref)}/database/query/read-only`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(20000)
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray(parsed.result)
      ? parsed.result
      : parsed && Array.isArray(parsed.rows)
        ? parsed.rows
        : parsed && Array.isArray(parsed.data)
          ? parsed.data
          : [];
  return {
    status: res.status,
    rows,
    shape: parsed && !Array.isArray(parsed) ? Object.keys(parsed) : 'array',
    preview: res.ok && rows.length === 0 ? text.slice(0, 300) : res.ok ? undefined : text.slice(0, 300)
  };
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
    const scope = SCOPES.includes(payload.scope) ? payload.scope : 'projects';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    if (!accessToken) return Response.json({ error: 'Supabase is not connected.' }, { status: 400 });

    const listRes = await fetch(`${API_BASE}/projects`, { headers: headers(accessToken), signal: AbortSignal.timeout(15000) });
    const listText = await listRes.text();
    let listData = null;
    try {
      listData = JSON.parse(listText);
    } catch {
      listData = null;
    }
    const projects = Array.isArray(listData)
      ? listData.map((p) => ({ ref: p.ref, name: p.name, region: p.region, status: p.status, created_at: p.created_at }))
      : [];

    if (scope === 'projects') {
      return Response.json({
        ok: listRes.ok,
        read_at: new Date().toISOString(),
        project_list_status: listRes.status,
        projects,
        x1_documented_ref: X1_DOCUMENTED_REF,
        x1_ref_present: projects.some((p) => p.ref === X1_DOCUMENTED_REF),
        note: listRes.ok ? undefined : listText.slice(0, 300)
      });
    }

    const ref = X1_DOCUMENTED_REF;

    if (scope === 'probe') {
      const probe = await readSql(accessToken, ref, 'select 1 as ok');
      return Response.json({
        ok: probe.status === 200 || probe.status === 201,
        ref,
        probe_status: probe.status,
        response_shape: probe.shape,
        rows: probe.rows,
        preview: probe.preview
      });
    }

    const tables = await readSql(
      accessToken,
      ref,
      "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name"
    );
    const names = tables.rows.map((r) => r.table_name).filter(Boolean);
    const present = X1_TABLES.filter((t) => names.includes(t));

    const counts = present.length
      ? await readSql(
          accessToken,
          ref,
          present.map((t) => `select '${t}' as table_name, count(*)::int8 as exact_rows from public."${t}"`).join(' union all ')
        )
      : { status: 0, rows: [] };

    const policies = await readSql(
      accessToken,
      ref,
      "select tablename, policyname, cmd, roles::text as roles from pg_policies where schemaname='public' order by tablename, policyname"
    );
    const routines = await readSql(
      accessToken,
      ref,
      `select routine_name from information_schema.routines where routine_schema='public' and routine_name in (${X1_ROUTINES.map((r) => `'${r}'`).join(',')}) order by routine_name`
    );

    const steps = { tables, counts, policies, routines };

    return Response.json({
      ok: true,
      read_at: new Date().toISOString(),
      ref,
      access: 'Read-only SQL through the Supabase Management API. The service_role key was not requested and is not used.',
      table_count: names.length,
      tables: names,
      x1_tables_present: present,
      x1_tables_missing: X1_TABLES.filter((t) => !present.includes(t)),
      exact_row_counts: counts.rows,
      policies: policies.rows,
      x1_routines_present: routines.rows.map((r) => r.routine_name),
      step_status: { tables: tables.status, counts: counts.status, policies: policies.status, routines: routines.status },
      errors: Object.entries(steps)
        .filter(([, s]) => s.status >= 400)
        .map(([name, s]) => ({ step: name, status: s.status, preview: s.preview }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
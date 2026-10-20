import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// A read-only window into X1's Supabase data planes, through the Supabase Management API.
//
// X1's own server talks to PostgREST with the project's service_role key. That key bypasses
// RLS for every tenant, so it is deliberately never fetched and never used here: this
// function only calls the read-only SQL endpoint, and only with SQL defined below — never
// with SQL supplied by the caller.
//
// `select` only. There is no insert, update, delete or DDL path in this function.

const API_BASE = 'https://api.supabase.com/v1';

const TARGETS = {
  stage: { label: 'X1 AI Hub Staging', name: /^X1 AI Hub Staging$/i, fallback_ref: 'uvdkzsbjackpjvpoxtyk' },
  production: { label: 'X1 AI Hub', name: /^X1 AI Hub$/i, fallback_ref: 'vgsmyhqqtkkluhypxyua' }
};

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
const SCOPES = ['projects', 'inventory'];

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
  const rows = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.result) ? parsed.result : [];
  return { ok: res.ok, status: res.status, rows, preview: res.ok ? undefined : text.slice(0, 200) };
};

const inventoryFor = async (token, ref) => {
  const tables = await readSql(
    token,
    ref,
    "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name"
  );
  if (!tables.ok) return { ref, error: `Table listing failed (${tables.status})`, preview: tables.preview };

  const names = tables.rows.map((r) => r.table_name).filter(Boolean);
  const present = X1_TABLES.filter((t) => names.includes(t));

  const [counts, policies, policyCount, routines] = await Promise.allSettled([
    present.length
      ? readSql(
          token,
          ref,
          present.map((t) => `select '${t}' as table_name, count(*)::int8 as exact_rows from public."${t}"`).join(' union all ')
        )
      : Promise.resolve({ ok: true, status: 200, rows: [] }),
    readSql(
      token,
      ref,
      `select tablename, policyname, cmd from pg_policies where schemaname='public' and tablename in (${X1_TABLES.map((t) => `'${t}'`).join(',')}) order by tablename, policyname`
    ),
    readSql(token, ref, "select count(*)::int8 as policy_count from pg_policies where schemaname='public'"),
    readSql(
      token,
      ref,
      `select routine_name from information_schema.routines where routine_schema='public' and routine_name in (${X1_ROUTINES.map((r) => `'${r}'`).join(',')}) order by routine_name`
    )
  ]);

  const val = (s) => (s.status === 'fulfilled' ? s.value : { ok: false, status: 0, rows: [], preview: String(s.reason).slice(0, 200) });

  return {
    ref,
    table_count: names.length,
    tables: names,
    x1_tables_present: present,
    x1_tables_missing: X1_TABLES.filter((t) => !present.includes(t)),
    exact_row_counts: val(counts).rows,
    x1_table_policies: val(policies).rows,
    policy_count: val(policyCount).rows[0]?.policy_count ?? null,
    x1_routines_present: val(routines).rows.map((r) => r.routine_name),
    unreadable: [counts, policies, policyCount, routines]
      .map((s, i) => (s.status === 'fulfilled' && s.value.ok ? null : ['counts', 'policies', 'policy_count', 'routines'][i]))
      .filter(Boolean)
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

    const resolve = (key) => {
      const target = TARGETS[key];
      const byName = projects.find((p) => target.name.test((p.name || '').trim()));
      if (byName) return { ref: byName.ref, name: byName.name, resolved_by: 'name' };
      const byRef = projects.find((p) => p.ref === target.fallback_ref);
      if (byRef) return { ref: byRef.ref, name: byRef.name, resolved_by: 'documented ref' };
      return null;
    };

    if (scope === 'projects') {
      return Response.json({
        ok: listRes.ok,
        read_at: new Date().toISOString(),
        project_list_status: listRes.status,
        projects: projects.map((p) => ({
          ...p,
          plane: Object.keys(TARGETS).find((k) => TARGETS[k].name.test((p.name || '').trim())) || null
        })),
        note: listRes.ok ? undefined : listText.slice(0, 300)
      });
    }

    const planes = {};
    for (const key of Object.keys(TARGETS)) {
      const found = resolve(key);
      planes[key] = found
        ? { label: TARGETS[key].label, ...found, ...(await inventoryFor(accessToken, found.ref)) }
        : { label: TARGETS[key].label, error: 'No matching project in this Supabase account.' };
    }

    return Response.json({
      ok: true,
      read_at: new Date().toISOString(),
      access: 'Read-only SQL through the Supabase Management API. The service_role key was not requested and is not used.',
      planes
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The data plane, read through the Supabase Management API with the connected
// account. Two jobs only: what projects exist, and what each of them actually
// holds - the table list, read live from that project's own catalog. Nothing is
// reported as aligned because it was configured that way; alignment is the
// comparison of the two catalogs as they answer right now.

const API = 'https://api.supabase.com/v1';

async function readToken(base44) {
  try {
    const connection = await base44.asServiceRole.connectors.getConnection('supabase');
    return connection?.accessToken || '';
  } catch {
    return '';
  }
}

async function api(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(25000)
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text.slice(0, 400) };
  }
  if (!res.ok) {
    const message = data?.message || data?.error || `Supabase answered HTTP ${res.status}.`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

function rowsOf(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

// One read-only query per environment, against that environment's own catalog.
async function readCatalog(ref, token) {
  try {
    const data = await api(`/projects/${encodeURIComponent(ref)}/database/query/read-only`, {
      token,
      method: 'POST',
      body: {
        query:
          "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name"
      }
    });
    const tables = rowsOf(data)
      .map((r) => r.table_name)
      .filter(Boolean);
    return { ref, ok: true, tables, table_count: tables.length, error: null };
  } catch (error) {
    return { ref, ok: false, tables: [], table_count: 0, error: error.message };
  }
}

function projectSummary(p) {
  return {
    ref: p.ref,
    name: p.name,
    region: p.region || '',
    status: p.status || 'UNKNOWN',
    created: p.created_at || null,
    organization_id: p.organization_id || ''
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'projects');

    const token = await readToken(base44);
    if (!token) {
      return Response.json({
        ok: false,
        error: 'No Supabase account is connected to this app. Connect Supabase under Settings → Integrations, then try again.'
      });
    }

    const data = await api('/projects', { token });
    const all = Array.isArray(data) ? data : data?.projects || [];
    const projects = all.map(projectSummary);

    if (action === 'projects') {
      return Response.json({
        ok: true,
        count: projects.length,
        projects,
        method: 'Read from the Supabase Management API with the connected account.'
      });
    }

    if (action === 'overview') {
      // Which environments to read: the refs the operator has pointed at, in the
      // order asked for (staging first, then production), never the whole account.
      const refs = Array.from(
        new Set((Array.isArray(body.refs) ? body.refs : []).map((r) => String(r || '').trim()).filter(Boolean))
      ).slice(0, 8);

      const known = new Map(projects.map((p) => [p.ref, p]));
      const catalogs = await Promise.allSettled(refs.map((ref) => readCatalog(ref, token)));

      const environments = refs.map((ref, i) => {
        const settled = catalogs[i];
        const catalog = settled.status === 'fulfilled' ? settled.value : { ref, ok: false, tables: [], table_count: 0, error: 'That environment could not be read.' };
        const project = known.get(ref) || null;
        return {
          ...catalog,
          known: Boolean(project),
          name: project?.name || '',
          status: project?.status || (project ? 'UNKNOWN' : 'not_in_account'),
          region: project?.region || ''
        };
      });

      return Response.json({
        ok: true,
        count: projects.length,
        projects,
        environments,
        method: 'Project list and each environment\'s catalog, read live from Supabase.'
      });
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error.message,
      status_code: error.status || null,
      hint: /401|403/.test(String(error.status || ''))
        ? 'Supabase refused the connection. Reconnect it under Settings → Integrations with access to projects and the database.'
        : undefined
    }, { status: 200 });
  }
}
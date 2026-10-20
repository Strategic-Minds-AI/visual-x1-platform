import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The GitHub side of the editor's repository menu: the connected account, the
// repositories on it, and creating a new one. Every answer is what GitHub actually
// returned for that account — nothing is inferred from a button press. Opening a
// repository in the editor is the editor's own capture pipeline, not this function.

const API = 'https://api.github.com';

async function readToken(base44) {
  try {
    const connection = await base44.asServiceRole.connectors.getConnection('github');
    return connection?.accessToken || '';
  } catch {
    return '';
  }
}

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'visual-x-operator-console'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000)
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) throw new Error(data?.message || `GitHub answered HTTP ${res.status}.`);
  return data;
}

function repoSummary(r) {
  return {
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    private: Boolean(r.private),
    description: r.description || '',
    url: r.html_url,
    branch: r.default_branch || '',
    language: r.language || '',
    updated: r.updated_at || null
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');

    const token = await readToken(base44);
    if (!token) {
      return Response.json({
        ok: false,
        error: 'No GitHub account is connected to this app. Connect GitHub under Settings → Integrations, then reopen this menu.'
      });
    }

    if (action === 'status') {
      const me = await call('/user', { token });
      return Response.json({
        ok: true,
        account: { login: me.login, name: me.name || '', url: me.html_url, repos: me.public_repos || 0 },
        method: 'Read from GitHub with the connected account. Repository access is whatever that account can see.'
      });
    }

    if (action === 'list_repos') {
      const data = await call('/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member', { token });
      const repos = Array.isArray(data) ? data.map(repoSummary) : [];
      return Response.json({ ok: true, count: repos.length, repos: repos.slice(0, 60) });
    }

    if (action === 'create_repo') {
      const name = String(body.name || '')
        .trim()
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (name.length < 2) {
        return Response.json({ ok: false, error: 'A repository name of at least two characters is required.' });
      }
      const created = await call('/user/repos', {
        method: 'POST',
        token,
        body: {
          name,
          private: Boolean(body.private),
          auto_init: true,
          description: String(body.description || 'Created from the Visual X editor').slice(0, 200)
        }
      });
      return Response.json({ ok: true, repo: repoSummary(created), created: true });
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Every action here calls the real Vercel API with the token the operator stored as
// VERCEL_TOKEN. Nothing is reported as done because a button was pressed: the state
// returned is whatever Vercel answered.

const API = 'https://api.vercel.com';

async function call(path, { method = 'GET', body, team, query } = {}) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('No Vercel token is stored for this app yet. Add VERCEL_TOKEN in the app dashboard under Secrets, then try again.');
  }
  const url = new URL(`${API}${path}`);
  if (team) url.searchParams.set('teamId', String(team));
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
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
    data = { message: text.slice(0, 500) };
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.message || `Vercel answered HTTP ${res.status}.`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

function hostOf(project) {
  const first = (arr) => (arr || []).map((a) => (typeof a === 'string' ? a : a?.domain)).filter(Boolean)[0];
  return first(project.alias) || first(project.targets?.production?.alias) || project.latestDeployments?.[0]?.url || '';
}

function commitOf(meta) {
  const m = meta || {};
  const sha = m.githubCommitSha || m.gitCommitSha || '';
  const message = m.githubCommitMessage || m.gitCommitMessage || '';
  if (!sha && !message) return null;
  return {
    sha: sha.slice(0, 7),
    full_sha: sha,
    ref: m.githubCommitRef || m.gitCommitRef || '',
    message: String(message).split('\n')[0].slice(0, 220),
    author: m.githubCommitAuthorLogin || m.githubCommitAuthorName || m.gitCommitAuthorName || ''
  };
}

function deploymentSummary(d) {
  return {
    id: d.id,
    url: d.url ? `https://${d.url}` : '',
    state: d.readyState || d.state || 'UNKNOWN',
    target: d.target || 'preview',
    created: d.createdAt || d.created || null,
    inspector: d.inspectorUrl || '',
    commit: commitOf(d.meta)
  };
}

function projectSummary(p) {
  const host = hostOf(p);
  return {
    id: p.id,
    name: p.name,
    framework: p.framework || null,
    url: host ? `https://${host}` : '',
    updated: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    git: p.link
      ? { type: p.link.type || '', org: p.link.org || '', repo: p.link.repo || '', branch: p.link.productionBranch || '', repo_id: p.link.repoId || '' }
      : null,
    live: (p.latestDeployments || [])[0] ? deploymentSummary((p.latestDeployments || [])[0]) : null
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = String(body.action || 'status');

    // Reading is open to any operator; changing where a project deploys from, or
    // which environment a variable belongs to, is an admin action.
    const WRITE_ACTIONS = ['link_repo', 'env_set', 'env_remove'];
    if (WRITE_ACTIONS.includes(action) && user.role !== 'admin') {
      return Response.json(
        { ok: false, error: 'Only an admin can change a project’s repository link or its environment variables.' },
        { status: 403 }
      );
    }

    const team = String(body.team || '').trim();
    const projectRef = String(body.project || '').trim();

    if (action === 'status') {
      const me = await call('/v2/user', { team });
      let teams = [];
      try {
        const t = await call('/v2/teams', {});
        teams = (t.teams || []).map((x) => ({ id: x.id, slug: x.slug, name: x.name }));
      } catch {
        teams = [];
      }
      return Response.json({
        ok: true,
        account: {
          id: me.user?.id || '',
          username: me.user?.username || '',
          name: me.user?.name || '',
          email: me.user?.email || ''
        },
        teams,
        team_in_use: team || null,
        method: 'Read from Vercel with the stored token. Scopes are set by the token itself, not by this app.'
      });
    }

    if (action === 'list_projects') {
      const search = String(body.search || '').trim();
      const data = await call('/v9/projects', { team, query: { limit: 100, search: search || undefined } });
      const projects = (data.projects || []).map(projectSummary);
      return Response.json({ ok: true, count: projects.length, projects, search: search || null });
    }

    if (action === 'project') {
      if (!projectRef) return Response.json({ ok: false, error: 'Which project?' }, { status: 400 });
      const p = await call(`/v9/projects/${encodeURIComponent(projectRef)}`, { team });
      const d = await call('/v6/deployments', { team, query: { projectId: p.id, limit: 10 } });
      return Response.json({
        ok: true,
        project: projectSummary(p),
        deployments: (d.deployments || []).map(deploymentSummary)
      });
    }

    if (action === 'create_project') {
      const name = String(body.name || '').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
      if (name.length < 3) return Response.json({ ok: false, error: 'A project name of at least three characters is required.' }, { status: 400 });
      const payload = { name };
      if (body.framework) payload.framework = String(body.framework);
      const p = await call('/v11/projects', { method: 'POST', body: payload, team });
      return Response.json({ ok: true, project: projectSummary(p), created: true });
    }

    if (action === 'deploy') {
      if (!projectRef) return Response.json({ ok: false, error: 'Which project should be deployed?' }, { status: 400 });
      const p = await call(`/v9/projects/${encodeURIComponent(projectRef)}`, { team });
      const ref = String(body.ref || '').trim();
      let payload;

      if (ref && p.link && p.link.repoId) {
        payload = { name: p.name, gitSource: { type: p.link.type || 'github', repoId: p.link.repoId, ref } };
      } else {
        const list = await call('/v6/deployments', { team, query: { projectId: p.id, limit: 1 } });
        const latest = (list.deployments || [])[0];
        if (!latest) {
          return Response.json({
            ok: false,
            error: ref
              ? 'This project is not linked to a repository in Vercel, so a branch cannot be deployed. Connect the repository in Vercel first, or deploy without a branch.'
              : 'This project has no deployment yet. Connect its repository in Vercel first so there is something to build.'
          }, { status: 200 });
        }
        payload = { name: p.name, deploymentId: latest.id };
      }

      const d = await call('/v13/deployments', { method: 'POST', body: payload, team });
      return Response.json({
        ok: true,
        deployment: deploymentSummary(d),
        mode: payload.gitSource ? 'from_branch' : 'redeploy_latest',
        requested_ref: ref || null
      });
    }

    if (action === 'deployment') {
      const id = String(body.deployment_id || '').trim();
      if (!id) return Response.json({ ok: false, error: 'Which deployment?' }, { status: 400 });
      const d = await call(`/v13/deployments/${encodeURIComponent(id)}`, { team });
      return Response.json({ ok: true, deployment: deploymentSummary(d) });
    }

    if (action === 'rollback') {
      if (!projectRef) return Response.json({ ok: false, error: 'Which project should be rolled back?' }, { status: 400 });
      const p = await call(`/v9/projects/${encodeURIComponent(projectRef)}`, { team });
      const d = await call('/v6/deployments', { team, query: { projectId: p.id, limit: 10 } });
      const list = d.deployments || [];
      const requested = String(body.deployment_id || '').trim();
      const targetId = requested || (list[1] ? list[1].id : '');
      if (!targetId) {
        return Response.json({
          ok: false,
          error: 'This project has no earlier deployment to roll back to. Vercel only lists deployments it still holds.'
        }, { status: 200 });
      }
      const answer = await call(`/v9/projects/${encodeURIComponent(p.id)}/rollback/${encodeURIComponent(targetId)}`, { method: 'POST', team });
      const target = list.find((x) => x.id === targetId) || { id: targetId };
      return Response.json({
        ok: true,
        project: projectSummary(p),
        rolled_back_to: deploymentSummary(target),
        answer: answer && answer.job ? 'Vercel accepted the rollback and is applying it.' : 'Vercel answered the rollback request.'
      });
    }

    if (action === 'domains') {
      if (!projectRef) return Response.json({ ok: false, error: 'Which project?' }, { status: 400 });
      const p = await call(`/v9/projects/${encodeURIComponent(projectRef)}`, { team });
      const d = await call(`/v9/projects/${encodeURIComponent(p.id)}/domains`, { team, query: { limit: 50 } });
      const domains = (d.domains || []).map((x) => ({
        name: x.name || '',
        verified: Boolean(x.verified),
        redirect: x.redirect || '',
        git_branch: x.gitBranch || null,
        created_at: x.createdAt ? new Date(x.createdAt).toISOString() : null
      }));
      return Response.json({
        ok: true,
        project: projectSummary(p),
        domains,
        method: 'Read from Vercel for the selected project.'
      });
    }

    // Where this project deploys from and what it holds per environment: the linked
    // repository and its production branch, the domains attached to it, and the names
    // of the variables set for production, preview and development. Variable values are
    // deliberately never read back or returned.
    if (action === 'routing') {
      if (!projectRef) return Response.json({ ok: false, error: 'Which project?' }, { status: 400 });
      const p = await call(`/v9/projects/${encodeURIComponent(projectRef)}`, { team });
      const d = await call(`/v9/projects/${encodeURIComponent(p.id)}/domains`, { team, query: { limit: 50 } });
      let envs = [];
      let env_error = null;
      try {
        const e = await call(`/v10/projects/${encodeURIComponent(p.id)}/env`, { team });
        envs = (e.envs || []).map((x) => ({
          id: x.id,
          key: x.key,
          target: Array.isArray(x.target) ? x.target : [x.target].filter(Boolean),
          type: x.type || '',
          has_value: x.value !== undefined && x.value !== null && x.value !== ''
        }));
      } catch (error) {
        env_error = error.message;
      }
      return Response.json({
        ok: true,
        project: projectSummary(p),
        domains: (d.domains || []).map((x) => ({
          name: x.name || '',
          verified: Boolean(x.verified),
          redirect: x.redirect || '',
          git_branch: x.gitBranch || null
        })),
        envs,
        env_error,
        method: 'Read from Vercel for this project. Variable names and targets only; values are never read back.'
      });
    }

    // Point the project at a different repository. It reuses the Git connection the
    // project already has, so it can only move between repositories that same account
    // can see, and Vercel answers with what it actually linked.
    if (action === 'link_repo') {
      if (!projectRef) return Response.json({ ok: false, error: 'Which project?' }, { status: 400 });
      const repo = String(body.repo || '').trim();
      if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
        return Response.json({ ok: false, error: 'Which repository? It is expected as owner/name.' }, { status: 400 });
      }
      const p = await call(`/v9/projects/${encodeURIComponent(projectRef)}`, { team });
      const credential = p.link?.gitCredentialId || String(body.git_credential_id || '').trim();
      if (!credential) {
        return Response.json({
          ok: false,
          error:
            'This project holds no Git connection to reuse, so Vercel cannot be told which account holds that repository. Connect the repository to this project in Vercel once, then it can be changed from here.'
        }, { status: 200 });
      }
      const linked = await call(`/v9/projects/${encodeURIComponent(p.id)}/link`, {
        method: 'POST',
        team,
        body: { type: 'github', repo, gitCredentialId: credential }
      });
      return Response.json({
        ok: true,
        project: projectSummary(linked),
        linked_repo: repo,
        production_branch: linked?.link?.productionBranch || 'main',
        previous_repo: p.link ? `${p.link.org}/${p.link.repo}` : null,
        method: 'Vercel answered with the repository it is now linked to.'
      });
    }

    if (action === 'env_set') {
      if (!projectRef) return Response.json({ ok: false, error: 'Which project?' }, { status: 400 });
      const key = String(body.key || '').trim();
      const value = String(body.value ?? '');
      const targets = (Array.isArray(body.targets) ? body.targets : [])
        .map((t) => String(t))
        .filter((t) => ['production', 'preview', 'development'].includes(t));
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        return Response.json({ ok: false, error: 'A variable name can hold letters, numbers and underscores, and cannot start with a number.' }, { status: 400 });
      }
      if (!value) return Response.json({ ok: false, error: 'A value is required.' }, { status: 400 });
      if (!targets.length) {
        return Response.json({ ok: false, error: 'Choose at least one environment: production, preview or development.' }, { status: 400 });
      }
      const p = await call(`/v9/projects/${encodeURIComponent(projectRef)}`, { team });
      const written = await call(`/v10/projects/${encodeURIComponent(p.id)}/env`, {
        method: 'POST',
        team,
        body: { key, value, type: 'encrypted', target: targets }
      });
      return Response.json({
        ok: true,
        key,
        targets,
        created: written?.created || null,
        method: 'Written to Vercel for the environments named. This app does not store the value.'
      });
    }

    if (action === 'env_remove') {
      if (!projectRef) return Response.json({ ok: false, error: 'Which project?' }, { status: 400 });
      const envId = String(body.env_id || '').trim();
      if (!envId) return Response.json({ ok: false, error: 'Which variable? Its id from the routing read is expected.' }, { status: 400 });
      const p = await call(`/v9/projects/${encodeURIComponent(projectRef)}`, { team });
      await call(`/v9/projects/${encodeURIComponent(p.id)}/env/${encodeURIComponent(envId)}`, { method: 'DELETE', team });
      return Response.json({ ok: true, removed: envId, method: 'Vercel accepted the deletion.' });
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error.message,
      status_code: error.status || null,
      hint: /403|401/.test(String(error.status || ''))
        ? 'Vercel refused the token. Check that it is valid and scoped to the team that holds these projects.'
        : undefined
    }, { status: 200 });
  }
}
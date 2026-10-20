import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Which X1 host Visual X may actually frame, measured rather than assumed.
// X1's domain and its project URL answer X-Frame-Options SAMEORIGIN, while newer
// X1 builds carry a frame-ancestors policy that names this app. A host is only
// reported as framable when its own response headers say so.

const APP_ORIGIN = 'https://visual-x1.base44.app';
const VERCEL_API = 'https://api.vercel.com';
const X1_PROJECT_NAME = 'x1-operating-system';
const X1_PROJECT_ID = 'prj_PIDgTashnTCpsWbKUBCjHz55yXqT';
const MAX_HOSTS = 6;

function judgeFraming(xFrameOptions, csp) {
  const xfo = String(xFrameOptions || '').toUpperCase();
  if (xfo.includes('DENY') || xfo.includes('SAMEORIGIN')) {
    return { ok: false, reason: `This host answers X-Frame-Options ${xfo}, so it refuses every other origin.` };
  }
  const ancestors = String(csp || '').match(/frame-ancestors([^;]*)/i);
  if (ancestors) {
    const allowed = ancestors[1].trim().split(/\s+/);
    if (allowed.includes('*') || allowed.includes(APP_ORIGIN)) {
      return { ok: true, reason: `frame-ancestors names ${APP_ORIGIN}.` };
    }
    return { ok: false, reason: `frame-ancestors is "${ancestors[1].trim()}" and does not name ${APP_ORIGIN}.` };
  }
  return { ok: true, reason: 'This host sends no framing restriction.' };
}

async function vercel(path, token) {
  const res = await fetch(`${VERCEL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Vercel answered HTTP ${res.status}.`);
  return text ? JSON.parse(text) : {};
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'X1 host checks require a Visual X administrator' }, { status: 403 });
    }

    const token = secrets.get('VERCEL_TOKEN');
    if (!token) {
      return Response.json({ ok: false, error: 'No Vercel token is stored for this app yet. Add VERCEL_TOKEN in the app dashboard under Secrets.' });
    }

    const found = await vercel(`/v9/projects?limit=100&search=${X1_PROJECT_NAME}`, token);
    const project = (found.projects || []).find((p) => p.name === X1_PROJECT_NAME) || { id: X1_PROJECT_ID, name: X1_PROJECT_NAME };

    const [deployments, domains] = await Promise.all([
      vercel(`/v6/deployments?projectId=${project.id}&limit=12`, token),
      vercel(`/v9/projects/${project.id}/domains`, token)
    ]);

    const candidates = [];
    for (const d of deployments.deployments || []) {
      if (d.readyState !== 'READY' || !d.url) continue;
      const meta = d.meta || {};
      candidates.push({
        host: d.url,
        kind: 'build',
        ref: meta.githubCommitRef || '',
        sha: String(meta.githubCommitSha || '').slice(0, 7),
        created: d.created ? new Date(d.created).toISOString() : null,
        commit: String(meta.githubCommitMessage || '').split('\n')[0].slice(0, 120)
      });
    }
    for (const dom of domains.domains || []) {
      if (!dom.name) continue;
      candidates.push({ host: dom.name, kind: 'domain', ref: '', sha: '', created: null, commit: '' });
    }

    const seen = new Set();
    const shortlist = candidates.filter((c) => (seen.has(c.host) ? false : seen.add(c.host))).slice(0, MAX_HOSTS);

    const settled = await Promise.allSettled(
      shortlist.map(async (c) => {
        const res = await fetch(`https://${c.host}/`, { redirect: 'manual', signal: AbortSignal.timeout(12000) });
        const csp = res.headers.get('content-security-policy') || '';
        const verdict = judgeFraming(res.headers.get('x-frame-options'), csp);
        return {
          ...c,
          status: res.status,
          x_frame_options: res.headers.get('x-frame-options') || null,
          frames_visualx: verdict.ok,
          framing_reason: verdict.reason
        };
      })
    );

    const hosts = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : { ...shortlist[i], status: 0, x_frame_options: null, frames_visualx: false, framing_reason: String(s.reason?.message || s.reason).slice(0, 160) }
    );

    hosts.sort((a, b) => Number(b.frames_visualx) - Number(a.frames_visualx) || String(b.created || '').localeCompare(String(a.created || '')));

    return Response.json({
      ok: true,
      project: project.name,
      app_origin: APP_ORIGIN,
      checked_at: new Date().toISOString(),
      hosts,
      method: 'Each candidate host was read server-side and judged on its own response headers. No host is reported framable unless it permits this app.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
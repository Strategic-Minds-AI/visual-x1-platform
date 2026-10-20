import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Read-only bridge to X1's own API plane. X1's architecture rule is that it runs
// without a Base44 dependency, so Visual X never proxies a write and never opens
// dispatch: it reads what X1 reports about itself, and reports X1's own answer.
const X1_ORIGIN = 'https://www.strategicmindsai.com';

const ROUTES = {
  health: '/api/x1/health',
  worker_status: '/api/x1/worker-status',
  operator_status: '/api/x1/operator-status',
  browser_health: '/api/x1/browser-health',
  agent_config: '/api/x1/agent-config',
  work_items: '/api/x1/work-items',
  agent_sessions: '/api/x1/agent-sessions'
};

const MAX_ROUTES = 7;

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

    const asked = Array.isArray(payload.routes) ? payload.routes.filter((r) => typeof r === 'string') : [];
    const names = (asked.length ? asked : Object.keys(ROUTES)).filter((n) => ROUTES[n]).slice(0, MAX_ROUTES);

    const settled = await Promise.allSettled(
      names.map(async (name) => {
        const res = await fetch(`${X1_ORIGIN}${ROUTES[name]}`, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(10000)
        });
        const text = await res.text();
        return { name, path: ROUTES[name], status: res.status, body: text.slice(0, 800) };
      })
    );

    const endpoints = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : { name: names[i], path: ROUTES[names[i]], status: 0, body: '', error: String(s.reason?.message || s.reason).slice(0, 200) }
    );

    return Response.json({
      ok: true,
      origin: X1_ORIGIN,
      read_at: new Date().toISOString(),
      endpoints,
      method:
        "Read straight from X1's own API plane. Only the documented read routes are reachable here — no write and no dispatch path is exposed, and X1 itself disables both outside its preview runtime."
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
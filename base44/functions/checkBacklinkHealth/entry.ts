import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_PER_RUN = 25;
const PROBE_TIMEOUT_MS = 8000;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

const classify = (status, ms) => {
  if (status >= 200 && status < 400) return { health_status: 'healthy', health_note: `Responding in ${ms} ms` };
  if (status === 401 || status === 403) return { health_status: 'degraded', health_note: 'Reachable but blocking access' };
  if (status === 404 || status === 410) return { health_status: 'not_live', health_note: 'Page not found — needs rebuilding' };
  if (status >= 500) return { health_status: 'down', health_note: `Server error ${status}` };
  return { health_status: 'degraded', health_note: `Returns ${status}` };
};

async function probe(url) {
  const started = Date.now();
  let timer;
  try {
    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }
    const ms = Date.now() - started;
    return { ...classify(res.status, ms), http_status: res.status, response_ms: ms };
  } catch (error) {
    return {
      health_status: 'down',
      http_status: 0,
      response_ms: Date.now() - started,
      health_note: error.name === 'AbortError' ? `Timed out after ${PROBE_TIMEOUT_MS / 1000}s` : `Unreachable (${error.message})`,
    };
  } finally {
    clearTimeout(timer);
  }
}

const normaliseUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean).slice(0, MAX_PER_RUN) : [];

    let sites = [];
    if (ids.length) {
      const fetched = await base44.asServiceRole.entities.BacklinkSite.filter({ id: { $in: ids } }, { limit: MAX_PER_RUN });
      sites = fetched.items || [];
    } else {
      // Never-checked sites store a null timestamp, so match null (and missing) rather than $exists.
      const query = {
        $or: [
          { last_checked_at: null },
          { last_checked_at: { $lt: new Date(Date.now() - STALE_AFTER_MS).toISOString() } },
        ],
      };
      if (body.status) query.status = body.status;
      if (body.industry) query.industry = body.industry;
      const fetched = await base44.asServiceRole.entities.BacklinkSite.filter(query, {
        limit: MAX_PER_RUN,
        sort: 'last_checked_at',
      });
      sites = fetched.items || [];
    }

    if (!sites.length) {
      return Response.json({ checked: 0, message: 'Every site has been checked in the last 24 hours.' });
    }

    const updates = [];
    for (let i = 0; i < sites.length; i += 6) {
      const chunk = sites.slice(i, i + 6);
      const probed = await Promise.all(
        chunk.map(async (site) => {
          const url = normaliseUrl(site.site_url);
          const result = url
            ? await probe(url)
            : {
                health_status: 'unknown',
                http_status: 0,
                response_ms: 0,
                health_note: 'No site URL recorded yet — add one to check it',
              };
          return { id: site.id, ...result, last_checked_at: new Date().toISOString() };
        })
      );
      updates.push(...probed);
    }

    await base44.asServiceRole.entities.BacklinkSite.bulkUpdate(updates);

    const tally = updates.reduce((acc, u) => {
      acc[u.health_status] = (acc[u.health_status] || 0) + 1;
      return acc;
    }, {});

    return Response.json({ checked: updates.length, tally, results: updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
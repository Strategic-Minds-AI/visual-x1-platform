import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const GA_API = 'https://analyticsdata.googleapis.com/v1beta';
const MAX_PROPERTIES = 8;

const labelFor = (site) => site.target_domain || site.target_keyword || site.site_url || `Property ${site.ga_property_id}`;

const cleanProperty = (value) => String(value || '').replace(/^properties\//, '').trim();

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('google_analytics');
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Google Analytics is not connected yet.', not_connected: true }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const days = Math.min(Math.max(7, Number(body.days) || 28), 180);

    const fields = ['target_domain', 'target_keyword', 'target_location', 'site_url', 'ga_property_id', 'industry', 'status'];
    const all = (await base44.asServiceRole.entities.BacklinkSite.filter({}, { limit: 200, sort: '-created_date', fields })).items || [];
    let trackable = all.filter((s) => cleanProperty(s.ga_property_id));
    if (!trackable.length) {
      trackable = (await base44.asServiceRole.entities.BacklinkSite.filter(
        { ga_property_id: { $ne: null } }, { limit: 60, sort: '-created_date', fields }
      )).items.filter((s) => cleanProperty(s.ga_property_id));
    }
    const untrackedCount = all.filter((s) => !cleanProperty(s.ga_property_id)).length;
    if (!trackable.length) {
      return Response.json({
        series: [],
        sites: [],
        window_days: days,
        untracked: untrackedCount,
        message: 'No backlink site has a Google Analytics property ID yet — add one to compare traffic trends.',
      });
    }

    const byProperty = new Map();
    for (const site of trackable) {
      const propertyId = cleanProperty(site.ga_property_id);
      if (!byProperty.has(propertyId)) byProperty.set(propertyId, { propertyId, site });
    }
    const selected = [...byProperty.values()].slice(0, MAX_PROPERTIES);

    const results = await Promise.allSettled(selected.map(async ({ propertyId, site }) => {
      const res = await fetch(`${GA_API}/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'conversions' },
            { name: 'averageSessionDuration' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
          limit: days + 10,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Google Analytics returned ${res.status}`);
      const data = await res.json();
      const rows = data.rows || [];
      const points = rows.map((row) => {
        const raw = row.dimensionValues?.[0]?.value || '';
        const iso = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
        const m = row.metricValues || [];
        return {
          date: iso,
          sessions: Number(m[0]?.value || 0),
          users: Number(m[1]?.value || 0),
          conversions: Number(m[2]?.value || 0),
          engagement: Number(m[3]?.value || 0),
        };
      });
      return { propertyId, label: labelFor(site), industry: site.industry || '', points };
    }));

    const seriesMap = new Map();
    const series = [];
    const failures = [];
    let index = 0;

    results.forEach((outcome, i) => {
      const site = selected[i];
      if (outcome.status !== 'fulfilled') {
        failures.push({ property: site.propertyId, error: outcome.reason?.message || 'Request failed' });
        return;
      }
      const key = `s${index++}`;
      const points = outcome.value.points;
      series.push({
        key,
        label: outcome.value.label,
        property: outcome.value.propertyId,
        industry: outcome.value.industry,
        sessions: points.reduce((s, p) => s + p.sessions, 0),
        users: points.reduce((s, p) => s + p.users, 0),
        conversions: points.reduce((s, p) => s + p.conversions, 0),
        avg_engagement: points.length
          ? Math.round((points.reduce((s, p) => s + p.engagement, 0) / points.length) * 10) / 10
          : 0,
      });
      points.forEach((p) => {
        if (!seriesMap.has(p.date)) seriesMap.set(p.date, { date: p.date });
        seriesMap.get(p.date)[key] = p.sessions;
      });
    });

    return Response.json({
      series,
      labels: series.map(({ key, label }) => ({ key, label })),
      timeline: [...seriesMap.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
      failures,
      window_days: days,
      untracked: untrackedCount,
      unmonitored: trackable.length - selected.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
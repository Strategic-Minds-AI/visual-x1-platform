import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const GA_API = 'https://analyticsdata.googleapis.com/v1beta';
const WINDOW_DAYS = 28;

// Weighted blend so a variation with real conversions always outranks one with traffic alone.
const scoreFor = (conversionRate, sessions, engagementSeconds) => {
  const conversions = Math.min(100, conversionRate * 10);
  const traffic = Math.min(100, sessions / 10);
  const engagement = Math.min(100, engagementSeconds / 1.5);
  return Math.round(conversions * 0.6 + traffic * 0.25 + engagement * 0.15);
};

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
    const query = body.batch_id ? { batch_id: body.batch_id } : {};
    const { items } = await base44.asServiceRole.entities.SiteVariation.filter(query, { limit: 100, sort: '-created_date' });
    const trackable = (items || []).filter((v) => v.ga_property_id);

    if (!trackable.length) {
      return Response.json({ synced: 0, message: 'No variation has a Google Analytics property ID yet.' });
    }

    const updates = [];
    const failures = [];

    for (const variation of trackable) {
      const propertyId = String(variation.ga_property_id).replace(/^properties\//, '');
      try {
        const res = await fetch(`${GA_API}/properties/${propertyId}:runReport`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateRanges: [{ startDate: `${WINDOW_DAYS}daysAgo`, endDate: 'today' }],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'conversions' },
              { name: 'averageSessionDuration' },
            ],
            limit: 1,
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
          failures.push({ id: variation.id, error: `Google Analytics returned ${res.status}` });
          continue;
        }
        const data = await res.json();
        const values = (data.rows && data.rows[0] && data.rows[0].metricValues) || [];
        const sessions = Number((values[0] || {}).value || 0);
        const users = Number((values[1] || {}).value || 0);
        const conversions = Number((values[2] || {}).value || 0);
        const engagement = Number((values[3] || {}).value || 0);
        const conversionRate = sessions > 0 ? Math.round((conversions / sessions) * 1000) / 10 : 0;

        updates.push({
          id: variation.id,
          batch_id: variation.batch_id,
          sessions,
          users,
          conversions,
          conversion_rate: conversionRate,
          avg_engagement_seconds: Math.round(engagement * 10) / 10,
          performance_score: scoreFor(conversionRate, sessions, engagement),
          status: 'tracking',
          last_synced_at: new Date().toISOString(),
        });
      } catch (error) {
        failures.push({ id: variation.id, error: error.message });
      }
    }

    if (updates.length) {
      await base44.asServiceRole.entities.SiteVariation.bulkUpdate(
        updates.map(({ batch_id, ...rest }) => rest)
      );
    }

    // Flag the current leader inside each batch so the dashboard can crown a winner.
    const batchIds = [...new Set(updates.map((u) => u.batch_id).filter(Boolean))];
    for (const batchId of batchIds) {
      const { items: batchItems } = await base44.asServiceRole.entities.SiteVariation.filter({ batch_id: batchId }, { limit: 100 });
      if (!batchItems.length) continue;
      const best = batchItems.reduce(
        (top, v) => ((v.performance_score || 0) > (top.performance_score || 0) ? v : top),
        batchItems[0]
      );
      await base44.asServiceRole.entities.SiteVariation.bulkUpdate(
        batchItems.map((v) => ({ id: v.id, is_leader: v.id === best.id && (best.performance_score || 0) > 0 }))
      );
    }

    return Response.json({ synced: updates.length, failures, window_days: WINDOW_DAYS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
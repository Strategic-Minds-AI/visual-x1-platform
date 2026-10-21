import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  evaluateVerdict,
  isPast,
  loadPolicy,
  num,
  policyWithDefaults,
  resolveMetric,
} from '../../shared/loop.ts';

// Closes the attribution loop. Every applied change whose window has elapsed is
// re-measured from the same source it was opened against, and its verdict is
// computed by the shared rule — so an outcome is a fact about stored numbers,
// not a claim. Changes with nothing measurable to read are left pending and
// reported as insufficient evidence.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const policy = policyWithDefaults(await loadPolicy(service));

    const page = await service.entities.ChangeLedger.filter(
      { status: 'applied' },
      { limit: 100, sort: 'window_end' }
    );
    const rows = page.items || [];

    const closed = [];
    const waiting = [];
    const unmeasured = [];

    for (const record of rows) {
      const measured = await resolveMetric(service, record.routes || []);
      if (!measured) {
        unmeasured.push({ id: record.id, change_key: record.change_key, reason: 'no measurable record matches its routes' });
        continue;
      }
      const before = Number.isFinite(Number(record.metric_before)) ? Number(record.metric_before) : null;
      if (before === null) {
        await service.entities.ChangeLedger.update(record.id, {
          metric_before: measured.value,
          notes: `${record.notes || ''}\nNo pre-change measurement existed, so this value became the baseline.`.trim(),
        });
        waiting.push({ id: record.id, change_key: record.change_key, reason: 'baseline captured now; the window restarts from here' });
        continue;
      }
      if (!isPast(record.window_end)) {
        waiting.push({ id: record.id, change_key: record.change_key, reason: `window closes ${record.window_end}` });
        continue;
      }
      const metric = record.predicted_metric || measured.metric;
      const result = evaluateVerdict(policy, { before, after: measured.value, metric });
      await service.entities.ChangeLedger.update(record.id, {
        metric_after: measured.value,
        metric_delta: result.delta,
        verdict: result.verdict,
        lesson: `${record.change_key}: ${result.reason} (${metric} ${before} -> ${measured.value}, measured from ${measured.source})`,
      });
      closed.push({
        id: record.id,
        change_key: record.change_key,
        metric,
        before,
        after: measured.value,
        verdict: result.verdict,
        reason: result.reason,
        predicted_delta: num(record.predicted_delta, 0),
        calibrated: result.delta === null ? null : Math.abs(result.delta - num(record.predicted_delta, 0)),
      });
    }

    return Response.json({
      closed: closed.length,
      waiting: waiting.length,
      unmeasured: unmeasured.length,
      results: closed,
      waiting_detail: waiting,
      unmeasured_detail: unmeasured,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
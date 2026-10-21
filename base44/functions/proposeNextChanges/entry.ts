import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  gapProposals,
  loadPolicy,
  metricTargets,
  policyWithDefaults,
  resolveMetric,
} from '../../shared/loop.ts';

// The system proposing its own next work. It measures the objective metrics the
// policy names, computes each gap deterministically, and writes the backlog: one
// proposed ledger row and one Todo per gap, ordered by weighted size. No model is
// asked what to do — the policy and the records decide, so two runs agree.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const policy = policyWithDefaults(await loadPolicy(service));
    const targets = metricTargets(policy);

    if (!targets.length) {
      return Response.json({
        proposed: 0,
        reason: 'No metric targets are set on the active policy, so there is no gap to compute.',
        hint: 'Add metric_targets_json to the autonomy policy, e.g. [{"metric":"conversion_rate","comparator":"gte","target":2.5,"window_days":28}]',
      });
    }

    const [seoPage, sitePage, ledgerPage] = await Promise.all([
      service.entities.SEOVariant.filter({}, { limit: 50, sort: '-updated_date' }),
      service.entities.SiteVariation.filter({}, { limit: 50, sort: '-updated_date' }),
      service.entities.ChangeLedger.filter({ status: 'proposed' }, { limit: 100 }),
    ]);
    const seo = seoPage.items || [];
    const site = sitePage.items || [];
    const openProposals = ledgerPage.items || [];

    const metrics = [];
    const ctrRows = seo.filter((r) => Number(r.ctr) > 0);
    if (ctrRows.length) {
      const sum = ctrRows.reduce((acc, r) => acc + Number(r.impressions || 0), 0);
      const weighted = ctrRows.reduce((acc, r) => acc + Number(r.ctr) * Number(r.impressions || 0), 0);
      metrics.push({ metric: 'ctr', value: sum ? weighted / sum : Number(ctrRows[0].ctr), source: 'SEOVariant', sample: sum });
    }
    const sessionRows = site.filter((r) => Number(r.sessions) > 0);
    if (sessionRows.length) {
      const sum = sessionRows.reduce((acc, r) => acc + Number(r.sessions), 0);
      const weighted = sessionRows.reduce((acc, r) => acc + Number(r.conversion_rate) * Number(r.sessions), 0);
      metrics.push({ metric: 'conversion_rate', value: sum ? weighted / sum : Number(sessionRows[0].conversion_rate), source: 'SiteVariation', sample: sum });
    }
    const impressionRows = seo.filter((r) => Number(r.impressions) > 0);
    if (impressionRows.length) {
      metrics.push({
        metric: 'impressions',
        value: impressionRows.reduce((acc, r) => acc + Number(r.impressions || 0), 0),
        source: 'SEOVariant',
        sample: impressionRows.length,
      });
    }
    const positionRows = seo.filter((r) => Number(r.avg_position) > 0);
    if (positionRows.length) {
      metrics.push({
        metric: 'avg_position',
        value: positionRows.reduce((acc, r) => acc + Number(r.avg_position), 0) / positionRows.length,
        source: 'SEOVariant',
        sample: positionRows.length,
      });
    }

    const gaps = gapProposals(policy, metrics);
    const created = [];

    for (const gap of gaps.slice(0, 10)) {
      const changeKey = `close-${gap.metric}-gap`;
      if (openProposals.some((p) => p.change_key === changeKey)) continue;
      const routes = (site[0]?.url || seo[0]?.url) ? [new URL(site[0]?.url || seo[0].url).pathname] : [];
      const objective = gap.current === null
        ? `Establish a measurement for ${gap.metric}, which the policy targets at ${gap.comparator} ${gap.target} but no record reports yet.`
        : `Move ${gap.metric} from ${gap.current} to ${gap.comparator} ${gap.target}.`;
      const ledger = await service.entities.ChangeLedger.create({
        change_key: changeKey,
        objective,
        routes,
        status: 'proposed',
        verdict: 'pending',
        predicted_metric: gap.metric,
        prediction_confidence: 0,
        falsification: `If ${gap.metric} does not move toward ${gap.comparator} ${gap.target} inside the attribution window, this change failed.`,
        evidence_json: JSON.stringify({ source: 'proposeNextChanges', measured: gap.evidence, weight: gap.weight, score: gap.score }),
      });
      const todo = await service.entities.Todo.create({
        title: `${gap.metric}: close the gap (${gap.current === null ? 'unmeasured' : gap.current} to ${gap.comparator} ${gap.target})`,
        description: `${objective}\n\nEvidence: ${gap.evidence}\nObjective weight: ${gap.weight}\nLedger: ${ledger.id}\n\nOpen the change in the Website Self-Edit studio, run the loop, then record the outcome in the ledger.`,
        status: 'pending',
        priority: gap.weight >= 2 ? 'high' : 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
      created.push({ metric: gap.metric, ledger_id: ledger.id, todo_id: todo.id, objective, score: gap.score });
    }

    await service.entities.AuditLog.create({
      entity_type: 'Proposal',
      action: 'create',
      user_email: user.email,
      details: `proposeNextChanges raised ${created.length} proposal(s) from ${metrics.length} measured metric(s)`,
      severity: 'info',
    });

    return Response.json({
      proposed: created.length,
      measured: metrics,
      targets: targets.length,
      skipped: gaps.length - created.length,
      proposals: created,
      sample_source: await resolveMetric(service, []).then((m) => m || null),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
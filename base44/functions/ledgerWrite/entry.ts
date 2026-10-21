import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  armedGuards,
  attributionEnd,
  evaluateVerdict,
  guardsForRoutes,
  loadPolicy,
  num,
  policyWithDefaults,
  resolveMetric,
} from '../../shared/loop.ts';

// The change ledger is the spine of the loop: one record per change, carrying what
// was predicted, which gates passed, how it is reverted, and what it actually did.
// Every write here is deterministic — no model is called, and a change that cannot
// satisfy the policy is refused with the reason rather than accepted quietly.
const ATTRIBUTION_DAYS = 28;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();
    const policy = policyWithDefaults(await loadPolicy(service));

    const audit = (entity_id, details, severity = 'info') =>
      service.entities.AuditLog.create({
        entity_type: 'ChangeLedger',
        entity_id,
        action: 'update',
        user_email: user.email,
        details,
        severity,
      });

    if (policy.kill_switch && ['apply', 'revert'].includes(action)) {
      return Response.json({ refused: true, reason: 'The kill switch is on: the loop may propose but not act.', action });
    }

    if (action === 'open') {
      const changeKey = String(body.change_key || '').trim();
      const objective = String(body.objective || '').trim();
      if (!changeKey || !objective) {
        return Response.json({ error: 'change_key and objective are required' }, { status: 400 });
      }
      const routes = (Array.isArray(body.routes) ? body.routes : []).map((r) => String(r)).filter(Boolean);
      const forbidden = (policy.forbidden_paths || []).filter((p) => routes.some((r) => r.includes(String(p))));
      if (forbidden.length) {
        return Response.json({
          refused: true,
          reason: `Blast radius crosses a forbidden path: ${forbidden.join(', ')}`,
          routes,
        }, { status: 400 });
      }
      if (routes.length > num(policy.max_routes_per_change, 3)) {
        return Response.json({
          refused: true,
          reason: `Blast radius of ${routes.length} routes exceeds the policy maximum of ${policy.max_routes_per_change}.`,
          routes,
        }, { status: 400 });
      }

      const before = await resolveMetric(service, routes);
      const guards = guardsForRoutes(await armedGuards(service), routes);
      const created = await service.entities.ChangeLedger.create({
        change_key: changeKey,
        objective,
        site_url: body.site_url || '',
        routes,
        capability_ids: Array.isArray(body.capability_ids) ? body.capability_ids : [],
        prompt_type: body.prompt_type || 'transform',
        benchmark_ref: body.benchmark_ref || '',
        agent_names: Array.isArray(body.agent_names) ? body.agent_names : [],
        autonomy_level: body.autonomy_level || policy.autonomy_level,
        predicted_metric: body.predicted_metric || (before?.metric ?? ''),
        predicted_delta: num(body.predicted_delta, 0),
        prediction_confidence: num(body.prediction_confidence, 0),
        falsification: body.falsification || '',
        rollback_plan: body.rollback_plan || '',
        status: 'proposed',
        verdict: 'pending',
        evidence_json: JSON.stringify({
          observations: body.evidence || 'none gathered yet',
          metric_source: before || null,
          guards_armed: guards.map((g) => g.guard_key),
          captured_at: new Date().toISOString(),
        }),
      });
      await audit(created.id, `Change opened: ${changeKey} on ${routes.join(', ') || 'no route named'}`);
      return Response.json({ ok: true, id: created.id, guards: guards.map((g) => g.guard_key), metric_source: before });
    }

    const id = String(body.id || '').trim();
    if (!id) return Response.json({ error: 'id is required for this action' }, { status: 400 });
    const record = await service.entities.ChangeLedger.get(id);
    if (!record) return Response.json({ error: 'No ledger record with that id' }, { status: 404 });

    if (action === 'gate') {
      const kind = String(body.kind || '').trim();
      const patch = {};
      if (kind === 'validation') {
        patch.validation_score = num(body.score, 0);
        patch.validation_decision = body.decision || (num(body.score, 0) >= 95 ? 'PASS' : 'FAIL');
        patch.receipt_id = body.receipt_id || record.receipt_id || '';
      } else if (kind === 'qa') {
        patch.qa_score = num(body.score, 0);
      } else if (kind === 'content') {
        patch.content_score = num(body.score, 0);
      } else if (kind === 'regression') {
        const failures = Array.isArray(body.failures) ? body.failures.map(String) : [];
        patch.regression_failures = failures;
        patch.regression_pass = failures.length === 0;
      } else {
        return Response.json({ error: 'kind must be validation, qa, content or regression' }, { status: 400 });
      }
      patch.status = record.status === 'proposed' ? 'validated' : record.status;
      await service.entities.ChangeLedger.update(id, patch);
      await audit(id, `${kind} gate recorded for ${record.change_key}`);
      return Response.json({ ok: true, id, recorded: patch });
    }

    if (action === 'apply') {
      if (!record.rollback_plan && !body.rollback_plan) {
        return Response.json({ refused: true, reason: 'A change is not applied without a rollback plan.' }, { status: 400 });
      }
      const appliedPage = await service.entities.ChangeLedger.filter({ status: 'applied' }, { limit: 200, sort: '-updated_date' });
      const appliedRecently = (appliedPage.items || []).filter((r) => {
        const t = new Date(r.updated_date || 0).getTime();
        return Number.isFinite(t) && Date.now() - t < 24 * 60 * 60 * 1000;
      });
      if (appliedRecently.length >= num(policy.daily_change_budget, 5)) {
        return Response.json({
          refused: true,
          reason: `The daily change budget of ${policy.daily_change_budget} is spent; the loop pauses until tomorrow.`,
        }, { status: 429 });
      }
      const before = await resolveMetric(service, record.routes || []);
      await service.entities.ChangeLedger.update(id, {
        status: 'applied',
        version_after: body.version_after || '',
        snapshot_ref: body.snapshot_ref || record.snapshot_ref || '',
        rollback_plan: body.rollback_plan || record.rollback_plan,
        window_start: record.window_start || new Date().toISOString(),
        window_end: attributionEnd(ATTRIBUTION_DAYS),
        metric_before: before ? before.value : null,
      });
      await audit(id, `Change applied: ${record.change_key}; attribution window open for ${ATTRIBUTION_DAYS} days`);
      return Response.json({ ok: true, id, metric_before: before ? before.value : null, window_days: ATTRIBUTION_DAYS });
    }

    if (action === 'outcome') {
      const before = body.metric_before !== undefined ? num(body.metric_before, 0) : num(record.metric_before, 0);
      const after = body.metric_after !== undefined ? num(body.metric_after, 0) : null;
      if (after === null) return Response.json({ error: 'metric_after is required' }, { status: 400 });
      const metric = body.metric || record.predicted_metric || 'conversion_rate';
      const result = evaluateVerdict(policy, { before, after, metric });
      await service.entities.ChangeLedger.update(id, {
        metric_before: before,
        metric_after: after,
        metric_delta: result.delta,
        verdict: result.verdict,
        confounders: body.confounders || '',
        lesson: body.lesson || `${record.change_key}: ${result.reason}`,
      });
      await audit(id, `Outcome recorded for ${record.change_key}: ${result.verdict} (${result.reason})`, 'info');
      return Response.json({ ok: true, id, ...result });
    }

    if (action === 'revert') {
      await service.entities.ChangeLedger.update(id, {
        status: 'reverted',
        verdict: 'harmed',
        notes: `${record.notes || ''}\nReverted: ${body.reason || 'no reason given'}`.trim(),
        lesson: body.reason ? `${record.change_key} reverted: ${body.reason}` : record.lesson,
      });
      await audit(id, `Change reverted: ${record.change_key} — ${body.reason || 'no reason given'}`, 'warning');
      return Response.json({ ok: true, id, status: 'reverted' });
    }

    return Response.json({ error: 'action must be open, gate, apply, outcome or revert' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
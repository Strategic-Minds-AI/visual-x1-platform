import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { loadPolicy, loopChecks, policyWithDefaults } from '../../shared/loop.ts';

// The loop auditing itself. It answers only questions about the loop — does every
// applied change have an outcome, was every one validated, is every one revertible,
// have the guards run, is the daily budget honoured — and records the answers as a
// SystemAuditRun. A loop that cannot answer these is not self-improving, however
// many features it has.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = base44.asServiceRole;
    const policy = policyWithDefaults(await loadPolicy(service));

    const [ledgerPage, guardPage, itemPage] = await Promise.all([
      service.entities.ChangeLedger.filter({}, { limit: 200, sort: '-updated_date' }),
      service.entities.RegressionGuard.filter({}, { limit: 200 }),
      service.entities.ArchitectureItem.filter({}, { limit: 200, sort: 'display_order' }),
    ]);
    const ledger = ledgerPage.items || [];
    const guards = guardPage.items || [];
    const items = itemPage.items || [];

    const result = loopChecks({ ledger, guards, items, policy });
    const passed = result.checks.filter((c) => c.result === 'PASS').length;
    const overall = Math.round((passed / result.checks.length) * 100);

    const gaps = result.blocking.map((c) => `${c.label}: expected ${c.expected}, found ${c.found}`);

    const run = await service.entities.SystemAuditRun.create({
      run_name: `Loop integrity audit — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      scope: 'The self-* loop itself: attribution, validation, revertibility, guards, budget',
      dimension_scores_json: JSON.stringify(result.checks.map((c) => ({ id: c.id, label: c.label, result: c.result, required: c.required }))),
      overall_score: overall,
      benchmark_ceiling: 100,
      gaps_json: JSON.stringify(gaps),
      suggestions_json: JSON.stringify(result.checks.filter((c) => c.result === 'FAIL').map((c) => {
        const map = {
          every_change_has_outcome: 'Run outcomeSync to close the applied changes whose window has elapsed.',
          every_change_validated: 'Route each applied change through independentValidation and record its score in the ledger.',
          every_change_revertible: 'Record a rollback plan on each change before it is applied.',
          guards_have_run: 'Run the armed regression guards against the current routes.',
          live_items_evidenced: 'Attach evidence to every architecture item marked live.',
          daily_budget_honoured: 'The daily change budget is spent; let the loop pause.',
        };
        return map[c.id] || `Resolve: ${c.label}`;
      })),
      verdict: result.pass ? 'PASS — the loop is closed' : `BLOCKED — ${result.blocking.length} required check(s) fail`,
      confidence: 1,
      model: 'deterministic',
      notes: `${ledger.length} ledger rows, ${guards.length} guards, ${items.length} architecture items read.`,
    });

    await service.entities.AuditLog.create({
      entity_type: 'SystemAuditRun',
      entity_id: run.id,
      action: 'validate',
      user_email: user.email,
      details: `Loop integrity audit: ${overall}/100, ${result.blocking.length} blocking failure(s)`,
      severity: result.pass ? 'info' : 'warning',
    });

    return Response.json({
      run_id: run.id,
      overall_score: overall,
      pass: result.pass,
      verdict: run.verdict,
      checks: result.checks,
      blocking: result.blocking,
      counted: { ledger: ledger.length, guards: guards.length, architecture_items: items.length },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { experimental_evaluate as evaluate } from 'npm:ai@7.0.105';
import { createTypeSafeAi } from 'npm:@ai-sdk/typesafe-ai@3.0.4';

// Scores Visual X's own capabilities against the benchmark systems and returns the gaps with
// an auto-suggestion for each. The rubric levels and the benchmark ceilings are declared
// planning targets, not measured performance: a dimension only counts as met when the
// capability carries real evidence.
const RUBRIC_LEVELS = [
  'Nothing exists for this, not even a plan',
  'Described or planned only, with no working implementation',
  'Partially implemented and works, but needs a person to run or finish it',
  'Implemented and automated, used on real projects, evidence is thin or unverified',
  'Implemented, automated, evidence recorded, and validated against a benchmark',
  'Best in class against the benchmark systems, independently audited with receipts',
];

const DIMENSIONS = [
  { id: 'discovery_depth', label: 'Discovery and skip-trace depth', weight: 0.13, ceiling: 92,
    suggestion: 'Deepen the research call set: add directory and review-platform sweeps, then store one source URL per competitor field so every claim is traceable.' },
  { id: 'evidence_discipline', label: 'Evidence and source discipline', weight: 0.12, ceiling: 95,
    suggestion: 'Attach a source URL and a confidence value to every discovered field, and refuse to publish a report section that has no source.' },
  { id: 'competitor_scoring', label: 'Competitor scoring rigor', weight: 0.11, ceiling: 90,
    suggestion: 'Score competitors on a fixed rubric with saved rubric versions, so the same business scores the same way twice.' },
  { id: 'normalization', label: 'Normalization and document production', weight: 0.09, ceiling: 88,
    suggestion: 'Emit one normalized machine-readable section set per report and render every client document from it, never from free text.' },
  { id: 'strategy_specificity', label: 'Strategy specificity', weight: 0.11, ceiling: 93,
    suggestion: 'Require each proposal option to name its offer, price band, channel, owner and target metric before it can be approved.' },
  { id: 'simulation_rigor', label: 'Simulation rigor', weight: 0.12, ceiling: 90,
    suggestion: 'Keep the assumption ledger with every run, and reconcile modeled ranges against first-party actuals monthly.' },
  { id: 'prediction_transparency', label: 'Prediction transparency', weight: 0.1, ceiling: 96,
    suggestion: 'Show the reasoning steps and the disclaimers inline with each prediction, and block any export that drops them.' },
  { id: 'gate_enforcement', label: 'Approval gate enforcement', weight: 0.08, ceiling: 94,
    suggestion: 'Make every client-facing gate require a rendered artifact plus a named approver before the next phase can start.' },
  { id: 'workflow_measurement', label: 'Workflow measurement', weight: 0.07, ceiling: 90,
    suggestion: 'Tie each step to named evidence and surface stalled steps automatically instead of waiting for a status update.' },
  { id: 'autonomy_readiness', label: 'Agent autonomy readiness', weight: 0.07, ceiling: 91,
    suggestion: 'Publish the autonomy matrix (what agents may do alone) and log every autonomous action with a rollback path.' },
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const capabilities = (Array.isArray(body.capabilities) ? body.capabilities : []).slice(0, 40).map((c) => ({
      id: String(c.id || '').slice(0, 60),
      name: String(c.name || '').slice(0, 120),
      domain: String(c.domain || '').slice(0, 40),
      what_it_does: String(c.what_it_does || '').slice(0, 400),
      automation_level: String(c.automation_level || '').slice(0, 30),
      maturity: String(c.maturity || '').slice(0, 30),
      evidence: String(c.evidence || '').slice(0, 300),
    }));
    const benchmarks = (Array.isArray(body.benchmarks) ? body.benchmarks : []).slice(0, 25).map((b) => ({
      name: String(b.name || '').slice(0, 120),
      category: String(b.category || '').slice(0, 40),
      what_it_does: String(b.what_it_does || '').slice(0, 300),
      evidence_total: Number(b.evidence_total) || 0,
      evidence_max: Number(b.evidence_max) || 16,
      our_parity: Number(b.our_parity) || 0,
      gap_note: String(b.gap_note || '').slice(0, 300),
    }));
    if (!capabilities.length) {
      return Response.json({ error: 'No capabilities were supplied to audit.' }, { status: 400 });
    }

    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection({ provider: 'typesafe' });
    const typesafe = createTypeSafeAi({ baseURL, apiKey: token, headers });

    const questions = {};
    DIMENSIONS.forEach((d) => {
      questions[d.id] = {
        type: 'score',
        instructions: `Score Visual X on ${d.label}. Rate the level the system actually reaches today, judged from the capability evidence supplied. Documentation or claims alone cap the score at level 1.`,
        criteria: RUBRIC_LEVELS,
      };
    });

    const result = await evaluate({
      model: typesafe.evaluationModel('jev'),
      maxRetries: 0,
      state: {
        system: 'Visual X — multi-agent research, discovery, strategy, simulation and site-building system',
        audited_at: new Date().toISOString(),
        capabilities,
        benchmark_systems: benchmarks,
        scoring_note: 'Levels 0-5 map to 0-100. Evidence of automated use on real projects is required above level 2.',
      },
      questions,
    });

    const answers = result.answers || {};
    const confidenceMap = result.providerMetadata?.typesafe?.confidence || {};
    const dimensionRows = DIMENSIONS.map((d) => {
      const raw = Number(answers[d.id]?.score) || 0;
      const score = Math.round((raw / 5) * 100);
      const gap = Math.max(0, d.ceiling - score);
      return {
        id: d.id,
        label: d.label,
        level: Math.round(raw * 10) / 10,
        score,
        benchmark_ceiling: d.ceiling,
        gap,
        weight: d.weight,
        confidence: confidenceMap[d.id] != null ? Math.round(Number(confidenceMap[d.id]) * 100) / 100 : null,
        suggestion: gap > 0 ? d.suggestion : '',
      };
    });

    const overall = Math.round(dimensionRows.reduce((s, r) => s + r.score * r.weight, 0));
    const ceiling = Math.round(dimensionRows.reduce((s, r) => s + r.benchmark_ceiling * r.weight, 0));
    const gaps = dimensionRows
      .filter((r) => r.gap > 0)
      .sort((a, b) => b.gap * b.weight - a.gap * a.weight)
      .map((r) => ({ dimension: r.label, score: r.score, benchmark: r.benchmark_ceiling, gap: r.gap }));
    const suggestions = dimensionRows.filter((r) => r.suggestion).map((r) => ({
      dimension: r.label, gap: r.gap, action: r.suggestion,
    }));

    const evidenced = capabilities.filter((c) => c.evidence && !/^not (connected|built)/i.test(c.evidence)).length;
    const confidence = Math.round(((0.5 + 0.5 * (evidenced / capabilities.length)) * 100)) / 100;

    const verdict = overall >= ceiling
      ? `At or above the benchmark bar: ${overall}/100 against a ${ceiling}/100 target.`
      : `Below the benchmark bar: ${overall}/100 against a ${ceiling}/100 target. ${gaps.length} dimension(s) need work, largest gap is ${gaps[0]?.dimension || 'none'}.`;

    const run = await base44.entities.SystemAuditRun.create({
      run_name: `System audit ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      scope: String(body.scope || 'Visual X capability set vs benchmark systems').slice(0, 200),
      capabilities_json: JSON.stringify(capabilities),
      benchmarks_json: JSON.stringify(benchmarks),
      dimension_scores_json: JSON.stringify(dimensionRows),
      overall_score: overall,
      benchmark_ceiling: ceiling,
      gaps_json: JSON.stringify(gaps),
      suggestions_json: JSON.stringify(suggestions),
      verdict,
      confidence,
      model: 'jev rubric scoring',
      notes: 'Levels 0-5 per dimension, mapped to 0-100. Benchmark ceilings are declared targets from the benchmark matrix, not measured performance.',
    });

    return Response.json({
      run_id: run.id,
      overall_score: overall,
      benchmark_ceiling: ceiling,
      dimensions: dimensionRows,
      gaps,
      suggestions,
      verdict,
      confidence,
      scoring_note: 'Rubric levels are declared targets. A dimension only counts as met when the capability has recorded evidence.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PASS_SCORE = 95;
const MAX_ROUNDS = 3;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const batchId = String(body.batch_id || '');
    const brief = body.brief || '';
    const industry = body.industry || 'General';
    let html = String(body.html || '');
    if (!batchId) return Response.json({ error: 'A batch id is required' }, { status: 400 });
    if (html.trim().length < 100) return Response.json({ error: 'Rendered HTML is required (min 100 chars)' }, { status: 400 });

    // Repair cycles are counted against the batch, so the 3-cycle policy holds across
    // repeated runs instead of resetting on every invocation.
    const existing = await base44.entities.FactoryBatch.get(batchId).catch(() => null);
    let repairsUsed = Number(existing?.repair_round) || 0;
    const requestedRounds = Math.min(Math.max(1, Number(body.max_rounds) || MAX_ROUNDS), MAX_ROUNDS);

    const rounds = [];
    let validation = null;
    let passed = false;

    // Validate, repair, re-validate. Each round reuses the same independent validator and
    // repair engineer the manual flow uses, so an automated round is never self-certified.
    for (let round = 1; round <= requestedRounds; round++) {
      const valRes = await base44.functions.invoke('independentValidation', {
        html,
        batch_id: batchId,
        brief,
        industry,
      });
      validation = valRes.data?.validation || {};
      const score = Number(validation.total_score) || 0;
      passed = score >= PASS_SCORE && validation.decision === 'pass';
      rounds.push({
        round,
        score,
        decision: validation.decision || 'unknown',
        findings: (validation.findings || []).length,
      });

      await base44.entities.FactoryBatch.update(batchId, {
        repair_round: repairsUsed,
        current_step: passed ? 'complete' : 'refining',
        status: passed ? 'ready' : 'refining',
        quality_score: score,
        validation_result: JSON.stringify(validation),
        html_length: html.length,
        rendered: true,
      });

      if (passed) break;
      if (repairsUsed >= MAX_ROUNDS) break;

      const repairRes = await base44.functions.invoke('repairDefects', {
        html,
        findings: validation.findings || [],
        brief,
        industry,
        batch_id: batchId,
        repair_round: repairsUsed + 1,
      });
      if (!repairRes.data?.html) {
        await base44.entities.FactoryBatch.update(batchId, {
          status: 'needs_refinement',
          current_step: 'manual_review',
          repair_round: repairsUsed,
          error_message: `Automated repair returned no HTML after ${repairsUsed} cycle(s). Flagged for manual review.`,
        });
        return Response.json({
          batch_id: batchId,
          passed: false,
          flagged: true,
          rounds,
          quality_score: Number(validation.total_score) || 0,
          html,
          validation,
          reason: `Repair returned no HTML — flagged for manual review after ${repairsUsed} cycle(s).`,
        });
      }
      html = repairRes.data.html;
      repairsUsed += 1;
      rounds[rounds.length - 1].repaired = true;
    }

    const finalScore = Number(validation?.total_score) || 0;
    const flagReason = passed
      ? ''
      : `Auto-repair used ${repairsUsed} of ${MAX_ROUNDS} cycles — still ${finalScore}/100. Flagged for manual review.`;

    await base44.entities.FactoryBatch.update(batchId, {
      status: passed ? 'ready' : 'needs_refinement',
      current_step: passed ? 'complete' : 'manual_review',
      repair_round: repairsUsed,
      quality_score: finalScore,
      validation_result: JSON.stringify(validation || {}),
      rendered: true,
      html_length: html.length,
      error_message: flagReason,
    });

    await base44.entities.AuditLog.create({
      entity_type: 'factory_batch',
      entity_id: batchId,
      action: 'validate',
      user_email: user.email,
      details: `Auto-repair loop: ${rounds.length} round(s), final ${finalScore}/100, ${passed ? 'passed' : 'flagged for manual review'}`,
      severity: passed ? 'info' : 'warning',
    });

    return Response.json({
      batch_id: batchId,
      passed,
      flagged: !passed,
      rounds,
      quality_score: finalScore,
      html,
      validation,
      reason: flagReason,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
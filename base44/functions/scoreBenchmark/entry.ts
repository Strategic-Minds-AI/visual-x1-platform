import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { project_id, benchmark_id, repair_round } = body;

    if (!project_id) {
      return Response.json({ error: 'project_id is required' }, { status: 400 });
    }

    const project = await base44.entities.Project.get(project_id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    let benchmark = null;
    if (benchmark_id) {
      try {
        benchmark = await base44.entities.BenchmarkReference.get(benchmark_id);
      } catch (e) { /* benchmark may not exist */ }
    }

    const { items: prompts } = await base44.entities.PromptVersion.filter(
      { project_id, status: 'active' },
      { sort: '-created_date', limit: 1 }
    );
    const { items: specs } = await base44.entities.ProductSpec.filter(
      { project_id, status: 'active' },
      { sort: '-created_date', limit: 1 }
    );

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Visual X Independent Quality Validator using the 100-point scorecard.

Project: ${project.name}
Idea: ${project.idea}
Pattern: ${project.pattern_name || 'N/A'}

${benchmark ? `Benchmark Reference: ${benchmark.name} (${benchmark.url})
Industry: ${benchmark.industry}
Key patterns: ${benchmark.key_patterns || 'N/A'}
UX Score: ${benchmark.ux_score || 'N/A'}` : 'No specific benchmark selected — score against general industry standards.'}

Prompt: ${prompts[0]?.prompt_text || 'N/A'}
Product Spec: ${specs[0]?.specification || 'N/A'}

Score each dimension 0 to its max weight:
- visual_parity (0-25): Layout, typography, spacing, color, imagery, responsive screenshots
- functionality (0-20): All critical buttons, forms, navigation, APIs, workflows work
- accessibility (0-15): WCAG 2.2 AA checks, keyboard operation, contrast, semantics
- responsive_ux (0-10): Mobile, tablet, and desktop layouts work correctly
- performance (0-10): Core Web Vitals and loading behavior
- security (0-10): Authentication, authorization, secrets, data handling
- content_trust_seo (0-5): Clear information, metadata, trust signals, semantic structure
- reliability (0-5): Automated tests, reproducible builds, no critical regressions

Decision rules:
- "pass": total >= 95 AND no critical security issue AND no broken core journey
- "repair": evidence-backed gaps remain, total < 95
- "block": unsafe, missing evidence, or failed tests

Return JSON with each score, total_score, decision, evidence (JSON string of evidence), and notes.`,
      response_json_schema: {
        type: "object",
        properties: {
          visual_parity: { type: "number" },
          functionality: { type: "number" },
          accessibility: { type: "number" },
          responsive_ux: { type: "number" },
          performance: { type: "number" },
          security: { type: "number" },
          content_trust_seo: { type: "number" },
          reliability: { type: "number" },
          total_score: { type: "number" },
          decision: { type: "string", enum: ["pass", "repair", "block"] },
          evidence: { type: "string" },
          notes: { type: "string" }
        },
        required: ["visual_parity", "functionality", "accessibility", "responsive_ux", "performance", "security", "content_trust_seo", "reliability", "total_score", "decision"]
      }
    });

    const scorecard = await base44.entities.QualityScorecard.create({
      project_id,
      benchmark_id: benchmark_id || '',
      visual_parity: llmResult.visual_parity || 0,
      functionality: llmResult.functionality || 0,
      accessibility: llmResult.accessibility || 0,
      responsive_ux: llmResult.responsive_ux || 0,
      performance: llmResult.performance || 0,
      security: llmResult.security || 0,
      content_trust_seo: llmResult.content_trust_seo || 0,
      reliability: llmResult.reliability || 0,
      total_score: llmResult.total_score || 0,
      decision: llmResult.decision || 'block',
      evidence: llmResult.evidence || '',
      notes: llmResult.notes || '',
      repair_round: repair_round || 0
    });

    if (llmResult.decision === 'pass') {
      await base44.entities.Project.update(project_id, { status: 'validated' });
    } else if (llmResult.decision === 'repair') {
      await base44.entities.Project.update(project_id, { status: 'tested' });
    }

    await base44.entities.AuditLog.create({
      entity_type: 'quality_scorecard',
      entity_id: scorecard.id,
      action: 'validate',
      user_email: user.email,
      details: `Scorecard created: ${llmResult.total_score}/100 — ${llmResult.decision}`,
      severity: llmResult.decision === 'block' ? 'critical' : 'info'
    });

    return Response.json({ scorecard, ...llmResult });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
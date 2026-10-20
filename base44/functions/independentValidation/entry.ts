import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { html, batch_id, benchmark_context, brief, industry } = body;

    if (!html || html.trim().length < 100) {
      return Response.json({ error: 'Rendered HTML is required (min 100 chars)' }, { status: 400 });
    }

    // Fetch benchmarks if not provided
    let benchmarkCtx = benchmark_context || '';
    if (!benchmarkCtx) {
      const { items: benchmarks } = await base44.asServiceRole.entities.BenchmarkReference.filter(
        { is_active: true },
        { sort: '-ux_score', limit: 5, fields: ['name', 'url', 'ux_score', 'key_patterns', 'description'] }
      );
      benchmarkCtx = benchmarks.map(b =>
        `- ${b.name} (${b.url}) UX:${b.ux_score || 'N/A'}/100 — ${(b.key_patterns || b.description || '').substring(0, 200)}`
      ).join('\n');
    }

    const htmlForValidation = html.substring(0, 12000);

    const validationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Visual X INDEPENDENT VALIDATOR. You are separate from the builder. Your job is to evaluate the ACTUAL RENDERED HTML, not the prompt that generated it.

BRIEF: ${brief || 'N/A'}
INDUSTRY: ${industry || 'General'}
BENCHMARK REFERENCES: ${benchmarkCtx}

RENDERED HTML TO EVALUATE:
"""
${htmlForValidation}
"""

Evaluate the actual HTML for these dimensions (score 0 to max):
- visual_parity (0-25): Visual design quality — gradients, shadows, typography hierarchy, color system, polished layout
- functionality (0-20): Working JS — hamburger toggle, FAQ accordion, smooth scroll, animations. All required sections present
- accessibility (0-15): Semantic HTML5, ARIA labels, keyboard-navigable, color contrast, heading hierarchy
- responsive_ux (0-10): clamp() fonts, media queries, flexbox/grid, hamburger below 768px
- performance (0-10): Self-contained, no external deps, system fonts, CSS gradients
- security (0-10): Safe HTML, no inline event handlers, no eval, no external scripts
- content_trust_seo (0-5): Realistic content, meta tags, semantic structure, trust signals
- reliability (0-5): Error handling, fallback states, well-structured code

HARD GATES (any failure = "block"):
- Missing required section (nav, hero, features, testimonials, FAQ, CTA, footer)
- External dependencies (CDN, external scripts, external images)
- No JavaScript interactivity
- Inaccessible (no semantic HTML, no ARIA)

DECISION RULES:
- "pass": total >= 95 AND no hard gate failure
- "repair": total 70-94 OR minor fixable issues
- "block": total < 70 OR any hard gate failure

Return JSON.`,
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
          decision: { type: "string" },
          findings: { type: "array", items: { type: "string" } },
          evidence_summary: { type: "string" }
        }
      }
    });

    // Update batch if provided
    if (batch_id) {
      await base44.entities.FactoryBatch.update(batch_id, {
        validation_result: JSON.stringify(validationResult),
        quality_score: validationResult.total_score || 0
      });

      await base44.entities.AuditLog.create({
        entity_type: 'factory_batch',
        entity_id: batch_id,
        action: 'validate',
        user_email: user.email,
        details: `Independent validation: ${validationResult.total_score}/100 — ${validationResult.decision}`,
        severity: validationResult.decision === 'block' ? 'critical' : 'info'
      });
    }

    return Response.json({ validation: validationResult, batch_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
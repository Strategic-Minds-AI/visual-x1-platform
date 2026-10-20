import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sentence, industry, target_variants = 100, target_backlinks = 50 } = body;

    if (!sentence || sentence.trim().length < 10) {
      return Response.json({ error: 'Sentence must be at least 10 characters' }, { status: 400 });
    }

    // Create the production batch
    const batch = await base44.entities.FactoryBatch.create({
      sentence: sentence.trim(),
      industry: industry || 'General',
      status: 'planning',
      target_variant_count: target_variants,
      target_backlink_count: target_backlinks,
      current_step: 'initializing',
      quality_score: 0,
      repair_round: 0,
      created_variants: 0,
      created_backlinks: 0
    });

    try {
      // STEP 1: Fetch top benchmarks
      await base44.entities.FactoryBatch.update(batch.id, {
        status: 'generating',
        current_step: 'fetching_benchmarks'
      });

      const { items: benchmarks } = await base44.asServiceRole.entities.BenchmarkReference.filter(
        { is_active: true },
        { sort: '-ux_score', limit: 5, fields: ['name', 'url', 'ux_score', 'key_patterns', 'description', 'industry'] }
      );

      const benchmarkCtx = benchmarks.map(b =>
        `- ${b.name} (${b.url}) UX:${b.ux_score || 'N/A'}/100 — ${(b.key_patterns || b.description || '').substring(0, 300)}`
      ).join('\n');

      // STEP 2: Convert sentence into production-grade prompt
      await base44.entities.FactoryBatch.update(batch.id, { current_step: 'converting_prompt' });

      const promptResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the Visual X Autonomous Orchestrator. Convert this one sentence into a production-grade website creation prompt that will be used to generate a high-performance website.

BENCHMARK REFERENCES (the generated site MUST match or exceed these):
${benchmarkCtx}

INPUT SENTENCE: ${sentence}
TARGET INDUSTRY: ${industry || 'General'}

Generate a comprehensive website creation prompt that includes:
1. Complete site architecture (pages, navigation, sections)
2. Conversion-optimized UX patterns derived from the benchmarks
3. SEO-optimized content structure with target keywords
4. Lead generation funnel integration (contact forms, click-to-call, quote requests)
5. Responsive design specs (mobile, tablet, desktop)
6. Trust signals and social proof elements
7. Performance targets (Core Web Vitals, load time)
8. Accessibility requirements (WCAG 2.1 AA)

The prompt must target a 95+/100 quality score across visual, functional, accessibility, performance, and security dimensions.

Return JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            site_type: { type: "string" },
            target_audience: { type: "string" },
            key_features: { type: "array", items: { type: "string" } },
            seo_keywords: { type: "array", items: { type: "string" } },
            funnel_type: { type: "string" }
          }
        }
      });

      await base44.entities.FactoryBatch.update(batch.id, {
        current_step: 'compiling_spec',
        prompt_result: JSON.stringify(promptResult)
      });

      // STEP 3: Compile detailed product specification
      const specResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Create a detailed product specification for this website project:

PROMPT: ${promptResult.prompt}
INDUSTRY: ${industry || 'General'}
SITE TYPE: ${promptResult.site_type || 'marketing_site'}

Define the full specification including all pages, components, data models, integrations, and acceptance criteria. This spec will be used to generate the actual website code.

Return JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            specification: { type: "string" },
            components: { type: "array", items: { type: "string" } },
            pages: { type: "array", items: { type: "string" } },
            integrations: { type: "array", items: { type: "string" } },
            acceptance_criteria: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.FactoryBatch.update(batch.id, {
        current_step: 'running_qa',
        spec_result: JSON.stringify(specResult)
      });

      // STEP 4: Autonomous QA Audit
      const qaResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the Visual X QA Validator. Audit this website specification and prompt for quality. Score each dimension 0-100.

PROMPT: ${promptResult.prompt}
SPECIFICATION: ${specResult.specification}
KEY FEATURES: ${JSON.stringify(promptResult.key_features)}
ACCEPTANCE CRITERIA: ${JSON.stringify(specResult.acceptance_criteria)}

Score these dimensions (weighted):
- visual_parity (0-25): Design quality vs benchmarks
- functionality (0-20): User journeys and feature completeness
- accessibility (0-15): WCAG 2.1 AA compliance
- responsive_ux (0-10): Mobile/tablet/desktop experience
- performance (0-10): Core Web Vitals and load speed
- security (0-10): Security and privacy practices
- content_trust_seo (0-5): Content quality, trust signals, SEO
- reliability (0-5): Error handling and regression resistance

Calculate total_score as the sum. Set decision to "pass" if total >= 95, "repair" if 70-94, "block" if < 70.

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
            findings: { type: "array", items: { type: "string" } }
          }
        }
      });

      const totalScore = qaResult.total_score || 0;

      await base44.entities.FactoryBatch.update(batch.id, {
        current_step: 'scoring',
        qa_result: JSON.stringify(qaResult),
        quality_score: totalScore
      });

      // STEP 5: QA Feedback Loop (if score < 95, generate improvement suggestions)
      let refinement = null;
      if (totalScore < 95) {
        await base44.entities.FactoryBatch.update(batch.id, {
          current_step: 'refining',
          repair_round: 1
        });

        refinement = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are the Visual X QA Refinement Engine. This website scored ${totalScore}/100 (decision: ${qaResult.decision}).

FINDINGS:
${JSON.stringify(qaResult.findings, null, 2)}

CURRENT PROMPT:
${promptResult.prompt}

Generate specific, actionable improvements to reach 95+/100. The refined prompt should address every finding.

Return JSON.`,
          response_json_schema: {
            type: "object",
            properties: {
              suggestions: { type: "array", items: { type: "string" } },
              refined_prompt: { type: "string" },
              learning_note: { type: "string" }
            }
          }
        });

        await base44.entities.FactoryBatch.update(batch.id, {
          refinement_suggestions: JSON.stringify(refinement)
        });
      }

      // FINAL: Mark batch complete
      const finalStatus = totalScore >= 95 ? 'ready' : 'needs_refinement';
      await base44.entities.FactoryBatch.update(batch.id, {
        status: finalStatus,
        current_step: 'complete',
        quality_score: totalScore
      });

      return Response.json({
        batch_id: batch.id,
        status: finalStatus,
        quality_score: totalScore,
        decision: qaResult.decision,
        prompt: promptResult,
        spec: specResult,
        qa: qaResult,
        refinement,
        benchmarks_used: benchmarks.length
      });

    } catch (pipelineError) {
      await base44.entities.FactoryBatch.update(batch.id, {
        status: 'failed',
        current_step: 'error',
        error_message: pipelineError.message
      });
      return Response.json({ error: pipelineError.message, batch_id: batch.id }, { status: 500 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
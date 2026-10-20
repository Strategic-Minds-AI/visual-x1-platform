import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const RENDER_META_PROMPT = `You are a world-class senior frontend engineer and award-winning UI/UX designer. Generate a COMPLETE, PRODUCTION-QUALITY website as a single self-contained HTML file. This must look like a real launched product — NOT a minimal stub.

PROMPT TO IMPLEMENT:
"""
{PROMPT}
"""

BENCHMARK PATTERNS TO MATCH OR EXCEED:
{BENCHMARKS}

MANDATORY REQUIREMENTS:

1. SECTIONS — include ALL of these (do not skip any):
   - Sticky nav bar: logo, 4-5 nav links, primary CTA button, hamburger on mobile
   - Hero: bold headline, subheadline, two CTAs, visual element (gradient/SVG)
   - Features grid: 3-6 cards with icon (emoji or SVG), title, description
   - How it works: 3-step process with numbered steps
   - Testimonials: 3 cards with quote, name, title, avatar (CSS circle)
   - FAQ: 5 items as an accordion (clickable expand/collapse)
   - Final CTA: full-width gradient section with button
   - Footer: 3-4 link columns, newsletter input, social icons, copyright

2. DESIGN — modern and polished, matching the benchmark patterns above:
   - CSS custom properties for colors (accent + neutrals)
   - Gradients on hero and CTA sections
   - Box shadows, rounded corners (8-16px), hover lift effects
   - Smooth transitions (0.3s) on all interactive elements
   - Scroll-triggered fade-in animations via IntersectionObserver
   - Strong typography hierarchy (clamp-based font sizes)

3. CONTENT — realistic and specific to the industry. Real-sounding content, specific feature descriptions. No "lorem ipsum".

4. JAVASCRIPT — working interactivity:
   - Mobile hamburger menu toggle
   - Smooth scroll for nav links
   - FAQ accordion click handlers
   - IntersectionObserver fade-in animations

5. RESPONSIVE — mobile-first. Nav collapses to hamburger below 768px. Grids stack to single column. Font sizes scale with clamp().

6. TECHNICAL — single HTML file. ALL CSS in <style>. ALL JS in <script>. No external dependencies, no CDN, no external fonts (system font stack). No external images — use CSS gradients, SVG, and emoji for visuals.

7. ACCESSIBILITY — semantic HTML5, ARIA labels on interactive elements, keyboard-navigable, sufficient color contrast (WCAG 2.1 AA).

8. GOOGLE COMPLIANCE — this is a programmatic SEO page. It must be people-first and useful even without search traffic. Do NOT use keyword stuffing, fake testimonials, fake locations, or doorway-page patterns. Each page must have unique, genuine content with real service specifics. Include proper meta tags, canonical URL, and semantic heading hierarchy. Include LocalBusiness or Service structured data when relevant.

9. NEARME/NEARYOU DOMAIN — the site should be designed for deployment on a nearme.com or nearyou.com domain pattern. Include clear service+location intent in the title, H1, and content. Use natural "near me" / "near you" intent language without keyword stuffing.

Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown fences, no explanation.`;

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
      spec_score: 0,
      repair_round: 0,
      created_variants: 0,
      created_backlinks: 0,
      rendered: false,
      html_length: 0
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

      // STEP 1b: Fetch Google compliance rules and matching lead opportunity
      const { items: complianceRules } = await base44.asServiceRole.entities.GoogleComplianceRule.filter(
        { status: { $in: ['AVOID', 'SAFE'] } },
        { sort: 'display_order', limit: 15, fields: ['rule', 'status', 'operational_requirement', 'gate_action'] }
      );

      const complianceCtx = complianceRules.map(r =>
        `${r.status === 'AVOID' ? '🚫 AVOID' : '✅ SAFE'}: ${r.rule} — ${r.operational_requirement}`
      ).join('\n');

      // Look up matching lead opportunity for NearMe/NearYou domain strategy
      const { items: opportunities } = await base44.asServiceRole.entities.LeadOpportunity.filter(
        { is_active: true },
        { sort: 'rank', limit: 100, fields: ['service_intent', 'vertical', 'nearme_domain', 'nearyou_domain', 'page_pattern', 'benchmark_cpc', 'benchmark_cpl', 'urgency', 'buyer_value', 'buyer_density', 'deployment_recommendation'] }
      );

      const sentenceLower = sentence.toLowerCase();
      const matchedOpp = opportunities.find(o =>
        sentenceLower.includes(o.service_intent?.toLowerCase().split(' ')[0]) ||
        sentenceLower.includes(o.vertical?.toLowerCase())
      );

      const domainStrategy = matchedOpp
        ? `DOMAIN STRATEGY: nearme.com (${matchedOpp.nearme_domain}) / nearyou.com (${matchedOpp.nearyou_domain})
URL PATTERN: ${matchedOpp.page_pattern}
DEPLOYMENT: ${matchedOpp.deployment_recommendation}
MONETIZATION: CPC $${matchedOpp.benchmark_cpc} / CPL $${matchedOpp.benchmark_cpl} | Urgency ${matchedOpp.urgency}/10 | Buyer Value ${matchedOpp.buyer_value}/10 | Buyer Density ${matchedOpp.buyer_density}/10`
        : `DOMAIN STRATEGY: Use nearme.com/nearyou.com pattern — {service}nearme.com and {service}nearyou.com
URL PATTERN: /{country}/{region}/{city}/{service-slug}/
DEPLOYMENT: Hub subfolder first; standalone domain only after proof`;

      // STEP 2: Convert sentence into production-grade prompt
      await base44.entities.FactoryBatch.update(batch.id, { current_step: 'converting_prompt' });

      const promptResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the Visual X Autonomous Orchestrator. Convert this one sentence into a production-grade website creation prompt that is 100% compliant with Google programmatic SEO methods.

BENCHMARK REFERENCES (the generated site MUST match or exceed these):
${benchmarkCtx}

GOOGLE COMPLIANCE RULES (MUST enforce all):
${complianceCtx}

${domainStrategy}

INPUT SENTENCE: ${sentence}
TARGET INDUSTRY: ${industry || 'General'}

Generate a comprehensive website creation prompt that includes:
1. Complete site architecture (pages, navigation, sections)
2. Conversion-optimized UX patterns derived from the benchmarks
3. SEO-optimized content structure with target keywords — each page MUST have unique title, H1, meta description, and intro (no token swaps)
4. Lead generation funnel integration (contact forms, click-to-call, quote requests)
5. Responsive design specs (mobile, tablet, desktop)
6. Trust signals and social proof — ONLY genuine, attributable proof (no fabricated reviews or testimonials)
7. Performance targets (Core Web Vitals, load time)
8. Accessibility requirements (WCAG 2.1 AA)
9. Content differentiation: each page must add meaningful value beyond service/city token swaps — real service specifics, real local specifics, interactive utility, or expert insight
10. NearMe/NearYou domain strategy integration

CRITICAL: The generated site must NOT be a doorway page, must NOT use keyword stuffing, must NOT mass-generate unoriginal content, and must NOT use fake locations or reviews. Every page must be people-first and useful even without search traffic.

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

Define the full specification including all pages, components, data models, integrations, and acceptance criteria.

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

      // STEP 4: Spec-level QA Audit (evaluates the prompt and spec, not the rendered HTML)
      const specQaResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the Visual X Spec-Level QA Auditor. Evaluate this website specification and prompt for completeness and quality. Score each dimension 0-100.

PROMPT: ${promptResult.prompt}
SPECIFICATION: ${specResult.specification}

Score: visual_parity (0-25), functionality (0-20), accessibility (0-15), responsive_ux (0-10), performance (0-10), security (0-10), content_trust_seo (0-5), reliability (0-5).
Calculate total_score as the sum. Set decision: "pass" if >= 95, "repair" if 70-94, "block" if < 70.

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

      const specScore = specQaResult.total_score || 0;

      await base44.entities.FactoryBatch.update(batch.id, {
        current_step: 'rendering',
        qa_result: JSON.stringify(specQaResult),
        spec_score: specScore
      });

      // STEP 5: RENDER actual HTML (the key upgrade — from prompt to rendered website)
      const renderMeta = RENDER_META_PROMPT
        .replace('{PROMPT}', promptResult.prompt)
        .replace('{BENCHMARKS}', benchmarkCtx);

      const renderRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: renderMeta,
        model: "gemini_3_flash"
      });

      let html = typeof renderRes === 'string' ? renderRes : (renderRes && renderRes.response) || String(renderRes || '');
      html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      if (!html.toLowerCase().startsWith('<!doctype') && !html.toLowerCase().startsWith('<html')) {
        html = `<!DOCTYPE html>\n<html lang="en">\n${html}\n</html>`;
      }

      await base44.entities.FactoryBatch.update(batch.id, {
        current_step: 'validating',
        status: 'validating',
        rendered: true,
        html_length: html.length
      });

      // STEP 6: INDEPENDENT VALIDATION of the rendered HTML (not the prompt — the actual HTML)
      // This is the independent validator: it evaluates the rendered output, not the builder's self-report
      const htmlForValidation = html.substring(0, 12000); // truncate for the LLM prompt

      const validationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the Visual X INDEPENDENT VALIDATOR. You are separate from the builder. Your job is to evaluate the ACTUAL RENDERED HTML, not the prompt that generated it.

BRIEF: ${sentence}
INDUSTRY: ${industry || 'General'}
BENCHMARK REFERENCES: ${benchmarkCtx}

RENDERED HTML TO EVALUATE:
"""
${htmlForValidation}
"""

Evaluate the actual HTML for these dimensions (score 0 to max):
- visual_parity (0-25): Does the HTML contain proper visual design — gradients, shadows, typography hierarchy, color system, polished layout matching benchmark patterns?
- functionality (0-20): Does the HTML have working JS — hamburger toggle, FAQ accordion, smooth scroll, IntersectionObserver animations? Are all required sections present (nav, hero, features, how-it-works, testimonials, FAQ, CTA, footer)?
- accessibility (0-15): Does the HTML use semantic HTML5, ARIA labels, keyboard-navigable elements, sufficient color contrast, proper heading hierarchy?
- responsive_ux (0-10): Does the CSS use clamp() for fonts, media queries for mobile, flexbox/grid for layout, hamburger below 768px?
- performance (0-10): Is the HTML self-contained (no external deps), optimized, using system fonts, CSS gradients instead of images?
- security (0-10): Is the HTML safe — no inline event handlers in HTML attributes, no eval, no external scripts, proper sandboxing?
- content_trust_seo (0-5): Is the content realistic and industry-specific? Are there proper meta tags, semantic structure, trust signals?
- reliability (0-5): Does the JS have error handling? Are there fallback states? Is the code well-structured?

GOOGLE COMPLIANCE CHECKS (any failure = decision "block"):
- Keyword stuffing (unnatural repetition of keywords)
- Fake testimonials or fabricated reviews
- Doorway page pattern (little unique value, just token-swapped content)
- Fake locations or invented service areas
- Missing unique title, meta description, or H1
- No people-first value (content not useful without search traffic)

HARD GATES (any failure = decision "block"):
- Missing required section (nav, hero, features, testimonials, FAQ, CTA, footer)
- External dependencies (CDN, external scripts, external images)
- No JavaScript interactivity at all
- Inaccessible (no semantic HTML, no ARIA)
- Any Google compliance violation above

DECISION RULES:
- "pass": total >= 95 AND no hard gate failure AND no Google compliance violation
- "repair": total 70-94 OR minor issues that can be fixed
- "block": total < 70 OR any hard gate failure OR any Google compliance violation

Return JSON with each score, total_score, decision, findings (array of specific defects with evidence from the HTML), and evidence_summary.`,
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
            compliance_findings: { type: "array", items: { type: "string" } },
            evidence_summary: { type: "string" }
          }
        }
      });

      const finalScore = validationResult.total_score || 0;

      await base44.entities.FactoryBatch.update(batch.id, {
        current_step: 'scoring',
        validation_result: JSON.stringify(validationResult),
        quality_score: finalScore
      });

      // STEP 7: If score < 95, generate repair suggestions (bounded to 3 rounds by default)
      let refinement = null;
      if (finalScore < 95) {
        await base44.entities.FactoryBatch.update(batch.id, {
          current_step: 'refining',
          repair_round: 1
        });

        refinement = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are the Visual X Repair Engineer. The independent validator scored this rendered HTML ${finalScore}/100 (decision: ${validationResult.decision}).

VALIDATOR FINDINGS:
${JSON.stringify(validationResult.findings, null, 2)}

EVIDENCE SUMMARY:
${validationResult.evidence_summary || 'N/A'}

Generate specific, actionable repair instructions to fix each finding and reach 95+/100. Each repair must identify the root cause and the smallest effective fix.

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
      const finalStatus = finalScore >= 95 ? 'ready' : 'needs_refinement';
      await base44.entities.FactoryBatch.update(batch.id, {
        status: finalStatus,
        current_step: 'complete',
        quality_score: finalScore
      });

      // Create audit log
      await base44.entities.AuditLog.create({
        entity_type: 'factory_batch',
        entity_id: batch.id,
        action: 'validate',
        user_email: user.email,
        details: `Batch completed: spec=${specScore}/100, rendered=${finalScore}/100, decision=${validationResult.decision}`,
        severity: validationResult.decision === 'block' ? 'critical' : 'info'
      });

      return Response.json({
        batch_id: batch.id,
        status: finalStatus,
        spec_score: specScore,
        quality_score: finalScore,
        decision: validationResult.decision,
        prompt: promptResult,
        spec: specResult,
        spec_qa: specQaResult,
        validation: validationResult,
        refinement,
        html,
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
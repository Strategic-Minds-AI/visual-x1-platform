import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const content = String(body.content || '').trim();
    if (content.length < 120) {
      return Response.json({ error: 'Paste at least a paragraph or two of page content.' }, { status: 400 });
    }

    const industry = String(body.industry || 'general services').slice(0, 120);
    const keyword = String(body.target_keyword || '').slice(0, 160);
    const excerpt = content.slice(0, 12000);

    const verdict = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Visual X Content Judge. You score page copy for how three different search surfaces read it, then test alternative hooks. Be specific and quote the copy where you can.

INDUSTRY: ${industry}
TARGET KEYWORD: ${keyword || 'not supplied'}

PAGE CONTENT:
"""
${excerpt}
"""

Score 0-100 on each:
- seo_score: classic organic readiness — intent match for the target keyword, heading structure, natural keyword use (penalise stuffing), specificity, depth, internal linking opportunities, title/meta quality implied by the copy.
- geo_score: how citable this copy is by generative engines (AI Overviews, ChatGPT, Perplexity) — original specifics, numbers/dates/provenance, entity clarity, claims that stand alone as a quotable answer, absence of vague filler.
- aeo_score: answer-engine readiness — direct question-and-answer structure, definitions, FAQ blocks, concise scannable answers, speakable phrasing, comparison-ready facts.

Then:
- findings: every material issue with area (seo | geo | aeo | content | conversion), the issue, the concrete fix, and severity (critical | high | medium | low). Do not invent issues that are not in the copy.
- hook_variants: 4 alternative opening hooks for this page. For each give the hook text, a short rationale, and integer deltas versus the current copy (seo_delta, geo_delta, aeo_delta, engagement_delta) in the range -20 to +20.
- keyword_suggestions: real search phrases this page should also target based on its content.
- quick_wins: the smallest edits with the largest expected effect.
- summary: two sentences on what is working and what is holding the page back.

No guarantees about rankings. Return JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          seo_score: { type: 'number' },
          geo_score: { type: 'number' },
          aeo_score: { type: 'number' },
          summary: { type: 'string' },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                area: { type: 'string' },
                issue: { type: 'string' },
                fix: { type: 'string' },
                severity: { type: 'string' },
              },
            },
          },
          hook_variants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                hook: { type: 'string' },
                rationale: { type: 'string' },
                seo_delta: { type: 'number' },
                geo_delta: { type: 'number' },
                aeo_delta: { type: 'number' },
                engagement_delta: { type: 'number' },
              },
            },
          },
          keyword_suggestions: { type: 'array', items: { type: 'string' } },
          quick_wins: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    return Response.json({
      ...verdict,
      overall: Math.round((((verdict.seo_score || 0) + (verdict.geo_score || 0) + (verdict.aeo_score || 0)) / 3) * 10) / 10,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
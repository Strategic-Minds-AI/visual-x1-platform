import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { prompt } = body;
    if (!prompt || prompt.trim().length < 3) {
      return Response.json({ error: 'A prompt of at least 3 characters is required' }, { status: 400 });
    }

    const metaPrompt = `You are an elite prompt engineering simulator with five specialized sub-agents. Analyze the following prompt comprehensively and return a structured JSON assessment.

PROMPT TO ANALYZE:
"""
${prompt}
"""

Run these five analyses:

1. QA_AGENT — Review the prompt for quality. Score it 0-100. List specific issues (vagueness, missing constraints, ambiguous instructions). Provide actionable suggestions to fix each issue.

2. VALIDATOR — Check if the prompt contains the structural elements of a production-grade prompt: role definition, objective, context, step-by-step instructions, constraints, validation criteria, output format. List which are missing. Give a structure_score 0-100.

3. RECOMMENDER — Suggest 3-5 specific improvements that would make this prompt more effective. List 2-4 related prompt categories (e.g., "Website Building", "System Architecture", "Funnel Systems", "Reverse Engineering", "Validation & Testing", "Deployment & Launch").

4. ENHANCER — Rewrite the prompt into a maximally optimized, production-grade version. Include all missing structural elements. Make it as technically precise and articulated as possible. List the specific improvements you made.

5. NEGATIVE_FLAGGER — Scan for any negative, weak, harmful, or problematic patterns in the prompt (e.g., vague language, missing safety constraints, potential for misuse, injection-susceptible phrasing, destructive instructions, copyright violations). For each flag, provide: the exact pattern, severity (low/medium/high/critical), why it's a problem, and a concrete replacement phrase that fixes it. If no negative patterns are found, return an empty array.

Return ONLY valid JSON matching this structure:
{
  "qa_review": { "score": number, "issues": [string], "suggestions": [string] },
  "validation": { "valid": boolean, "missing_elements": [string], "structure_score": number },
  "recommendations": { "improvements": [string], "related_categories": [string] },
  "enhancement": { "enhanced_prompt": string, "improvements_made": [string] },
  "negative_flags": [{ "pattern": string, "severity": "low"|"medium"|"high"|"critical", "suggestion": string, "replacement": string }]
}`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: metaPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          qa_review: {
            type: "object",
            properties: {
              score: { type: "number" },
              issues: { type: "array", items: { type: "string" } },
              suggestions: { type: "array", items: { type: "string" } }
            }
          },
          validation: {
            type: "object",
            properties: {
              valid: { type: "boolean" },
              missing_elements: { type: "array", items: { type: "string" } },
              structure_score: { type: "number" }
            }
          },
          recommendations: {
            type: "object",
            properties: {
              improvements: { type: "array", items: { type: "string" } },
              related_categories: { type: "array", items: { type: "string" } }
            }
          },
          enhancement: {
            type: "object",
            properties: {
              enhanced_prompt: { type: "string" },
              improvements_made: { type: "array", items: { type: "string" } }
            }
          },
          negative_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pattern: { type: "string" },
                severity: { type: "string" },
                suggestion: { type: "string" },
                replacement: { type: "string" }
              }
            }
          }
        }
      }
    });

    const result = typeof llmRes === 'string' ? JSON.parse(llmRes) : llmRes;

    return Response.json({ prompt, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const NEGATIVE_PATTERNS = [
  /ignore (previous|prior|above|all) (instructions|prompts|rules|guidelines)/i,
  /disregard (all|previous|prior|the) (prompts|instructions|rules)/i,
  /you are now (a|an) (different|new|evil|unrestricted)/i,
  /(reveal|show|print|output) (your|the) (system|initial|hidden) (prompt|instructions)/i,
  /jailbreak/i,
  /bypass (safety|content|filter|restrictions|guardrails)/i,
  /(generate|create|write|build) (malware|virus|exploit|phishing|ransomware|trojan|keylogger)/i,
  /hack (into|a|the|this)/i,
  /(illegal|unlawful|criminal) (activity|content|request)/i,
  /(steal|exfiltrate|extract) (data|credentials|passwords|tokens|secrets)/i,
  /inject (malicious|harmful|exploit) (code|payload|content)/i,
  /(ddos|denial of service|sql injection|xss|cross.site.scripting)/i,
  /(bomb|weapon|explosive|poison|toxin) (instructions|recipe|blueprint|guide)/i,
  /(pirate|crack|unlock|bypass) (software|license|drm|subscription|paywall)/i,
  /(dark web|black market|illegal marketplace)/i,
  /(self.harm|suicide|hurt myself|end my life)/i,
  /(dox|doxxing|swat|swatting)/i,
  /(deepfake|impersonate) (someone|celebrity|official|government)/i,
  /(counterfeit|fake) (id|passport|certificate|currency|product)/i,
  /(launder|laundering) (money|funds)/i
];

function validateInput(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, reason: 'No idea provided. Describe what you want to build.' };
  }
  const trimmed = text.trim();
  if (trimmed.length < 3) {
    return { valid: false, reason: 'Idea too short. Provide at least a few words.' };
  }
  if (trimmed.length > 2000) {
    return { valid: false, reason: 'Idea too long. Keep it under 2000 characters.' };
  }
  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'Idea blocked by safety validator: potentially harmful pattern detected.' };
    }
  }
  return { valid: true };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { idea, pattern_name, pattern_prompt, pattern_metadata } = body;
    if (!idea) return Response.json({ error: 'idea is required' }, { status: 400 });

    const validation = validateInput(idea);
    if (!validation.valid) return Response.json({ error: validation.reason, flagged: true }, { status: 400 });

    const patternContext = pattern_prompt
      ? `The user has selected the "${pattern_name}" system pattern. Use this pattern as the foundation:
${pattern_prompt}

Pattern metadata for context:
- Use cases: ${pattern_metadata?.use_cases?.join(', ') || 'general'}
- Components: ${pattern_metadata?.components?.join(', ') || 'standard'}
- Data requirements: ${pattern_metadata?.data_requirements?.join(', ') || 'standard'}
- Integrations: ${pattern_metadata?.integrations?.join(', ') || 'standard'}
- Security risks to address: ${pattern_metadata?.security_risks?.join(', ') || 'standard'}
- Visual conventions: ${pattern_metadata?.visual_conventions?.join(', ') || 'modern'}
- Tests required: ${pattern_metadata?.tests?.join(', ') || 'standard'}
- Compatible add-on patterns: ${pattern_metadata?.compatible_patterns?.join(', ') || 'none specified'}`
      : 'No specific pattern selected. Produce a general-purpose but highly detailed specification.';

    const metaPrompt = `You are an elite prompt engineer and product architect for the Strategic Minds AI Prompt Lab.

Your job: take a one-sentence idea and a selected system pattern, and produce TWO outputs:
1. A refined, production-grade prompt that another AI system can execute to build the product.
2. A structured product specification with data contracts, acceptance criteria, components, integrations, and risks.

SELECTED PATTERN:
${patternContext}

ONE-SENTENCE IDEA:
"""${idea}"""

RULES FOR THE REFINED PROMPT:
- Single, self-contained prompt ready to paste into any AI coding or generation system.
- Structure with: ROLE, OBJECTIVE, CONTEXT, STEP-BY-STEP INSTRUCTIONS, CONSTRAINTS, VALIDATION CRITERIA, EDGE CASES, OUTPUT FORMAT.
- Include built-in validation steps that prevent errors, broken builds, and security issues.
- Ensure the prompt is ethical and safe — explicitly reject harmful, illegal, or destructive outputs.
- Be specific, actionable, and unambiguous — no vague language.
- Include success criteria so the result can be objectively verified.
- Add a final self-check step where the executing system verifies its own output before returning it.
- Use clearly labeled illustrative content unless actual data is provided — never fabricate real testimonials or claims.

RULES FOR THE PRODUCT SPEC:
- summary: 2-3 sentence product summary.
- data_contracts: list of entities with their key fields and relationships.
- acceptance_criteria: list of testable criteria the product must meet.
- components: list of UI/backend components to build.
- integrations: list of external services to connect.
- risks: list of technical, security, and business risks to mitigate.

Return ONLY a JSON object with this exact structure:
{
  "refined_prompt": "...",
  "assumptions": ["...", "..."],
  "product_spec": {
    "summary": "...",
    "data_contracts": ["...", "..."],
    "acceptance_criteria": ["...", "..."],
    "components": ["...", "..."],
    "integrations": ["...", "..."],
    "risks": ["...", "..."]
  }
}`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: metaPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          refined_prompt: { type: "string" },
          assumptions: { type: "array", items: { type: "string" } },
          product_spec: {
            type: "object",
            properties: {
              summary: { type: "string" },
              data_contracts: { type: "array", items: { type: "string" } },
              acceptance_criteria: { type: "array", items: { type: "string" } },
              components: { type: "array", items: { type: "string" } },
              integrations: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } }
            },
            required: ["summary", "data_contracts", "acceptance_criteria", "components", "integrations", "risks"]
          }
        },
        required: ["refined_prompt", "assumptions", "product_spec"]
      }
    });

    const result = typeof llmRes === 'object' && llmRes !== null ? llmRes : null;

    if (!result || !result.refined_prompt) {
      return Response.json({ error: 'Compilation failed: no valid output from model.' }, { status: 500 });
    }

    return Response.json({
      idea,
      pattern_name: pattern_name || 'general',
      refined_prompt: result.refined_prompt,
      assumptions: result.assumptions || [],
      product_spec: result.product_spec || {},
      validated: true
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
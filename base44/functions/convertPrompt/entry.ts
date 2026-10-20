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

function validateInput(sentence) {
  if (!sentence || typeof sentence !== 'string') {
    return { valid: false, reason: 'No request provided. Describe what you want to build or do.' };
  }
  const trimmed = sentence.trim();
  if (trimmed.length < 3) {
    return { valid: false, reason: 'Request too short. Provide at least a few words describing what you want.' };
  }
  if (trimmed.length > 2000) {
    return { valid: false, reason: 'Request too long. Keep it under 2000 characters.' };
  }
  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'Request blocked by safety validator: potentially negative, harmful, or prompt-injection pattern detected.' };
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
    const { sentence, category } = body;
    if (!sentence) return Response.json({ error: 'sentence is required' }, { status: 400 });

    const validation = validateInput(sentence);
    if (!validation.valid) return Response.json({ error: validation.reason, flagged: true }, { status: 400 });

    const categoryContext = category && category !== 'general'
      ? `The prompt should be optimized for this domain: ${category}. Tailor the instructions, constraints, and success criteria to ${category} best practices.`
      : 'The prompt should be general-purpose but highly detailed and production-quality.';

    // Fetch benchmark references for the category to use as quality targets
    let benchmarkContext = '';
    try {
      let benchmarkQuery = { is_active: true };
      if (category && category !== 'general') {
        benchmarkQuery = { is_active: true, $or: [
          { industry: { $regex: category, $options: 'i' } },
          { sub_industry: { $regex: category, $options: 'i' } },
          { site_type: { $regex: category, $options: 'i' } }
        ]};
      }
      const benchmarkPage = await base44.entities.BenchmarkReference.filter(
        benchmarkQuery,
        { sort: '-ux_score', limit: 5, fields: ['name', 'url', 'ux_score', 'key_patterns', 'description', 'sub_industry'] }
      );
      const benchmarkItems = benchmarkPage.items || benchmarkPage;
      if (benchmarkItems.length > 0) {
        benchmarkContext = `\n\nBENCHMARK QUALITY REFERENCES (top ${benchmarkItems.length} sites — the output MUST match or exceed this quality bar):\n` +
          benchmarkItems.map(b =>
            `- ${b.name} (${b.url}) — UX Score: ${b.ux_score}/100${b.sub_industry ? ` [${b.sub_industry}]` : ''}\n  Key Patterns: ${b.key_patterns}\n  Why it works: ${b.description}`
          ).join('\n');
      }
    } catch (e) { /* benchmarks optional */ }

    const metaPrompt = `You are an elite prompt engineer for the Visual X autonomous quality system. Convert the following minimal request into an ultra-high-performance, mandatory-quality prompt that another AI system can execute to produce world-class results.

Rules for the output prompt:
- It must be a single, self-contained prompt ready to paste into any AI coding or generation system.
- Structure it with clear sections: ROLE, OBJECTIVE, CONTEXT, STEP-BY-STEP INSTRUCTIONS, CONSTRAINTS, VALIDATION CRITERIA, EDGE CASES, and OUTPUT FORMAT.
- Include built-in validation steps that prevent errors, broken builds, and security issues.
- Ensure the prompt is ethical and safe — it must explicitly reject harmful, illegal, or destructive outputs.
- Be specific, actionable, and unambiguous — no vague language.
- Include success criteria so the result can be objectively verified.
- Add a final self-check step where the executing system verifies its own output before returning it.
- MANDATORY: Reference the benchmark quality targets below. The output must match or exceed the UX scores, design patterns, and quality standards of these benchmarks.
- Include specific design patterns from the benchmarks that should be implemented.
- Set a minimum quality threshold of 95/100 across visual, functional, accessibility, performance, and security dimensions.
${benchmarkContext}

${categoryContext}

Minimal request to convert: """${sentence}"""

Return ONLY the advanced prompt text, no preamble, no explanation, no markdown code fences around the whole thing.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: metaPrompt });
    const advancedPrompt = typeof llmRes === 'string' ? llmRes : (llmRes && llmRes.response) || String(llmRes || '');

    return Response.json({
      original: sentence,
      advanced: advancedPrompt,
      category: category || 'general',
      validated: true
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
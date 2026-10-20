import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { project_id, prompt_version_id, audit_source, findings, severity } = body;

    if (!project_id || !findings) {
      return Response.json({ error: 'project_id and findings are required' }, { status: 400 });
    }

    let currentPrompt = '';
    if (prompt_version_id) {
      try {
        const pv = await base44.entities.PromptVersion.get(prompt_version_id);
        currentPrompt = pv?.prompt_text || '';
      } catch (e) { /* prompt may not exist yet */ }
    }

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Visual X QA Refinement Engine. Based on audit findings, generate specific prompt refinement suggestions that will improve future prompt generation.

Current prompt:
${currentPrompt}

Audit source: ${audit_source || 'qa_audit'}

Audit findings:
${JSON.stringify(findings, null, 2)}

Generate a JSON response with:
1. "suggestions": array of specific, actionable refinement suggestions (each 1-2 sentences)
2. "refined_prompt": the improved full prompt text incorporating all suggestions
3. "learning_note": what the system should learn from this for future prompt generation (1-2 sentences)`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: { type: "array", items: { type: "string" } },
          refined_prompt: { type: "string" },
          learning_note: { type: "string" }
        },
        required: ["suggestions", "refined_prompt", "learning_note"]
      }
    });

    const refinement = await base44.entities.QARefinement.create({
      project_id,
      prompt_version_id: prompt_version_id || '',
      audit_source: audit_source || 'qa_audit',
      findings: JSON.stringify(findings),
      suggestions: JSON.stringify(llmResult.suggestions || []),
      refined_prompt: llmResult.refined_prompt || '',
      severity: severity || 'medium',
      status: 'pending',
      learning_note: llmResult.learning_note || ''
    });

    await base44.entities.AuditLog.create({
      entity_type: 'qa_refinement',
      entity_id: refinement.id,
      action: 'create',
      user_email: user.email,
      details: `QA refinement created from ${audit_source} with ${(llmResult.suggestions || []).length} suggestions`,
      severity: 'info'
    });

    return Response.json({
      refinement,
      suggestions: llmResult.suggestions,
      refined_prompt: llmResult.refined_prompt,
      learning_note: llmResult.learning_note
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
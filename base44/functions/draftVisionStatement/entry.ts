import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Expands the client's one-sentence outcome into a structured vision statement, and suggests
// which of the listed automation tools that vision implies. The client's own answers are the
// only source; nothing here invents facts about their business.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const seed = String(body.seed_sentence || '').slice(0, 600).trim();
    const context = String(body.context || '').slice(0, 1500);
    const tools = (Array.isArray(body.tools) ? body.tools : []).slice(0, 60).map((t) => ({
      id: String(t.id || '').slice(0, 60),
      label: String(t.label || '').slice(0, 120),
    }));
    if (seed.length < 8) {
      return Response.json({ error: 'Add one sentence describing the outcome you want.' }, { status: 400 });
    }

    const toolList = tools.map((t) => `${t.id}: ${t.label}`).join('\n');
    const prompt = `You are the strategy lead for an agency that builds AI-operated websites, marketing systems and automations for local and service businesses.

The client wrote this one sentence describing the outcome they want:
"${seed}"

Additional context they gave (may be empty):
"${context}"

Rewrite that sentence into a formal vision statement for their business. Then extract the structured fields behind it. Rules:
- Be specific and concrete. Use the client's own words and industry where they gave them.
- Do not invent facts about their business, revenue, location or history.
- success_definition must describe what winning looks like in measurable terms for THIS client.
- From the tool catalog below, list the tool ids that this vision clearly implies. Only include tools that follow from what they said.
- clarifying_questions: 2-3 questions whose answers would sharpen the plan. Only ask what they have not already answered.

Tool catalog (id: label)
${toolList}

Return JSON only.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          vision_statement: { type: 'string' },
          industry_focus: { type: 'string' },
          financial_focus: { type: 'string' },
          autonomy_level: { type: 'string' },
          risk_tolerance: { type: 'string' },
          time_horizon: { type: 'string' },
          success_definition: { type: 'string' },
          differentiators: { type: 'array', items: { type: 'string' } },
          recommended_tool_ids: { type: 'array', items: { type: 'string' } },
          clarifying_questions: { type: 'array', items: { type: 'string' } },
        },
        required: ['vision_statement', 'industry_focus', 'success_definition', 'recommended_tool_ids', 'clarifying_questions'],
      },
    });

    const vision = result && typeof result === 'object' ? result : { vision_statement: String(result || '') };
    const validIds = new Set(tools.map((t) => t.id));
    const recommended = (Array.isArray(vision.recommended_tool_ids) ? vision.recommended_tool_ids : [])
      .map((id) => String(id))
      .filter((id) => validIds.has(id));

    return Response.json({
      vision: { ...vision, recommended_tool_ids: recommended },
      note: 'Expanded from the client\'s own sentence and answers. Edited before saving if anything reads wrong.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
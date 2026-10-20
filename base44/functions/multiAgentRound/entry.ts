import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_AGENTS = 6;

// A round: each seated agent answers in turn, seeing everything said before it,
// then a moderator closes with agreements and open questions.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const ids = Array.isArray(body.agent_ids) ? body.agent_ids.filter(Boolean).slice(0, MAX_AGENTS) : [];
    const topic = String(body.topic || '').trim();
    const rounds = Math.min(Math.max(Number(body.rounds) || 1, 1), 2);
    const prior = Array.isArray(body.transcript) ? body.transcript.slice(-40) : [];

    if (ids.length < 2) return Response.json({ error: 'Seat at least two agents.' }, { status: 400 });
    if (!topic) return Response.json({ error: 'Give the room a topic.' }, { status: 400 });

    const agentsRes = await base44.entities.Agent.filter({ id: { $in: ids } }, { limit: MAX_AGENTS });
    const agents = (agentsRes.items || []).filter((a) => ids.includes(a.id));
    if (agents.length < 2) return Response.json({ error: 'Those agents could not be loaded.' }, { status: 400 });

    const [knowledgeRes, rolesRes] = await Promise.all([
      base44.entities.Knowledge.filter({}, { limit: 6 }),
      base44.entities.SystemRole.filter({}, { sort: 'priority_order', limit: 8 })
    ]);
    const knowledgeText = (knowledgeRes.items || []).map((k) => `- ${k.title}: ${k.content}`).join('\n') || 'None.';
    const rolesText = (rolesRes.items || []).map((r) => `- ${r.name}: ${r.description}`).join('\n') || 'None.';

    const transcript = prior.map((m) => ({ ...m, round: m.round || 0 }));

    for (let round = 1; round <= rounds; round++) {
      for (const agent of agents) {
        const said = transcript.map((m) => `${m.name}: ${m.content}`).join('\n\n') || 'Nobody has spoken yet.';
        const prompt = `You are ${agent.name}, a ${agent.role} agent${agent.specialization ? ` specializing in ${agent.specialization}` : ''} in a multi-agent working group.
${agent.system_prompt || 'You are a capable, direct specialist.'}

System roles for context:
${rolesText}

Shared knowledge:
${knowledgeText}

The group is working on: "${topic}"

The room so far:
${said}

You are speaking now. Advance the group's thinking: build on or disagree with what was said, bring your own specialty, and be concrete. If a previous speaker was wrong, say so and why. Under 180 words. Do not greet anyone or repeat the topic back.`;

        const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
        const content = typeof res === 'string' ? res : (res && res.response) || String(res || '');
        transcript.push({
          agent_id: agent.id,
          name: agent.name,
          role: agent.role,
          avatar_color: agent.avatar_color || '#6366f1',
          round,
          content: content.trim()
        });
      }
    }

    const synthesisPrompt = `You are the neutral moderator of a multi-agent working group.

Topic: "${topic}"

What was said:
${transcript.map((m) => `${m.name} (${m.role}, round ${m.round}): ${m.content}`).join('\n\n')}

Write the closing note: what the group actually agreed on, where they genuinely disagreed, and the single next action that follows. Separate agreement from opinion — if something was asserted without support, say it was asserted, not established. Under 200 words, plain prose, no headings.`;
    const synthRes = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: synthesisPrompt });
    const synthesis = (typeof synthRes === 'string' ? synthRes : (synthRes && synthRes.response) || String(synthRes || '')).trim();

    await Promise.allSettled(
      transcript.filter((m) => m.round > 0).slice(-12).map((m) =>
        base44.entities.AgentMessage.create({
          from_agent_id: m.agent_id,
          to_agent_id: 'group',
          content: m.content,
          message_type: 'discussion'
        })
      )
    );

    return Response.json({
      transcript,
      synthesis,
      agent_count: agents.length,
      rounds,
      model_calls: agents.length * rounds + 1
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
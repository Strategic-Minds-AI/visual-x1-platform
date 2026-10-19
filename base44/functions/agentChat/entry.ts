import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { agent_id, message, job_id } = body;
    if (!agent_id || !message) return Response.json({ error: 'agent_id and message are required' }, { status: 400 });

    const agent = await base44.entities.Agent.get(agent_id);
    if (!agent) return Response.json({ error: 'Agent not found' }, { status: 404 });

    const [memoriesRes, knowledgeRes] = await Promise.all([
      base44.entities.Memory.filter({ agent_id }, { limit: 15, sort: '-importance' }),
      base44.entities.Knowledge.filter({}, { limit: 8 })
    ]);

    const memoryText = (memoriesRes.items || []).map(m => `- ${m.content}`).join('\n') || 'No memories yet.';
    const knowledgeText = (knowledgeRes.items || []).map(k => `- ${k.title}: ${k.content}`).join('\n') || 'None.';

    const prompt = `You are ${agent.name}, a ${agent.role} agent${agent.specialization ? ' specializing in ' + agent.specialization : ''}.
${agent.system_prompt || 'You are a helpful, capable AI agent in a multi-agent workforce.'}

Your memories:
${memoryText}

Relevant knowledge from the knowledge base:
${knowledgeText}

The user (or another agent) says: "${message}"

Respond as ${agent.name}, in character. Be concise, helpful, and draw on your memories and the knowledge base when relevant. If the request involves work, outline how you would approach it.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const responseText = typeof llmRes === 'string' ? llmRes : (llmRes && llmRes.response) || JSON.stringify(llmRes);

    await Promise.allSettled([
      base44.entities.AgentMessage.create({
        from_agent_id: 'user',
        to_agent_id: agent_id,
        content: message,
        job_id: job_id || null,
        message_type: 'request'
      }),
      base44.entities.AgentMessage.create({
        from_agent_id: agent_id,
        to_agent_id: 'user',
        content: responseText,
        job_id: job_id || null,
        message_type: 'response'
      }),
      base44.entities.Memory.create({
        agent_id,
        content: `Interacted with user. They said: "${message}". I responded about this.`,
        memory_type: 'event',
        importance: 5
      })
    ]);

    return Response.json({ response: responseText, agent_name: agent.name, agent_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
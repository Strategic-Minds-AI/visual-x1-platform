import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { from_agent_id, to_agent_id, content, message_type, bridge_to_gpt } = body;

    if (!content) return Response.json({ error: 'content is required' }, { status: 400 });
    if (!from_agent_id) return Response.json({ error: 'from_agent_id is required' }, { status: 400 });

    // Record the outbound message
    const message = await base44.entities.AgentMessage.create({
      from_agent_id,
      to_agent_id: to_agent_id || 'broadcast',
      content,
      message_type: message_type || 'request'
    });

    let gptResponse = null;
    let responseMessage = null;

    // Bridge to GPT: generate an AI-powered response from the target agent's perspective
    if (bridge_to_gpt || to_agent_id === 'gpt') {
      // Load the sending agent's context
      let agent = null;
      if (from_agent_id !== 'user') {
        try {
          agent = await base44.entities.Agent.get(from_agent_id);
        } catch (e) {
          agent = { name: 'User', role: 'coordinator', system_prompt: '' };
        }
      } else {
        agent = { name: 'User', role: 'coordinator', system_prompt: 'You are the human operator of the Strategic Minds AI system.' };
      }

      // Load agent memories for context
      const memPage = await base44.entities.Memory.filter(
        { agent_id: from_agent_id },
        { sort: '-importance', limit: 5 }
      );
      const memories = memPage.items || [];

      // Load recent messages for conversation context
      const msgPage = await base44.entities.AgentMessage.list({ limit: 10 });
      const recentMessages = msgPage.items || [];
      const conversationContext = recentMessages
        .slice(-5)
        .map(m => `${m.from_agent_id}: ${m.content}`)
        .join('\n');

      const contextPrompt = `You are ${agent.name}, a ${agent.role} agent in the Strategic Minds AI multi-agent system.

Your role instructions: ${agent.system_prompt || 'Act as a helpful, decisive agent.'}

Recent memories:
${memories.map(m => `- ${m.content}`).join('\n') || 'No recent memories.'}

Recent conversation:
${conversationContext || 'No prior context.'}

You received this message: "${content}"

Respond as ${agent.name}. Be concise, decisive, and actionable. If you identify a task, state it clearly. If you need another agent's help, say who and why.`;

      const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: contextPrompt
      });
      gptResponse = typeof llmRes === 'string' ? llmRes : (llmRes && llmRes.response) || String(llmRes || '');

      // Record the GPT response as a message
      responseMessage = await base44.entities.AgentMessage.create({
        from_agent_id: to_agent_id === 'gpt' ? 'gpt' : from_agent_id,
        to_agent_id: from_agent_id,
        content: gptResponse,
        message_type: 'response'
      });

      // Save the exchange as a memory
      await base44.entities.Memory.create({
        agent_id: from_agent_id,
        content: `Exchange — Message: ${content}\nResponse: ${gptResponse}`,
        memory_type: 'event',
        importance: 7,
        tags: 'communication,bus,gpt,exchange'
      });
    }

    return Response.json({
      message,
      gpt_response: gptResponse,
      response_message: responseMessage
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
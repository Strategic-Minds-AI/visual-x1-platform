import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CONNECTOR_ID = "69db201897e4e8f9ae073be7";
const TASKS_API = "https://tasks.googleapis.com/tasks/v1";

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

    const [memoriesRes, knowledgeRes, rolesRes] = await Promise.all([
      base44.entities.Memory.filter({ agent_id }, { limit: 15, sort: '-importance' }),
      base44.entities.Knowledge.filter({}, { limit: 8 }),
      base44.entities.SystemRole.filter({}, { sort: 'priority_order', limit: 10 })
    ]);

    const memoryText = (memoriesRes.items || []).map(m => `- ${m.content}`).join('\n') || 'No memories yet.';
    const knowledgeText = (knowledgeRes.items || []).map(k => `- ${k.title}: ${k.content}`).join('\n') || 'None.';

    const rolesText = (rolesRes.items || []).map(r =>
      `## ${r.name}\nDescription: ${r.description}\nResponsibilities: ${r.responsibilities}\nHandles: ${r.handles || 'N/A'}\nScope: ${r.scope || 'N/A'}`
    ).join('\n\n') || 'No system roles defined yet.';

    const prompt = `You are ${agent.name}, a ${agent.role} agent${agent.specialization ? ' specializing in ' + agent.specialization : ''}.
${agent.system_prompt || 'You are a helpful, capable AI agent in a multi-agent workforce.'}

## SYSTEM ROLES — Know these boundaries
${rolesText}

## Your memories
${memoryText}

## Relevant knowledge from the knowledge base
${knowledgeText}

The user (or another agent) says: "${message}"

Respond as ${agent.name}, in character. Be concise, helpful, and draw on your memories, the knowledge base, and the system role definitions when relevant.

IMPORTANT: If the user is asking you to create a task, todo, or action item, include a JSON block at the END of your response in this exact format:
<<<TASKS>>>
[{"title": "Task title here", "description": "Optional details"}]
<<<END_TASKS>>>
You may include multiple tasks. Only include this block if the user is clearly requesting work to be tracked. Otherwise, omit it entirely.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const responseText = typeof llmRes === 'string' ? llmRes : (llmRes && llmRes.response) || String(llmRes || '');

    let cleanResponse = responseText;
    const createdTasks = [];

    const taskMatch = responseText.match(/<<<TASKS>>>([\s\S]*?)<<<END_TASKS>>>/);
    if (taskMatch) {
      cleanResponse = responseText.replace(/<<<TASKS>>>[\s\S]*?<<<END_TASKS>>>/, '').trim();
      try {
        const tasks = JSON.parse(taskMatch[1].trim());
        if (Array.isArray(tasks)) {
          for (const task of tasks.slice(0, 10)) {
            if (task.title) {
              const todo = await base44.entities.Todo.create({
                title: task.title,
                description: task.description || '',
                status: 'pending',
                priority: 'medium',
                assigned_agent_id: agent_id,
                job_id: job_id || null
              });
              createdTasks.push({ id: todo.id, title: task.title });
            }
          }

          // Auto-push new todos to Google Tasks if connected
          if (createdTasks.length > 0) {
            try {
              const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
              const listsRes = await fetch(`${TASKS_API}/users/@me/lists`, {
                headers: { 'Authorization': `Bearer ${conn.accessToken}`, 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000)
              });
              if (listsRes.ok) {
                const listsData = await listsRes.json();
                const tasklist = listsData.items && listsData.items[0] ? listsData.items[0].id : null;
                if (tasklist) {
                  await Promise.allSettled(createdTasks.map(t =>
                    fetch(`${TASKS_API}/lists/${tasklist}/tasks`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${conn.accessToken}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: t.title }),
                      signal: AbortSignal.timeout(10000)
                    }).then(async r => {
                      const created = await r.json();
                      if (created && created.id) {
                        await base44.entities.Todo.update(t.id, { google_task_id: created.id });
                      }
                    })
                  ));
                }
              }
            } catch (e) {
              // Google Tasks not connected — tasks still created locally
            }
          }
        }
      } catch (e) {
        // JSON parse failed — ignore the task block
      }
    }

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
        content: cleanResponse,
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

    return Response.json({
      response: cleanResponse,
      agent_name: agent.name,
      agent_id,
      tasks_created: createdTasks
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
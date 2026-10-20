import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CONNECTOR_ID = "69db201897e4e8f9ae073be7";
const TASKS_API = "https://tasks.googleapis.com/tasks/v1";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { job_id } = body;
    if (!job_id) return Response.json({ error: 'job_id required' }, { status: 400 });

    const job = await base44.entities.Job.get(job_id);
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getWorkspaceConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Google Tasks connector not authorized. Authorize it via the dashboard.', not_connected: true }, { status: 400 });
    }

    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const listsRes = await fetch(`${TASKS_API}/users/@me/lists`, { headers, signal: AbortSignal.timeout(10000) });
    if (!listsRes.ok) return Response.json({ error: `Google Tasks error: ${await listsRes.text()}` }, { status: 502 });
    const listsData = await listsRes.json();
    const lists = listsData.items || [];
    if (lists.length === 0) return Response.json({ error: 'No Google Tasks lists found' }, { status: 400 });

    const tasklist = lists[0].id;

    const taskBody = {
      title: job.title,
      notes: job.description || `Priority: ${job.priority} | Type: ${job.type}`
    };
    if (job.due_date) taskBody.due = job.due_date;

    const taskRes = await fetch(`${TASKS_API}/lists/${tasklist}/tasks`, {
      method: 'POST', headers, body: JSON.stringify(taskBody), signal: AbortSignal.timeout(10000)
    });

    if (!taskRes.ok) return Response.json({ error: `Failed to create task: ${await taskRes.text()}` }, { status: 502 });
    const task = await taskRes.json();

    const todo = await base44.entities.Todo.create({
      title: job.title,
      description: job.description || '',
      status: 'pending',
      priority: job.priority === 'urgent' ? 'high' : (job.priority === 'low' ? 'low' : 'medium'),
      assigned_agent_id: job.assigned_agent_id,
      job_id: job.id,
      google_task_id: task.id
    });

    return Response.json({ success: true, google_task_id: task.id, todo_id: todo.id, job_id: job.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
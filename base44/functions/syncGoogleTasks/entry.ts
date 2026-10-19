import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CONNECTOR_ID = "69db201897e4e8f9ae073be7";
const TASKS_API = "https://tasks.googleapis.com/tasks/v1";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const direction = body.direction || 'both';

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const listsRes = await fetch(`${TASKS_API}/users/@me/lists`, { headers, signal: AbortSignal.timeout(10000) });
    if (!listsRes.ok) {
      const err = await listsRes.text();
      return Response.json({ error: `Google Tasks error: ${err}` }, { status: 502 });
    }
    const listsData = await listsRes.json();
    const tasklist = listsData.items && listsData.items[0] ? listsData.items[0].id : null;
    if (!tasklist) return Response.json({ error: 'No Google Tasks list found' }, { status: 400 });

    let pushed = 0, pulled = 0;

    if (direction === 'push' || direction === 'both') {
      const { items: todos } = await base44.entities.Todo.filter({ status: 'pending' }, { limit: 100 });
      const unsynced = todos.filter(t => !t.google_task_id);
      const results = await Promise.allSettled(unsynced.map(todo =>
        fetch(`${TASKS_API}/lists/${tasklist}/tasks`, {
          method: 'POST', headers,
          body: JSON.stringify({ title: todo.title, notes: todo.description || '' }),
          signal: AbortSignal.timeout(10000)
        }).then(r => r.json())
      ));
      const updates = [];
      results.forEach((res, i) => {
        if (res.status === 'fulfilled' && res.value && res.value.id) {
          updates.push(base44.entities.Todo.update(unsynced[i].id, { google_task_id: res.value.id }));
          pushed++;
        }
      });
      await Promise.allSettled(updates);
    }

    if (direction === 'pull' || direction === 'both') {
      const tasksRes = await fetch(`${TASKS_API}/lists/${tasklist}/tasks?showCompleted=true&maxResults=100`, { headers, signal: AbortSignal.timeout(10000) });
      const tasksData = await tasksRes.json();
      const gTasks = tasksData.items || [];
      const existing = await base44.entities.Todo.filter({ google_task_id: { $exists: true } }, { limit: 100, fields: ['google_task_id'] });
      const knownIds = new Set((existing.items || []).map(t => t.google_task_id));
      const creates = [];
      for (const task of gTasks) {
        if (!knownIds.has(task.id)) {
          creates.push(base44.entities.Todo.create({
            title: task.title,
            description: task.notes || '',
            status: task.completed ? 'completed' : 'pending',
            google_task_id: task.id
          }));
          pulled++;
        }
      }
      await Promise.allSettled(creates);
    }

    return Response.json({ pushed, pulled, direction });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
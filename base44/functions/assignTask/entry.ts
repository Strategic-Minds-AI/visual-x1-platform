import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Assigns work to an agent and pushes it to the operator's own connected systems.
// Google Tasks and Google Calendar go through the workspace connectors this app is
// consented against; the notification is a normal app email. Every push runs in its
// own settled promise, and only the pushes that actually succeeded are recorded as
// channels — a failed push is visible in external_result_json, never assumed.
const TASKS_CONNECTOR = '69db201897e4e8f9ae073be7';
const CALENDAR_CONNECTOR = '6ad09bfbe726b33e8f873406';

const iso = (date) => date.toISOString();
const dueSoon = (hours) => new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1000);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    if (!title) return Response.json({ error: 'title is required' }, { status: 400 });

    const workType = String(body.work_type || 'build');
    const agent = String(body.assigned_agent || 'X1 Orchestrator');
    const priority = String(body.priority || 'medium');
    const detail = String(body.detail || '');
    const requested = Array.isArray(body.channels) ? body.channels.map(String) : ['tasks'];
    const due = dueSoon(Number(body.due_hours) || 48);
    const notifyEmail = body.notify_email || user.email;
    const calendarId = body.calendar_id || 'primary';

    const results = {};
    let calendarEventId = '';
    let googleTaskId = '';

    const pushTasks = async () => {
      const { accessToken } = await service.connectors.getWorkspaceConnection(TASKS_CONNECTOR);
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[${workType}] ${title}`,
          notes: `${detail}\n\nAssigned to ${agent} by ${user.email}.`,
          due: iso(due),
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `Google Tasks returned ${res.status}`);
      googleTaskId = data.id || '';
      return googleTaskId;
    };

    const pushCalendar = async () => {
      const { accessToken } = await service.connectors.getWorkspaceConnection(CALENDAR_CONNECTOR);
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: `[${workType}] ${title}`,
          description: `${detail}\n\nAssigned to ${agent} by ${user.email}.`,
          start: { dateTime: iso(due) },
          end: { dateTime: iso(new Date(due.getTime() + 60 * 60 * 1000)) },
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `Google Calendar returned ${res.status}`);
      calendarEventId = data.id || '';
      return calendarEventId;
    };

    const pushEmail = async () => {
      await service.integrations.Core.SendEmail({
        to: notifyEmail,
        subject: `New assignment: ${title}`,
        body: [
          `Work type: ${workType}`,
          `Assigned to: ${agent}`,
          `Priority: ${priority}`,
          `Due: ${due.toUTCString()}`,
          '',
          detail || 'No further detail was given.',
        ].join('\n'),
      });
      return notifyEmail;
    };

    const jobs = [];
    if (requested.includes('tasks')) jobs.push(['tasks', pushTasks()]);
    if (requested.includes('calendar')) jobs.push(['calendar', pushCalendar()]);
    if (requested.includes('gmail')) jobs.push(['gmail', pushEmail()]);

    const settled = await Promise.allSettled(jobs.map(([, promise]) => promise));
    const landed = [];
    settled.forEach((outcome, index) => {
      const key = jobs[index][0];
      if (outcome.status === 'fulfilled') {
        results[key] = { ok: true, id: outcome.value };
        landed.push(key);
      } else {
        const reason = outcome.reason?.message || String(outcome.reason);
        results[key] = { ok: false, error: reason };
        // A connector that is not consented yet is reported as such, not as a crash.
        if (/connection|consent|not found|unauthor/i.test(reason)) {
          results[key].hint = key === 'calendar'
            ? 'Connect the workspace calendar for this app, then push again.'
            : 'Connect the workspace Google Tasks account for this app, then push again.';
        }
      }
    });

    const todo = await service.entities.Todo.create({
      title,
      description: `${detail}\n\nAssigned to ${agent} (${workType}).`,
      status: 'pending',
      priority: priority === 'critical' ? 'high' : priority,
      due_date: due.toISOString().slice(0, 10),
      assigned_agent_id: body.agent_id || '',
      job_id: body.job_id || '',
    });

    const assignment = await service.entities.TaskAssignment.create({
      title,
      detail,
      work_type: workType,
      assigned_agent: agent,
      agent_id: body.agent_id || '',
      priority,
      status: landed.length ? 'scheduled' : 'open',
      due_at: iso(due),
      channels: landed,
      calendar_event_id: calendarEventId,
      calendar_id: calendarEventId ? calendarId : '',
      google_task_id: googleTaskId,
      drive_ref: body.drive_ref || '',
      notified_at: results.gmail?.ok ? new Date().toISOString() : undefined,
      todo_id: todo.id,
      job_id: body.job_id || '',
      flow_id: body.flow_id || '',
      external_result_json: JSON.stringify(results),
    });

    await service.entities.AuditLog.create({
      entity_type: 'TaskAssignment',
      entity_id: assignment.id,
      action: 'create',
      user_email: user.email,
      details: `Assigned "${title}" to ${agent}; pushed to ${landed.join(', ') || 'no external system'}`,
      severity: landed.length ? 'info' : 'warning',
    });

    return Response.json({
      ok: true,
      assignment_id: assignment.id,
      todo_id: todo.id,
      channels: landed,
      external: results,
      calendar_event_id: calendarEventId,
      google_task_id: googleTaskId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const jobQuery = body.job_id ? { id: body.job_id, status: 'open' } : { status: 'open' };
    const { items: jobs } = await base44.entities.Job.filter(jobQuery, { limit: 50 });
    const { items: agents } = await base44.entities.Agent.filter({ status: 'idle' }, { limit: 50 });

    const sortedJobs = jobs.slice().sort((a, b) =>
      (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0)
    );

    const assignments = [];
    let idx = 0;
    for (const job of sortedJobs) {
      if (idx >= agents.length) break;
      const agent = agents[idx++];
      await base44.entities.Job.update(job.id, { status: 'assigned', assigned_agent_id: agent.id, assigned_at: new Date().toISOString() });
      await base44.entities.Agent.update(agent.id, { status: 'busy', current_job_id: job.id });
      await base44.entities.ReasoningLog.create({
        agent_id: agent.id,
        job_id: job.id,
        thought: `Job "${job.title}" (priority ${job.priority}) matched to agent ${agent.name} (${agent.role}). Processed in deterministic priority order (sequence ${idx}).`,
        decision: `Assigned to ${agent.name}`,
        evidence: `Agent was idle and available; job was open and highest priority among remaining. Processed sequentially in strict priority order.`,
        confidence: 0.95
      });
      assignments.push({ job_id: job.id, job_title: job.title, agent_id: agent.id, agent_name: agent.name, sequence: idx });
    }

    return Response.json({ assigned: assignments.length, assignments, open_jobs_remaining: sortedJobs.length - assignments.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
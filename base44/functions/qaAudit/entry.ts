import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Gather system state for quality assessment
    const projectPage = await base44.entities.Project.list({ limit: 50 });
    const projects = projectPage.items || [];
    const promptPage = await base44.entities.PromptVersion.list({ limit: 50 });
    const prompts = promptPage.items || [];
    const specPage = await base44.entities.ProductSpec.list({ limit: 50 });
    const specs = specPage.items || [];
    const simPage = await base44.entities.SimulationResult.list({ limit: 50 });
    const simulations = simPage.items || [];
    const jobPage = await base44.entities.Job.list({ limit: 50 });
    const jobs = jobPage.items || [];
    const agentPage = await base44.entities.Agent.list({ limit: 50 });
    const agents = agentPage.items || [];
    const testPage = await base44.entities.TestResult.list({ limit: 50 });
    const testResults = testPage.items || [];
    const valPage = await base44.entities.ValidationReceipt.list({ limit: 50 });
    const validations = valPage.items || [];

    const systemState = {
      counts: {
        projects: projects.length,
        prompts: prompts.length,
        specs: specs.length,
        simulations: simulations.length,
        jobs: jobs.length,
        agents: agents.length,
        test_results: testResults.length,
        validations: validations.length
      },
      project_statuses: projects.map(p => p.status),
      job_statuses: jobs.map(j => j.status),
      agent_statuses: agents.map(a => a.status),
      pipeline_coverage: {
        has_idea: projects.filter(p => p.status !== 'idea').length,
        has_pattern: projects.filter(p => p.pattern_id).length,
        has_spec: specs.length,
        has_simulation: simulations.length,
        has_tests: testResults.length,
        has_validation: validations.length
      }
    };

    const qaPrompt = `You are the QA Agent for the Strategic Minds AI system. Your job is to rigorously pick apart the system, find every gap, and force it to step up. Be thorough, critical, and uncompromising.

Analyze the following system state:

${JSON.stringify(systemState, null, 2)}

Provide:
1. A quality score (0-100) — be harsh, not generous
2. Critical gaps — things that are missing, broken, or incomplete
3. Improvements — specific, actionable steps to raise quality
4. Health status — healthy, degraded, or critical
5. A summary that pulls no punches

Focus on: pipeline completeness, data integrity, test coverage, validation coverage, agent utilization, and system convergence.

Return ONLY a JSON object.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: qaPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          quality_score: { type: "number" },
          critical_gaps: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          health_status: { type: "string" },
          summary: { type: "string" }
        },
        required: ["quality_score", "critical_gaps", "improvements", "health_status", "summary"]
      }
    });

    const qaResult = typeof llmRes === 'object' && llmRes !== null ? llmRes : {};

    // Record findings
    await base44.entities.ReasoningLog.create({
      thought: `QA audit. Score: ${qaResult.quality_score || 0}/100. Health: ${qaResult.health_status || 'unknown'}.`,
      decision: qaResult.summary || 'QA audit complete',
      evidence: JSON.stringify(systemState.counts),
      confidence: 0.85
    });

    // Create todos for improvements
    let improvementsCreated = 0;
    if (qaResult.improvements) {
      for (const imp of qaResult.improvements.slice(0, 10)) {
        await base44.entities.Todo.create({
          title: `QA: ${imp.slice(0, 80)}`,
          description: imp,
          status: 'pending',
          priority: 'medium'
        });
        improvementsCreated++;
      }
    }

    // Create memory entries for critical gaps
    if (qaResult.critical_gaps) {
      for (const gap of qaResult.critical_gaps.slice(0, 5)) {
        await base44.entities.Memory.create({
          content: `QA GAP: ${gap}`,
          memory_type: 'reflection',
          importance: 8,
          tags: 'qa,audit,gap,improvement'
        });
      }
    }

    return Response.json({
      qa: qaResult,
      system_state: systemState,
      improvements_created: improvementsCreated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
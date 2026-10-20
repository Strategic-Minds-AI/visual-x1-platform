import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ENTITY_NAMES = [
  'Project', 'SystemPattern', 'PromptVersion', 'ProductSpec',
  'SimulationResult', 'TestResult', 'ValidationReceipt', 'Deployment',
  'Job', 'Agent', 'Todo', 'Memory', 'Knowledge', 'ReasoningLog',
  'AgentMessage', 'SystemRole'
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const autoFix = body.auto_fix === true;

    // Scan each entity for accessibility and record count
    const findings = [];
    for (const name of ENTITY_NAMES) {
      try {
        const page = await base44.entities[name].list({ limit: 1 });
        const count = page.items ? page.items.length : (Array.isArray(page) ? page.length : 0);
        findings.push({ entity: name, accessible: true, count, status: 'ok' });
      } catch (e) {
        findings.push({ entity: name, accessible: false, error: e.message, status: 'error' });
      }
    }

    // Check for agents without system prompts (security gap)
    const agentPage = await base44.entities.Agent.list({ limit: 50 });
    const agents = agentPage.items || [];
    const agentsWithoutPrompts = agents.filter(a => !a.system_prompt).map(a => a.name);
    if (agentsWithoutPrompts.length > 0) {
      findings.push({
        entity: 'Agent',
        issue: 'Agents without system prompts',
        agents: agentsWithoutPrompts,
        status: 'warning'
      });
    }

    // Check for projects without specs (quality gap)
    const projectPage = await base44.entities.Project.list({ limit: 50 });
    const projects = projectPage.items || [];
    const projectsWithoutSpecs = projects.filter(p => !p.pattern_id).map(p => p.name);
    if (projectsWithoutSpecs.length > 0) {
      findings.push({
        entity: 'Project',
        issue: 'Projects without pattern selection',
        projects: projectsWithoutSpecs,
        status: 'warning'
      });
    }

    // Use LLM to analyze findings and propose fixes
    const auditPrompt = `You are the Guardian Agent for the Strategic Minds AI system. Your job is to audit system security, identify risks, and propose fixes.

Analyze the following entity audit results and provide a security assessment:

${JSON.stringify(findings, null, 2)}

Provide:
1. A security score (0-100) based on access control, data protection, and configuration
2. Critical findings that need immediate attention
3. Recommended fixes (specific, actionable)
4. Auto-fixable items (safe changes like adding RLS rules, creating missing records)
5. A summary of the overall security posture

Return ONLY a JSON object.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: auditPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          security_score: { type: "number" },
          critical_findings: { type: "array", items: { type: "string" } },
          recommended_fixes: { type: "array", items: { type: "string" } },
          auto_fixable: { type: "array", items: { type: "string" } },
          summary: { type: "string" }
        },
        required: ["security_score", "critical_findings", "recommended_fixes", "summary"]
      }
    });

    const auditResult = typeof llmRes === 'object' && llmRes !== null ? llmRes : {};

    // Record findings in ReasoningLog
    await base44.entities.ReasoningLog.create({
      thought: `Guardian security audit. Score: ${auditResult.security_score || 0}/100. ${auditResult.critical_findings?.length || 0} critical findings.`,
      decision: auditResult.summary || 'Security audit complete',
      evidence: JSON.stringify(findings.slice(0, 10)),
      confidence: 0.9
    });

    // Create memory entries for critical findings
    if (auditResult.critical_findings) {
      for (const finding of auditResult.critical_findings.slice(0, 5)) {
        await base44.entities.Memory.create({
          content: `SECURITY: ${finding}`,
          memory_type: 'observation',
          importance: 9,
          tags: 'security,guardian,audit,critical'
        });
      }
    }

    // If auto-fix enabled, create todos for fixable items
    let fixesCreated = 0;
    if (autoFix && auditResult.auto_fixable) {
      for (const fix of auditResult.auto_fixable) {
        await base44.entities.Todo.create({
          title: `Guardian fix: ${fix.slice(0, 80)}`,
          description: fix,
          status: 'pending',
          priority: 'high'
        });
        fixesCreated++;
      }
    }

    return Response.json({
      audit: auditResult,
      entity_findings: findings,
      auto_fix_enabled: autoFix,
      fixes_created: fixesCreated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
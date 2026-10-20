import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const { deployment_id } = body;

    if (!deployment_id) {
      return Response.json({ error: 'deployment_id is required' }, { status: 400 });
    }

    const deployment = await base44.entities.Deployment.get(deployment_id);
    if (!deployment) {
      return Response.json({ error: 'Deployment not found' }, { status: 404 });
    }

    const project = await base44.entities.Project.get(deployment.project_id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const qaResult = await base44.functions.invoke('qaAudit', { force: true });
    const securityResult = await base44.functions.invoke('securityAudit', { force: true });
    const scoreResult = await base44.functions.invoke('scoreBenchmark', {
      project_id: deployment.project_id,
      repair_round: 1
    });

    let refinement = null;
    if (scoreResult.data?.decision !== 'pass') {
      const refineResult = await base44.functions.invoke('qaFeedbackLoop', {
        project_id: deployment.project_id,
        audit_source: 'benchmark_comparison',
        findings: {
          qa: qaResult.data,
          security: securityResult.data,
          scorecard: scoreResult.data
        },
        severity: scoreResult.data?.decision === 'block' ? 'critical' : 'high'
      });
      refinement = refineResult.data;
    }

    await base44.entities.AuditLog.create({
      entity_type: 'deployment',
      entity_id: deployment_id,
      action: 'validate',
      user_email: user.email,
      details: `Post-deployment QA: score ${scoreResult.data?.total_score || 0}/100, decision ${scoreResult.data?.decision || 'unknown'}`,
      severity: scoreResult.data?.decision === 'block' ? 'critical' : 'warning'
    });

    return Response.json({
      deployment_id,
      project_name: project.name,
      qa_audit: qaResult.data,
      security_audit: securityResult.data,
      scorecard: scoreResult.data,
      refinement: refinement
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
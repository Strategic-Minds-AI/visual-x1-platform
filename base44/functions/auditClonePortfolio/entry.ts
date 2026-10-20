import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The validation agent's portfolio pass: it audits the recorded evidence of every clone
// against the 100% rule and names exactly what each one is still missing. It re-reads
// evidence rather than re-rendering clones, and says so.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { items } = await base44.entities.CloneProject.filter({}, { sort: '-created_date', limit: 200 });

    const rows = items.map((p) => {
      let checks = [];
      try { checks = JSON.parse(p.operational_checks_json || '[]'); } catch { checks = []; }
      let defects = [];
      try { defects = JSON.parse(p.defects_json || '[]'); } catch { defects = []; }

      const required = checks.filter((c) => c.required !== false);
      const passed = required.filter((c) => c.result === 'PASS').length;
      const notRun = required.filter((c) => c.result === 'NOT RUN');
      const failed = required.filter((c) => c.result === 'FAIL');

      const blockers = [];
      if (!required.length) blockers.push('No operational checks recorded, so nothing has been verified yet.');
      if (failed.length) blockers.push(`Operational checks failed: ${failed.map((c) => c.id || c.label).join(', ')}`);
      if (notRun.length) blockers.push(`${notRun.length} required operational check(s) never ran: ${notRun.map((c) => c.id || c.label).join(', ')}`);
      if (p.visual_gate === 'not_run') blockers.push('Visual comparison has not run: a source image and a clone image have to be supplied.');
      else if (p.visual_gate !== 'passed') blockers.push(`Visual gate is ${p.visual_gate}.`);
      if (defects.length) blockers.push(`${defects.length} open defect(s) stand against acceptance.`);
      if (!p.human_approved && !blockers.length) blockers.push('Awaiting the operator\u2019s recorded sign-off.');

      const compliant = required.length > 0 && passed === required.length && p.visual_gate === 'passed' && defects.length === 0 && p.human_approved === true;

      return {
        id: p.id,
        name: p.name,
        source_type: p.source_type,
        source_kind: p.source_kind || 'site',
        status: p.status,
        operational_gate: p.operational_gate,
        visual_gate: p.visual_gate,
        operational_score: p.operational_score || 0,
        visual_score: p.visual_score || 0,
        required_checks: required.length,
        passed_checks: passed,
        human_approved: p.human_approved === true,
        open_defects: defects.length,
        compliant,
        blockers
      };
    });

    const summary = {
      total: rows.length,
      compliant: rows.filter((r) => r.compliant).length,
      blocked: rows.filter((r) => !r.compliant).length,
      missing_visual_evidence: rows.filter((r) => !r.compliant && r.visual_gate !== 'passed').length,
      missing_operational: rows.filter((r) => !r.compliant && (r.required_checks === 0 || r.passed_checks < r.required_checks)).length,
      awaiting_sign_off: rows.filter((r) => r.operational_gate === 'passed' && r.visual_gate === 'passed' && !r.human_approved).length
    };

    return Response.json({
      agent: { name: 'Clone Validation Auditor', role: 'reviewer', specialization: 'Visual and operational parity auditing' },
      summary,
      rows,
      method: 'This audit reads the evidence each clone recorded. It does not re-render clones, so a clone with no recorded checks is reported as unverified rather than compliant.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
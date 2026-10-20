import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { html, findings, brief, industry, benchmark_context, repair_round = 1 } = body;

    if (!html || html.trim().length < 100) {
      return Response.json({ error: 'Original HTML is required' }, { status: 400 });
    }
    if (!findings || !findings.length) {
      return Response.json({ error: 'Findings are required for repair' }, { status: 400 });
    }

    if (repair_round > 3) {
      return Response.json({ error: 'Maximum repair rounds (3) exceeded. Escalation required.', blocked: true }, { status: 429 });
    }

    // Truncate HTML for the repair prompt (keep the structure but not the full content)
    const htmlForRepair = html.substring(0, 15000);

    const repairRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Visual X Repair Engineer. Fix the specific defects found by the independent validator in this rendered HTML.

ORIGINAL BRIEF: ${brief || 'N/A'}
INDUSTRY: ${industry || 'General'}

DEFECTS TO FIX:
${JSON.stringify(findings, null, 2)}

CURRENT HTML (may be truncated):
"""
${htmlForRepair}
"""

INSTRUCTIONS:
1. Fix EVERY defect listed above.
2. Preserve all working functionality — do not break what already works.
3. Keep the same visual design direction — only fix the identified issues.
4. Maintain the single self-contained HTML file format (all CSS in <style>, all JS in <script>, no external deps).
5. Ensure all required sections remain: nav, hero, features, how-it-works, testimonials, FAQ, CTA, footer.
6. Improve accessibility, responsiveness, and performance based on findings.

Return ONLY the complete repaired HTML starting with <!DOCTYPE html>. No markdown fences, no explanation.`,
      model: "gemini_3_flash"
    });

    let repairedHtml = typeof repairRes === 'string' ? repairRes : (repairRes && repairRes.response) || String(repairRes || '');
    repairedHtml = repairedHtml.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    if (!repairedHtml.toLowerCase().startsWith('<!doctype') && !repairedHtml.toLowerCase().startsWith('<html')) {
      repairedHtml = `<!DOCTYPE html>\n<html lang="en">\n${repairedHtml}\n</html>`;
    }

    // Log the repair
    if (body.batch_id) {
      await base44.entities.AuditLog.create({
        entity_type: 'factory_batch',
        entity_id: body.batch_id,
        action: 'update',
        user_email: user.email,
        details: `Repair round ${repair_round}: ${findings.length} defects addressed`,
        severity: 'info'
      });
    }

    return Response.json({
      html: repairedHtml,
      repair_round,
      defects_addressed: findings.length,
      original_length: html.length,
      repaired_length: repairedHtml.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
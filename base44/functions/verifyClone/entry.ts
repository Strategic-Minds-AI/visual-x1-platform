import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { extractSignature, visibleText } from '../../shared/webCapture.ts';

const QA_SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          severity: { type: 'string' },
          evidence: { type: 'string' }
        },
        required: ['claim']
      }
    },
    verdict: { type: 'string' },
    confidence: { type: 'number' }
  },
  required: ['claims', 'verdict']
};

const VALIDATION_SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          verdict: { type: 'string' },
          note: { type: 'string' }
        },
        required: ['claim', 'verdict']
      }
    },
    decision: { type: 'string' },
    could_not_verify: { type: 'array', items: { type: 'string' } },
    reason: { type: 'string' }
  },
  required: ['claims', 'decision']
};

const VISUAL_SCHEMA = {
  type: 'object',
  properties: {
    regions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          verdict: { type: 'string' },
          differences: { type: 'string' }
        },
        required: ['name', 'verdict']
      }
    },
    defects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string' },
          description: { type: 'string' },
          where: { type: 'string' }
        },
        required: ['description']
      }
    },
    parity_score: { type: 'number' },
    summary: { type: 'string' }
  },
  required: ['regions', 'defects', 'parity_score']
};

const tokens = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
const overlap = (a, b) => {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  A.forEach((w) => { if (B.has(w)) hit++; });
  return hit / Math.max(A.size, 1);
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectId = String(body.project_id || '');
    const cloneHtml = String(body.clone_html || '');
    if (!projectId) return Response.json({ error: 'project_id is required' }, { status: 400 });
    if (!cloneHtml.trim()) {
      return Response.json({ error: 'Render the clone first: operational checks compare the rendered artifact against the capture.' }, { status: 400 });
    }

    const project = await base44.entities.CloneProject.get(projectId);
    if (!project) return Response.json({ error: 'Clone project not found' }, { status: 404 });

    const source = (() => { try { return JSON.parse(project.capture_json || '{}'); } catch { return {}; } })();
    const clone = extractSignature(cloneHtml, '');
    const cloneText = visibleText(cloneHtml);
    const sourceText = String(project.capture_text || '');

    const check = (id, label, pass, expected, found) => ({
      id, label, required: true,
      result: pass === null ? 'NOT RUN' : pass ? 'PASS' : 'FAIL',
      expected, found
    });

    const ratioOf = (a, b) => (!b ? null : a / b);

    const checks = [
      check('title', 'Page title present and carried over from the source',
        clone.title ? overlap(clone.title, source.title) >= 0.5 : false,
        source.title || 'a title', clone.title || 'none'),
      check('description', 'Meta description present',
        Boolean(clone.description), 'a meta description', clone.description || 'none'),
      check('h1', 'Primary heading reproduced',
        clone.headings.h1.length >= 1 && (source.headings?.h1?.length ? overlap(clone.headings.h1[0], source.headings.h1[0]) >= 0.4 : true),
        `${source.headings?.h1?.length || 0} in source`, `${clone.headings.h1.length} in clone`),
      check('sections', 'Section count within tolerance of the source',
        source.sections_estimate ? ratioOf(clone.sections_estimate, source.sections_estimate) >= 0.7 && ratioOf(clone.sections_estimate, source.sections_estimate) <= 1.4 : null,
        `${source.sections_estimate || 0} sections`, `${clone.sections_estimate} sections`),
      check('nav', 'Navigation labels carried over',
        source.nav_links?.length ? overlap(clone.nav_links.join(' '), source.nav_links.join(' ')) >= 0.5 : null,
        (source.nav_links || []).slice(0, 6).join(', ') || 'no nav captured', clone.nav_links.slice(0, 6).join(', ') || 'none'),
      check('text', 'Visible text volume within tolerance',
        sourceText ? ratioOf(cloneText.length, sourceText.length) >= 0.7 : null,
        `${sourceText.length} characters`, `${cloneText.length} characters`),
      check('forms', 'Forms and capture points preserved',
        source.forms?.count ? clone.forms.count >= 1 : true,
        `${source.forms?.count || 0} in source`, `${clone.forms.count} in clone`),
      check('images', 'Imagery present to match the source',
        source.images?.count ? clone.images.count >= Math.max(1, Math.floor(source.images.count * 0.5)) : true,
        `${source.images?.count || 0} in source`, `${clone.images.count} in clone`),
      check('cta', 'Calls to action present',
        source.cta_labels?.length ? clone.cta_labels.length >= 1 : true,
        (source.cta_labels || []).slice(0, 4).join(', ') || 'none captured', clone.cta_labels.slice(0, 4).join(', ') || 'none found'),
      check('viewport', 'Responsive viewport declared',
        clone.viewport_meta, 'viewport meta tag', clone.viewport_meta ? 'present' : 'missing'),
      check('lang', 'Document language declared',
        Boolean(clone.lang), 'a lang attribute', clone.lang || 'missing'),
      check('styling', 'Styling shipped with the artifact',
        clone.stylesheets > 0 || clone.inline_style_tags > 0 || /style=/i.test(cloneHtml.slice(0, 50000)),
        'stylesheets or inline styles', `${clone.stylesheets} stylesheet(s), ${clone.inline_style_tags} style block(s)`),
      check('placeholder', 'No placeholder or filler copy left in the artifact',
        !/lorem ipsum|consectetur adipiscing|\[PLACEHOLDER/i.test(cloneText), 'no filler text', /lorem ipsum|consectetur adipiscing|\[PLACEHOLDER/i.test(cloneText) ? 'filler text found' : 'clean')
    ];

    const required = checks.filter((c) => c.required);
    const passed = required.filter((c) => c.result === 'PASS').length;
    const failed = required.filter((c) => c.result === 'FAIL');
    const notRun = required.filter((c) => c.result === 'NOT RUN');
    const operationalScore = Math.round((passed / required.length) * 100);
    const operationalGate = failed.length === 0 && notRun.length === 0 ? 'passed' : 'failed';

    // Visual: only possible from images the operator supplies, because this runtime
    // has no browser and cannot capture a screenshot itself.
    let visual = {
      status: 'NOT RUN',
      reason: 'No screenshot pair attached. This environment cannot capture pages itself, so visual parity cannot be judged without images of the source and the clone.',
      regions: [],
      defects: [],
      parity_score: 0,
      summary: ''
    };
    const ref = String(body.reference_image_url || '').trim();
    const cloneImg = String(body.clone_image_url || '').trim();
    if (ref && cloneImg) {
      const prompt = `You are comparing two screenshots of the same website to judge visual parity.

Image 1 is the SOURCE. Image 2 is the REBUILT CLONE.

Report, per region (header/nav, hero, each content section, footer):
- verdict: "matches", "close", or "differs"
- differences: exactly what differs (layout, spacing, type scale, colour, imagery, missing or extra content)

Then list every defect you can actually see in Image 2 relative to Image 1, each with a severity of blocker, major or minor, a description, and where it is.

Rules:
- Judge only what is visible in the two images. If a region is not visible (below the fold, cut off, loading state), say so in that region's verdict and do not invent differences.
- A colour or font family that is close but not identical is "close", not "differs".
- parity_score is 0-100 for overall visual parity.
- Defects is the list of things a person would want fixed before accepting this clone. If the clone genuinely matches, return an empty defects array.`;
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [ref, cloneImg],
        response_json_schema: VISUAL_SCHEMA
      });
      const parsed = typeof llm === 'string' ? JSON.parse(llm) : llm;
      visual = {
        status: parsed.defects?.length ? 'defects_found' : 'clean',
        regions: parsed.regions || [],
        defects: parsed.defects || [],
        parity_score: Number(parsed.parity_score) || 0,
        summary: parsed.summary || '',
        method: 'Vision comparison of the attached screenshot pair. Not a pixel diff, and it only sees what the images show.'
      };
    }
    const visualGate = visual.status === 'NOT RUN' ? 'not_run' : (visual.defects || []).length === 0 ? 'passed' : 'failed';

    const evidencePack = {
      source: {
        title: source.title, sections: source.sections_estimate, headings: source.headings, nav: source.nav_links,
        forms: source.forms, images: source.images, text_length: source.text_length
      },
      clone: {
        title: clone.title, sections: clone.sections_estimate, headings: clone.headings, nav: clone.nav_links,
        forms: clone.forms, images: clone.images, text_length: cloneText.length, html_length: cloneHtml.length
      },
      operational_checks: checks,
      visual_check: visual,
      environment: 'No browser automation and no screenshot capability in this runtime. Only the checks above were run.'
    };

    const qaPrompt = `You are the QA agent on a website clone. Below is the measured evidence pack comparing a captured source to its rebuilt clone.

${JSON.stringify(evidencePack).slice(0, 24000)}

List the defects a reviewer must know about before this clone could be accepted. For each: the claim, a severity (blocker, major, minor), and the exact evidence from the pack that supports it. Then give a one-paragraph verdict and a confidence between 0 and 1.

Rules: only raise claims the evidence pack supports. Do not raise anything about the live behaviour of the clone in a browser — no browser was available, so that is not tested. If everything required passed, say so plainly and keep the claims list short or empty.`;

    const qaLlm = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: qaPrompt, response_json_schema: QA_SCHEMA });
    const qa = typeof qaLlm === 'string' ? JSON.parse(qaLlm) : qaLlm;

    const validatorPrompt = `You are the independent validating agent. Another agent produced QA claims about a website clone. Your job is to check those claims against the raw evidence, and to verdict each one PASS, FAIL or NOT RUN.

RAW EVIDENCE:
${JSON.stringify(evidencePack).slice(0, 24000)}

QA CLAIMS TO CHECK:
${JSON.stringify(qa).slice(0, 8000)}

For each claim: mark it PASS only if the raw evidence above actually contains the support; FAIL if the evidence contradicts it; NOT RUN if the evidence does not exist. Then give the decision:
- "PASS" only when every required operational check passed, the visual comparison found zero defects, and no claim failed.
- "GATE_FAILED" when a required check failed or a visual defect is open.
- "NOT RUN" when the evidence needed to decide is missing (for example no screenshots, so visual parity is unjudged).
- "BLOCKED" when something outside this evidence prevents the check.
Also list, explicitly, what you could not verify. Do not soften a failed gate into a pass because the score is high: a score never authorizes acceptance.`;

    const validatorLlm = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: validatorPrompt, response_json_schema: VALIDATION_SCHEMA });
    const validation = typeof validatorLlm === 'string' ? JSON.parse(validatorLlm) : validatorLlm;

    const defects = [
      ...failed.map((c) => ({ source: 'operational', severity: 'blocker', description: `${c.label} — expected ${c.expected}, found ${c.found}` })),
      ...notRun.map((c) => ({ source: 'operational', severity: 'unverified', description: `${c.label} — not run: ${c.found}` })),
      ...(visual.defects || []).map((d) => ({ source: 'visual', severity: d.severity || 'major', description: `${d.description}${d.where ? ` (${d.where})` : ''}` })),
      ...(visual.status === 'NOT RUN' ? [{ source: 'visual', severity: 'unverified', description: visual.reason }] : [])
    ];

    const gatesBothPassed = operationalGate === 'passed' && visualGate === 'passed';
    const status = gatesBothPassed ? (project.human_approved ? 'verified' : 'rendered') : 'gate_failed';
    const overallScore = Math.round(operationalScore * 0.55 + (Number(visual.parity_score) || 0) * 0.45);

    const limitations = [
      'No browser automation in this runtime: live interaction, JS behaviour and viewport rendering were not executed.',
      'No screenshot capture in this runtime: visual parity is judged only from the images attached to this project.',
      'The validating agent is a separate model pass over the same evidence pack, so its independence is logical, not organizational.',
      'Operational checks compare the rendered HTML against a capture signature; they do not prove the clone behaves identically at runtime.'
    ];

    const updated = await base44.entities.CloneProject.update(projectId, {
      status,
      operational_checks_json: JSON.stringify(checks),
      operational_gate: operationalGate,
      operational_score: operationalScore,
      visual_check_json: JSON.stringify(visual),
      visual_gate: visualGate,
      visual_score: Number(visual.parity_score) || 0,
      overall_score: overallScore,
      qa_json: JSON.stringify(qa),
      validation_json: JSON.stringify(validation),
      defects_json: JSON.stringify(defects),
      rendered_html_length: cloneHtml.length,
      evidence_notes: JSON.stringify([...(JSON.parse(project.evidence_notes || '[]') || []).slice(0, 4), ...limitations])
    });

    return Response.json({
      project: updated,
      summary: {
        operational_score: operationalScore,
        operational_gate: operationalGate,
        visual_gate: visualGate,
        overall_score: overallScore,
        passed,
        failed: failed.length,
        not_run: notRun.length,
        defects: defects.length,
        decision: validation.decision
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
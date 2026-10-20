import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The agent system behind ingestion. Five roles run in order over a captured source:
// an ingestor that measures before it specifies, an architect that designs the
// integration, a QA agent that hunts defects, a repair agent bounded to three rounds,
// and an independent validator that decides.
//
// Two rules are enforced here rather than trusted to a model:
// 1. A defect is only ever closed by the QA re-run that follows the repair. What a
//    repair claims it fixed is a claim, not a result.
// 2. This pipeline never opens the visual gate and never records human acceptance.
//    Those require images and the operator's own sign-off.

const INGEST_SCHEMA = {
  type: 'object',
  properties: {
    measured_ok: { type: 'boolean' },
    unmeasured: {
      type: 'array',
      items: { type: 'object', properties: { item: { type: 'string' }, why: { type: 'string' } }, required: ['item', 'why'] }
    },
    supply: {
      type: 'array',
      items: { type: 'object', properties: { value: { type: 'string' }, belongs_to: { type: 'string' }, why: { type: 'string' } }, required: ['value', 'belongs_to', 'why'] }
    },
    verdict: { type: 'string' }
  },
  required: ['measured_ok', 'unmeasured', 'supply', 'verdict']
};

const ARCHITECT_SCHEMA = {
  type: 'object',
  properties: {
    modules: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, responsibility: { type: 'string' }, depends_on: { type: 'array', items: { type: 'string' } }, interface: { type: 'string' } },
        required: ['name', 'responsibility']
      }
    },
    runtimes: { type: 'array', items: { type: 'string' } },
    configuration: {
      type: 'array',
      items: { type: 'object', properties: { name: { type: 'string' }, source: { type: 'string' }, secret: { type: 'boolean' } }, required: ['name', 'source'] }
    },
    bring_up_order: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } }
  },
  required: ['modules', 'configuration', 'bring_up_order']
};

const QA_SCHEMA = {
  type: 'object',
  properties: {
    defects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          area: { type: 'string' },
          description: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' }
        },
        required: ['id', 'severity', 'description', 'fix']
      }
    },
    verdict: { type: 'string' },
    confidence: { type: 'number' }
  },
  required: ['defects', 'verdict', 'confidence']
};

const REPAIR_SCHEMA = {
  type: 'object',
  properties: {
    applied: {
      type: 'array',
      items: { type: 'object', properties: { defect_id: { type: 'string' }, change: { type: 'string' } }, required: ['defect_id', 'change'] }
    },
    not_applicable: {
      type: 'array',
      items: { type: 'object', properties: { defect_id: { type: 'string' }, why: { type: 'string' } }, required: ['defect_id', 'why'] }
    },
    supply_added: { type: 'array', items: { type: 'string' } },
    build_prompt_addendum: { type: 'string' }
  },
  required: ['applied', 'not_applicable', 'supply_added', 'build_prompt_addendum']
};

const VALIDATOR_SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: { claim: { type: 'string' }, verdict: { type: 'string', enum: ['PASS', 'FAIL', 'NOT RUN'] }, reason: { type: 'string' } },
        required: ['claim', 'verdict', 'reason']
      }
    },
    decision: { type: 'string', enum: ['PASS', 'REPAIR REQUIRED', 'BLOCKED', 'NOT RUN'] },
    could_not_verify: { type: 'array', items: { type: 'string' } },
    reason: { type: 'string' }
  },
  required: ['claims', 'decision', 'could_not_verify', 'reason']
};

const AGENTS = {
  ingestor: { name: 'Integration Ingestor', role: 'ingestor' },
  architect: { name: 'Ingestion Architect', role: 'architect' },
  qa: { name: 'Defect Hunter', role: 'qa' },
  repair: { name: 'Repair Engineer', role: 'repair' },
  validator: { name: 'Clone Validation Auditor', role: 'validator' }
};

const parse = (value, fallback) => {
  try {
    const p = JSON.parse(value || '');
    return p ?? fallback;
  } catch {
    return fallback;
  }
};

// Which measurements a source of this kind has to have before it can be specified.
function measurementRequirements(kind, signature) {
  const m = signature || {};
  if (kind === 'site') {
    return [
      { id: 'title', label: 'Page title', ok: Boolean(m.title), found: m.title || '' },
      { id: 'headings', label: 'Headings captured', ok: (m.heading_count || 0) > 0, found: `${m.heading_count || 0} headings` },
      { id: 'sections', label: 'Section count', ok: (m.sections_estimate || 0) > 0, found: `${m.sections_estimate || 0} sections` },
      { id: 'length', label: 'Body length', ok: (m.html_length || 0) >= 400, found: `${m.html_length || 0} characters` },
      { id: 'tokens', label: 'Design tokens observed', ok: (m.colors || []).length > 0 || (m.fonts || []).length > 0, found: `${(m.colors || []).length} colors, ${(m.fonts || []).length} fonts` },
      { id: 'forms', label: 'Form fields read', ok: true, found: `${m.forms?.count || 0} forms, ${(m.forms?.fields || []).length} fields` }
    ];
  }
  if (kind === 'system') {
    const r = m.repo || {};
    const c = m.config || {};
    const f = m.folder || {};
    return [
      { id: 'inventory', label: 'Structure measured', ok: Boolean(r.full_name || c.key_count || f.entry_count), found: r.full_name || `${c.key_count || 0} config keys / ${f.entry_count || 0} entries` },
      { id: 'stack', label: 'Stack detected', ok: (r.frameworks || []).length > 0 || (r.primary_language || '') !== '', found: (r.frameworks || []).join(', ') || r.primary_language || 'not detected' },
      { id: 'manifests', label: 'Manifests read', ok: (r.manifests || []).length > 0 || (c.key_paths || []).length > 0 || (f.notable_files || []).length > 0, found: `${(r.manifests || []).length} manifests` },
      { id: 'config_surface', label: 'Configuration surface', ok: (c.env_names || []).length > 0 || (r.config_files || []).length > 0 || (f.notable_files || []).length > 0, found: `${(c.env_names || []).length} named values, ${(r.config_files || []).length} config files` },
      { id: 'host', label: 'Host fingerprint', ok: true, found: m.host ? Object.keys(m.host).join(', ') : 'not applicable to this source' }
    ];
  }
  return [
    { id: 'structure', label: 'Structure measured', ok: Boolean(m.document?.headings?.length || m.document?.numbered_steps?.length), found: `${m.document?.headings?.length || 0} headings, ${m.document?.numbered_steps?.length || 0} numbered steps` },
    { id: 'length', label: 'Readable content', ok: (m.text_length || 0) >= 200, found: `${m.text_length || 0} characters` },
    { id: 'tables', label: 'Tables or figures', ok: true, found: `${m.document?.table_rows || 0} table rows` }
  ];
}

export default async function (req) {
  const trace = [];
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectId = String(body.project_id || '').trim();
    if (!projectId) return Response.json({ ok: false, error: 'A project is required.' }, { status: 400 });
    const maxRounds = Math.min(Math.max(Number(body.rounds) || 3, 1), 3);

    const project = await base44.entities.CloneProject.get(projectId);
    if (!project) return Response.json({ ok: false, error: 'That project no longer exists.' }, { status: 404 });

    const signature = parse(project.capture_json, {});
    const spec = parse(project.spec_json, {});
    const kind = project.source_kind || 'site';
    const captureText = String(project.capture_text || '').slice(0, 12000);

    // Stage 0 — deterministic measurement check. This runs before any model does, so the
    // agents start from what was actually observed rather than from an impression.
    const requirements = measurementRequirements(kind, signature);
    const unmet = requirements.filter((r) => !r.ok);
    trace.push({
      id: 'measure',
      agent: AGENTS.ingestor.name,
      role: 'measurement',
      status: unmet.length ? 'gaps' : 'ok',
      summary: unmet.length
        ? `${unmet.length} of ${requirements.length} measurements are missing for a ${kind} source.`
        : `All ${requirements.length} measurements for a ${kind} source are present.`,
      findings: requirements
    });

    const ingest = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the ingestor agent. You measure before you specify, and you never invent a value.

SOURCE KIND: ${kind}
CAPTURED SIGNATURE (measured, not inferred):
${JSON.stringify(signature).slice(0, 9000)}

EXTRACTED SPECIFICATION AS IT STANDS:
${JSON.stringify({ regions: spec.regions, components: spec.components, tokens: spec.tokens, content_slots: spec.content_slots, interactions: spec.interactions }).slice(0, 8000)}

DETERMINISTIC MEASUREMENT GAPS:
${unmet.length ? unmet.map((u) => `- ${u.label}: ${u.found}`).join('\n') : '- none'}

Tasks:
1. measured_ok — is the capture complete enough to specify this source, given the gaps above?
2. unmeasured — every part of the source this capture could not observe, with why. Be specific and short.
3. supply — every value a rebuilder has to supply from outside the source, because the source does not show it: credentials, endpoints, ids, prices, names, phone numbers, versions, account references, legal text. Name the value and say where it belongs. Never invent a value here — a value you cannot read is exactly what belongs in this list.
4. verdict — one sentence on whether this capture is trustworthy as a specification base.`,
      response_json_schema: INGEST_SCHEMA
    });
    const ingestOut = typeof ingest === 'string' ? JSON.parse(ingest) : ingest;
    trace.push({
      id: 'ingest',
      agent: AGENTS.ingestor.name,
      role: 'ingestor',
      status: ingestOut.measured_ok ? 'ok' : 'gaps',
      summary: ingestOut.verdict,
      unmeasured: ingestOut.unmeasured || [],
      supply: ingestOut.supply || []
    });

    const architect = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the architect agent. Design how the captured source is reproduced and integrated here.

SOURCE KIND: ${kind}
SOURCE LABEL: ${project.source_label || project.name}
MEASURED SIGNATURE:
${JSON.stringify(signature).slice(0, 8000)}

SPECIFICATION:
${JSON.stringify(spec).slice(0, 9000)}

INGESTOR FINDINGS:
${JSON.stringify({ unmeasured: ingestOut.unmeasured, supply: ingestOut.supply }).slice(0, 4000)}

Tasks:
1. modules — the modules or files to build, in dependency order, each with its responsibility, what it depends on, and its interface.
2. runtimes — languages, runtimes and versions actually observed. If a version was not observed, do not state one.
3. configuration — every configuration value and secret by name, where it comes from, and whether it is a secret.
4. bring_up_order — the order to bring the parts up.
5. risks — where this integration is most likely to go wrong.
Rules: use only what the capture shows. Where something is not visible, name it as SUPPLY rather than choosing a value.`,
      response_json_schema: ARCHITECT_SCHEMA
    });
    const architectOut = typeof architect === 'string' ? JSON.parse(architect) : architect;
    trace.push({
      id: 'architect',
      agent: AGENTS.architect.name,
      role: 'architect',
      status: 'ok',
      summary: `${(architectOut.modules || []).length} modules, ${(architectOut.configuration || []).length} configuration values, ${(architectOut.risks || []).length} risks.`,
      plan: architectOut
    });

    let workingPrompt = String(project.build_prompt || '');
    let workingSpec = { ...spec };
    const rounds = [];
    let openDefects = [];
    let lastQa = null;
    let roundsUsed = 0;

    for (let round = 1; round <= maxRounds; round += 1) {
      const qa = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the QA agent. Your job is to find what is wrong with this specification before anything is built from it. You get no credit for a clean report — a defect you miss becomes a broken build.

SOURCE KIND: ${kind}
CAPTURED SIGNATURE:
${JSON.stringify(signature).slice(0, 7000)}

CAPTURED CONTENT (excerpt):
${captureText.slice(0, 6000)}

SPECIFICATION:
${JSON.stringify(workingSpec).slice(0, 8000)}

BUILD PROMPT UNDER REVIEW:
${workingPrompt.slice(0, 9000)}

ARCHITECT PLAN:
${JSON.stringify(architectOut).slice(0, 4000)}

${round > 1 ? `This is repair round ${round}. These defects were open at the end of the previous round: ${JSON.stringify((openDefects || []).map((d) => ({ id: d.id, description: d.description })))}. Grade whether each was actually fixed in the text above. A correction that is claimed but not present in the build prompt is still a defect.` : ''}

Tasks:
1. defects — every defect you can substantiate, each with a stable id (d1, d2…), severity, the area it affects, what is wrong, the evidence in the capture or the spec that shows it, and the specific fix. Look especially for: regions in the spec that the capture does not support, invented content where the capture shows none, missing supply values, wrong order, missing responsive or accessibility requirements, and configuration named but never explained.
2. verdict — one sentence.
3. confidence — 0 to 1, honest about how much you could check.
Do not invent defects to look thorough, and do not omit real ones to look successful.`,
        response_json_schema: QA_SCHEMA
      });
      lastQa = typeof qa === 'string' ? JSON.parse(qa) : qa;
      const roundDefects = lastQa.defects || [];
      roundsUsed = round;

      const blocking = roundDefects.filter((d) => d.severity === 'high' || d.severity === 'medium');
      rounds.push({
        round,
        qa: { verdict: lastQa.verdict, confidence: lastQa.confidence, defects: roundDefects.map((d) => ({ id: d.id, severity: d.severity, description: d.description })) },
        repair: null
      });

      if (!blocking.length) {
        openDefects = [];
        break;
      }
      if (round === maxRounds) {
        openDefects = blocking;
        break;
      }

      const repair = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the repair agent. You fix specification defects, and you only claim what you actually changed.

BUILD PROMPT:
${workingPrompt.slice(0, 9000)}

SPECIFICATION:
${JSON.stringify(workingSpec).slice(0, 7000)}

DEFECTS TO FIX:
${JSON.stringify(blocking).slice(0, 6000)}

Tasks:
1. applied — for each defect you actually repaired, its id and the exact change you made.
2. not_applicable — for each defect you cannot repair here, its id and why. A defect that needs a value, a screenshot or a decision from the operator belongs here, not in applied.
3. supply_added — any value that this repair revealed has to come from outside the source, named exactly.
4. build_prompt_addendum — the text to add to the build prompt that carries your corrections. Write it as instructions a builder follows, not as commentary about the defects. Never invent a value: write [SUPPLY: what is missing] where the operator must supply it.`,
        response_json_schema: REPAIR_SCHEMA
      });
      const repairOut = typeof repair === 'string' ? JSON.parse(repair) : repair;

      // The repair is applied to the artifact deterministically, so what the next QA
      // round reviews is the changed text rather than a claim of change.
      const addendum = String(repairOut.build_prompt_addendum || '').trim();
      if (addendum) workingPrompt = `${workingPrompt}\n\nREPAIR PASS ${round}:\n${addendum}`;
      if ((repairOut.supply_added || []).length) {
        workingSpec = { ...workingSpec, content_slots: Array.from(new Set([...(workingSpec.content_slots || []), ...repairOut.supply_added])) };
      }
      rounds[rounds.length - 1].repair = {
        applied: repairOut.applied || [],
        not_applicable: repairOut.not_applicable || [],
        supply_added: repairOut.supply_added || []
      };
    }

    trace.push({
      id: 'qa',
      agent: AGENTS.qa.name,
      role: 'qa',
      status: openDefects.length ? 'defects' : 'clean',
      summary: `Ran ${roundsUsed} round(s). ${openDefects.length} blocking defect(s) remain open.`,
      rounds
    });

    const validator = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the independent validator. You did not write this specification and you are not here to agree with it. You decide whether what is claimed is actually supported by the evidence in front of you.

WHAT IS CLAIMED (the build prompt the spec produced):
${workingPrompt.slice(0, 9000)}

THE SPECIFICATION:
${JSON.stringify({ regions: workingSpec.regions, components: workingSpec.components, tokens: workingSpec.tokens, content_slots: workingSpec.content_slots, interactions: workingSpec.interactions }).slice(0, 7000)}

THE EVIDENCE THE CLAIMS REST ON (captured signature):
${JSON.stringify(signature).slice(0, 7000)}

CAPTURED CONTENT (excerpt):
${captureText.slice(0, 5000)}

QA FINDINGS:
${JSON.stringify({ verdict: lastQa?.verdict, defects: (lastQa?.defects || []).map((d) => ({ id: d.id, severity: d.severity, description: d.description })) }).slice(0, 5000)}

For each significant claim in the build prompt, return a verdict: PASS when the capture supports it, FAIL when the capture contradicts it, NOT RUN when nothing here can settle it. Then decide: PASS only when no claim failed and nothing that matters is unverifiable; REPAIR REQUIRED when defects remain open; BLOCKED when the capture is too thin to judge; NOT RUN when there was nothing to check. List what you could not verify. A page was not rendered, no screenshot was taken, and no deployment was inspected — treat anything that would require those as unverified rather than passing.`,
      response_json_schema: VALIDATOR_SCHEMA
    });
    const validation = typeof validator === 'string' ? JSON.parse(validator) : validator;

    trace.push({
      id: 'validate',
      agent: AGENTS.validator.name,
      role: 'validator',
      status: validation.decision === 'PASS' ? 'pass' : 'not_pass',
      summary: validation.reason,
      decision: validation.decision,
      claims: validation.claims || [],
      could_not_verify: validation.could_not_verify || []
    });

    // The decision is derived here as well as reported by the validator, so an
    // optimistic answer from any single stage cannot open the gate on its own.
    const decision = openDefects.length > 0
      ? 'REPAIR REQUIRED'
      : validation.decision === 'BLOCKED' || validation.decision === 'NOT RUN'
      ? validation.decision
      : 'PASS';

    // One value named twice is one value to supply: the list is normalized so the
    // operator sees each missing value once, with the first (most specific) mention kept.
    const seenValue = new Set();
    const supply = [
      ...(ingestOut.supply || []),
      ...rounds.flatMap((r) => (r.repair?.supply_added || []).map((v) => ({ value: v, belongs_to: 'revealed during repair', why: 'Named by the repair pass as a value the source does not show.' })))
    ].filter((s) => {
      const key = String(s.value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!key || seenValue.has(key)) return false;
      seenValue.add(key);
      return true;
    });

    const pipeline = {
      ran_at: new Date().toISOString(),
      ran_by: user.email || '',
      rounds_used: roundsUsed,
      max_rounds: maxRounds,
      decision,
      decision_reason: openDefects.length
        ? `${openDefects.length} blocking defect(s) are still open after ${roundsUsed} round(s); a repair that is not confirmed by a re-run does not close a defect.`
        : validation.reason,
      stages: trace,
      supply,
      open_defects: openDefects,
      method: 'Stage 0 is a deterministic measurement check. The five agents then run in order. A defect is closed only by the QA re-run that follows the repair, never by the repair\'s own claim. This pipeline never opens the visual gate and never records your acceptance: those need images and your sign-off.'
    };

    const updated = await base44.entities.CloneProject.update(project.id, {
      spec_json: JSON.stringify(workingSpec),
      build_prompt: workingPrompt,
      qa_json: JSON.stringify({ ...lastQa, rounds_reviewed: roundsUsed }),
      validation_json: JSON.stringify(validation),
      defects_json: JSON.stringify(openDefects),
      pipeline_json: JSON.stringify(pipeline),
      status: decision === 'PASS' ? 'spec_ready' : 'gate_failed',
      evidence_notes: JSON.stringify([
        ...parse(project.evidence_notes, []).slice(0, 12),
        `Ingestion agent system ran ${roundsUsed} round(s) over a ${kind} capture and decided ${decision}.`,
        ...(ingestOut.unmeasured || []).map((u) => `Not measurable from this source: ${u.item} — ${u.why}`)
      ])
    });

    return Response.json({ ok: true, decision, pipeline, project: updated });
  } catch (error) {
    return Response.json({ ok: false, error: error.message, stages: trace }, { status: 500 });
  }
}
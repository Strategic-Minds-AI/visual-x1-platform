import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Visual X orchestrated prompt chain.
// Typed stage contracts, graph validation, real handoffs between stages, bounded
// repair with independent re-validation, and an evidence-labelled release decision.

const REVISION = 'visual-x-chain-v1';
const RELEASE_THRESHOLD = 95;
const DEFAULT_MAX_REPAIR_CYCLES = 3;
const STATUS_FOR = { PASS: 'passed', 'AWAITING REVIEW': 'awaiting_review', 'REPAIR REQUIRED': 'repair_required', BLOCKED: 'blocked' };

const DIMENSIONS = [
  { key: 'visual_parity', label: 'Visual parity and design quality', max: 25 },
  { key: 'functionality', label: 'Functionality', max: 20 },
  { key: 'accessibility', label: 'Accessibility', max: 15 },
  { key: 'responsive_ux', label: 'Responsive UX', max: 10 },
  { key: 'performance', label: 'Performance', max: 10 },
  { key: 'security', label: 'Security', max: 10 },
  { key: 'content_trust_seo', label: 'Content, trust and SEO', max: 5 },
  { key: 'reliability', label: 'Reliability', max: 5 },
];

// blocking: a failure stops the run. repairable: a prompt-level repair cycle can address it.
// release_only: the run may be valid but cannot be released without it.
const GATES = [
  { id: 'graph_valid', label: 'Workflow graph validated before execution', blocking: true, repairable: false },
  { id: 'brief_typed', label: 'Brief returned against its typed schema', blocking: true, repairable: false },
  { id: 'module_versions_loaded', label: 'All required prompt modules loaded at an active version', blocking: true, repairable: false },
  { id: 'benchmark_attached', label: 'Benchmark references attached with provenance, or the gap recorded', blocking: true, repairable: false },
  { id: 'artifact_rendered', label: 'Artifact actually rendered (not a description of one)', blocking: true, repairable: true },
  { id: 'independent_validation', label: 'Independent validator evaluated the evidence', blocking: true, repairable: false },
  { id: 'no_critical_findings', label: 'No critical finding left open', blocking: true, repairable: true },
  { id: 'no_broken_journey', label: 'No broken mandatory journey', blocking: true, repairable: true },
  { id: 'records_preserved', label: 'Provenance, receipt and rollback records preserved', blocking: true, repairable: false },
  { id: 'protected_action_authorized', label: 'No protected action taken without authorization', blocking: true, repairable: false },
  { id: 'browser_test_evidence', label: 'Browser-executed functional test evidence captured', blocking: false, release_only: true, repairable: false },
  { id: 'viewport_screenshots', label: 'Screenshots captured at representative viewports', blocking: false, release_only: true, repairable: false },
  { id: 'human_visual_approval', label: 'Human visual approval recorded against the rendered artifact', blocking: false, release_only: true, repairable: false },
];

// Routing: one entry per project type the pipeline can honestly produce.
const ROUTES = {
  marketing_website: { route: 'marketing_website', artifact_label: 'marketing website', artifact_type: 'website', benchmark_site_type: 'marketing_site', required_sections: ['navigation', 'hero', 'value/feature regions', 'proof or process section', 'closing conversion call', 'footer'], avoid_sections: ['fabricated testimonials', 'unrequested pricing tables'] },
  landing_page: { route: 'landing_page', artifact_label: 'conversion landing page', artifact_type: 'website', benchmark_site_type: 'landing_page', required_sections: ['minimal navigation', 'offer hero', 'benefit blocks', 'objection handling', 'single conversion action', 'footer'], avoid_sections: ['full multi-page navigation', 'fabricated testimonials'] },
  saas_app: { route: 'saas_app', artifact_label: 'SaaS application interface', artifact_type: 'application', benchmark_site_type: 'saas_dashboard', required_sections: ['app shell with navigation', 'primary working surface', 'data views with states', 'settings/account region'], avoid_sections: ['marketing hero', 'fabricated customer logos'] },
  dashboard: { route: 'dashboard', artifact_label: 'analytics dashboard', artifact_type: 'application', benchmark_site_type: 'saas_dashboard', required_sections: ['filter bar', 'KPI summary', 'primary chart region', 'detail table with empty state'], avoid_sections: ['marketing hero', 'pricing section'] },
  ecommerce: { route: 'ecommerce', artifact_label: 'storefront', artifact_type: 'website', benchmark_site_type: 'ecommerce', required_sections: ['navigation with search and cart', 'category/product grid', 'product detail region', 'trust and shipping information', 'footer'], avoid_sections: ['fabricated review counts'] },
  marketplace: { route: 'marketplace', artifact_label: 'marketplace', artifact_type: 'website', benchmark_site_type: 'marketplace', required_sections: ['search and filter', 'listing grid', 'listing detail', 'trust and safety information'], avoid_sections: ['fabricated seller counts'] },
  booking_funnel: { route: 'booking_funnel', artifact_label: 'booking and lead-capture flow', artifact_type: 'website', benchmark_site_type: 'landing_page', required_sections: ['service selection', 'scheduling or quote form with validation', 'confirmation state', 'follow-up expectations'], avoid_sections: ['unrelated feature grid'] },
  portfolio: { route: 'portfolio', artifact_label: 'portfolio', artifact_type: 'website', benchmark_site_type: 'portfolio', required_sections: ['identity statement', 'work grid', 'case detail region', 'contact'], avoid_sections: ['pricing section'] },
  editorial: { route: 'editorial', artifact_label: 'editorial site', artifact_type: 'website', benchmark_site_type: 'media', required_sections: ['masthead', 'lead story', 'article list', 'article reading view'], avoid_sections: ['conversion modal'] },
  internal_tool: { route: 'internal_tool', artifact_label: 'internal tool interface', artifact_type: 'application', benchmark_site_type: 'saas_dashboard', required_sections: ['work queue', 'record editor', 'bulk actions', 'audit trail'], avoid_sections: ['marketing sections'] },
  mobile_web_app: { route: 'mobile_web_app', artifact_label: 'mobile-first web application', artifact_type: 'application', benchmark_site_type: 'saas_dashboard', required_sections: ['mobile navigation', 'primary task surface', 'native-feeling lists and sheets'], avoid_sections: ['desktop-only tables without a mobile treatment'] },
  graphic_specimen: { route: 'graphic_specimen', artifact_label: 'brand and logo specimen sheet', artifact_type: 'graphic', benchmark_site_type: 'portfolio', required_sections: ['mark on light and dark surfaces', 'clear-space and minimum size', 'type and colour pairing', 'application mockups'], avoid_sections: ['website marketing sections'] },
  redesign: { route: 'redesign', artifact_label: 'redesigned interface', artifact_type: 'website', benchmark_site_type: 'marketing_site', required_sections: ['preserved navigation structure', 'redesigned hero', 'redesigned primary regions'], avoid_sections: ['new unrelated pages'] },
  system_extension: { route: 'system_extension', artifact_label: 'extension of an existing system', artifact_type: 'application', benchmark_site_type: 'saas_dashboard', required_sections: ['added surface consistent with existing shell', 'integration points'], avoid_sections: ['restyling unrelated screens'] },
  reverse_engineering: { route: 'reverse_engineering', artifact_label: 'compatibility analysis and rebuild plan', artifact_type: 'analysis', benchmark_site_type: 'marketing_site', required_sections: ['observed structure', 'documented behaviours', 'compatibility risks', 'rebuild plan'], avoid_sections: ['copied proprietary assets or code'] },
};

const NODES = [
  { id: 'intake', label: 'Project intake — brief interpreter', type: 'llm', module_id: 'MODULE-A-BRIEF-INTERPRETER', inputs: ['request', 'constraints'], outputs: ['brief'], timeout_ms: 90000, retry_policy: 'retry once on invalid schema', risk: 'low' },
  { id: 'classify', label: 'Classification and routing', type: 'deterministic', module_id: null, inputs: ['brief'], outputs: ['blueprint'], timeout_ms: 5000, retry_policy: 'none', risk: 'low' },
  { id: 'research', label: 'Benchmark selection', type: 'deterministic', module_id: null, inputs: ['blueprint'], outputs: ['references'], timeout_ms: 15000, retry_policy: 'none', risk: 'low' },
  { id: 'direction', label: 'Creative direction', type: 'llm', module_id: 'MODULE-B-VISUAL-CREATIVE-DIRECTOR', inputs: ['brief', 'references', 'blueprint'], outputs: ['direction'], timeout_ms: 90000, retry_policy: 'retry once on invalid schema', risk: 'medium' },
  { id: 'spec', label: 'Product specification', type: 'deterministic', module_id: null, inputs: ['brief', 'blueprint', 'direction'], outputs: ['spec'], timeout_ms: 5000, retry_policy: 'none', risk: 'low' },
  { id: 'implement', label: 'Implementation engineering', type: 'llm', module_id: 'MODULE-C-IMPLEMENTATION-ENGINEER', inputs: ['brief', 'direction', 'spec', 'references'], outputs: ['implementation'], timeout_ms: 90000, retry_policy: 'retry once on invalid schema', risk: 'medium' },
  { id: 'render', label: 'Render and capture', type: 'render', module_id: null, inputs: ['implementation.build_prompt', 'blueprint'], outputs: ['artifact'], timeout_ms: 150000, retry_policy: 'retry once on empty render', risk: 'medium' },
  { id: 'validate', label: 'Independent validation', type: 'llm', module_id: 'MODULE-D-INDEPENDENT-VALIDATOR', inputs: ['brief', 'spec', 'direction', 'artifact', 'checks'], outputs: ['validation'], timeout_ms: 120000, retry_policy: 'retry once on invalid schema', risk: 'low' },
  { id: 'score', label: 'Weighted scoring and gates', type: 'deterministic', module_id: null, inputs: ['validation'], outputs: ['scorecard'], timeout_ms: 5000, retry_policy: 'none', risk: 'low' },
  { id: 'repair', label: 'Bounded repair', type: 'llm', module_id: 'MODULE-E-REPAIR-ENGINEER', inputs: ['validation', 'implementation', 'spec'], outputs: ['repairs'], timeout_ms: 90000, retry_policy: 'bounded to max_repair_cycles', risk: 'high' },
  { id: 'release_review', label: 'Release review', type: 'deterministic', module_id: null, inputs: ['scorecard', 'validation', 'gates'], outputs: ['decision'], timeout_ms: 5000, retry_policy: 'none', risk: 'low' },
  { id: 'preserve', label: 'Preservation and handoff', type: 'deterministic', module_id: null, inputs: ['run'], outputs: ['receipt'], timeout_ms: 15000, retry_policy: 'none', risk: 'low' },
];

const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    project_name: { type: 'string' }, project_type: { type: 'string' }, routing_reason: { type: 'string' },
    audience: { type: 'string' }, purpose: { type: 'string' }, primary_journey: { type: 'string' },
    conversion_goal: { type: 'string' },
    pages: { type: 'array', items: { type: 'string' } }, features: { type: 'array', items: { type: 'string' } },
    constraints: { type: 'array', items: { type: 'string' } }, acceptance_criteria: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } }, facts: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    open_questions: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, why_it_matters: { type: 'string' }, recommended_default: { type: 'string' } }, required: ['question', 'recommended_default'] } },
    confidence: { type: 'number' },
  },
  required: ['project_name', 'project_type', 'audience', 'purpose', 'primary_journey', 'conversion_goal', 'pages', 'features', 'acceptance_criteria', 'assumptions', 'open_questions', 'confidence'],
};

const DIRECTION_SCHEMA = {
  type: 'object',
  properties: {
    positioning: { type: 'string' }, concept: { type: 'string' },
    typography: { type: 'object', properties: { heading: { type: 'string' }, body: { type: 'string' }, scale_ratio: { type: 'number' }, weights: { type: 'string' } }, required: ['heading', 'body'] },
    color: { type: 'object', properties: { surface: { type: 'string' }, text: { type: 'string' }, muted: { type: 'string' }, accent: { type: 'string' }, border: { type: 'string' }, contrast_note: { type: 'string' } }, required: ['surface', 'text', 'accent'] },
    spacing_scale: { type: 'string' }, radii: { type: 'string' }, shadows: { type: 'string' }, grid: { type: 'string' }, container_widths: { type: 'string' },
    motion: { type: 'string' }, iconography: { type: 'string' }, imagery: { type: 'string' },
    composition: { type: 'array', items: { type: 'object', properties: { region: { type: 'string' }, intent: { type: 'string' } }, required: ['region', 'intent'] } },
    responsive_rules: { type: 'array', items: { type: 'string' } },
    accessibility_requirements: { type: 'array', items: { type: 'string' } },
    component_hierarchy: { type: 'array', items: { type: 'string' } },
    decisions: { type: 'array', items: { type: 'object', properties: { reference_id: { type: 'string' }, pattern: { type: 'string' }, decision: { type: 'string' } }, required: ['pattern', 'decision'] } },
    alternatives: { type: 'array', items: { type: 'string' } },
    limitations: { type: 'array', items: { type: 'string' } },
  },
  required: ['positioning', 'concept', 'typography', 'color', 'spacing_scale', 'composition', 'responsive_rules', 'accessibility_requirements', 'component_hierarchy', 'decisions'],
};

const IMPLEMENTATION_SCHEMA = {
  type: 'object',
  properties: {
    build_prompt: { type: 'string' },
    file_plan: { type: 'array', items: { type: 'object', properties: { region: { type: 'string' }, purpose: { type: 'string' }, interaction: { type: 'string' } }, required: ['region', 'purpose'] } },
    interactions: { type: 'array', items: { type: 'string' } },
    self_review_risks: { type: 'array', items: { type: 'string' } },
    not_implemented: { type: 'array', items: { type: 'string' } },
  },
  required: ['build_prompt', 'file_plan', 'interactions', 'self_review_risks'],
};

const VALIDATION_SCHEMA = {
  type: 'object',
  properties: {
    dimensions: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, score: { type: 'number' }, evidence: { type: 'string' } }, required: ['key', 'score', 'evidence'] } },
    findings: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, severity: { type: 'string' }, location: { type: 'string' }, problem: { type: 'string' }, likely_cause: { type: 'string' }, smallest_fix: { type: 'string' }, evidence: { type: 'string' } }, required: ['severity', 'problem', 'smallest_fix'] } },
    gate_observations: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'status', 'reason'] } },
    journey_check: { type: 'object', properties: { journeys_tested: { type: 'array', items: { type: 'string' } }, broken: { type: 'array', items: { type: 'string' } }, evidence: { type: 'string' }, status: { type: 'string' } }, required: ['journeys_tested', 'broken', 'status'] },
    confidence: { type: 'number' },
    limitations: { type: 'array', items: { type: 'string' } },
    decision: { type: 'string' },
  },
  required: ['dimensions', 'findings', 'gate_observations', 'journey_check', 'confidence', 'limitations', 'decision'],
};

const REPAIR_SCHEMA = {
  type: 'object',
  properties: {
    tasks: { type: 'array', items: { type: 'object', properties: { finding_id: { type: 'string' }, root_cause: { type: 'string' }, smallest_fix: { type: 'string' }, regression_check: { type: 'string' }, severity: { type: 'string' } }, required: ['root_cause', 'smallest_fix', 'regression_check'] } },
    revised_build_prompt: { type: 'string' },
    left_untouched: { type: 'array', items: { type: 'string' } },
    rollback_note: { type: 'string' },
    blocked_reason: { type: 'string' },
  },
  required: ['tasks', 'revised_build_prompt', 'left_untouched', 'rollback_note'],
};

function safeJson(text) {
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function hash(value) {
  let h = 2166136261;
  const s = String(value);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}

async function loadModules(base44) {
  const { items } = await base44.entities.PromptVersion.filter({ is_active: true }, { limit: 100 });
  const byModule = {};
  for (const row of items || []) {
    if (!row.module_id) continue;
    const current = byModule[row.module_id];
    if (!current || (row.version || 1) >= (current.version || 1)) byModule[row.module_id] = row;
  }
  return byModule;
}

async function callModule(base44, moduleRow, contract, payload, model, schema, label, extraInstruction = '') {
  if (!moduleRow) throw new Error(`${label} is not registered as an active prompt module version`);
  const header = `${contract ? contract.prompt_text + '\n\n=====\n\n' : ''}${moduleRow.prompt_text}${extraInstruction ? `\n\nCORRECTION REQUIRED BEFORE RETURNING:\n${extraInstruction}` : ''}`;
  const typedInput = `\n\nTYPED STAGE INPUT:\n"""\n${JSON.stringify(payload).slice(0, 26000)}\n"""\n\nReturn only the structured output required by the schema. No prose outside the JSON.`;
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: attempt === 0 ? header + typedInput : `${header}${typedInput}\n\nYour previous response was rejected: ${lastError}. Return valid JSON only.`,
      model,
      response_json_schema: schema,
    });
    const parsed = typeof res === 'string' ? safeJson(res) : res;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const missing = (schema.required || []).filter((k) => parsed[k] === undefined || parsed[k] === null);
      if (!missing.length) return parsed;
      lastError = `missing required keys: ${missing.join(', ')}`;
    } else {
      lastError = 'the response was not a JSON object';
    }
  }
  throw new Error(`${label} did not return its typed output (${lastError})`);
}

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const mode = body.mode || 'run';
  const modules = await loadModules(base44);
  const contract = modules['MISSION-CONTRACT'] || null;

  if (mode === 'describe') {
    return Response.json({
      revision: REVISION,
      threshold: RELEASE_THRESHOLD,
      dimensions: DIMENSIONS,
      gates: GATES,
      nodes: NODES,
      routes: Object.values(ROUTES).map((r) => ({ route: r.route, artifact_label: r.artifact_label, artifact_type: r.artifact_type })),
      modules: Object.values(modules).map((m) => ({
        module_id: m.module_id, purpose: m.purpose, version: m.version, status: m.status,
        cost_budget: m.cost_budget, latency_budget_ms: m.latency_budget_ms,
        acceptance_criteria: m.acceptance_criteria, prompt_text: m.prompt_text,
        constraints: m.constraints, failure_behavior: m.failure_behavior, authorization_boundaries: m.authorization_boundaries,
        inputs_json: m.inputs_json, output_schema_json: m.output_schema_json, eval_cases_json: m.eval_cases_json,
        tool_requirements: m.tool_requirements, provenance: m.provenance, changelog: m.changelog, stage_order: m.stage_order,
      })).sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0)),
    });
  }

  if (mode === 'status') {
    if (body.run_id) {
      const run = await base44.entities.ChainRun.get(body.run_id);
      return Response.json({ run });
    }
    // No id: return the newest run so the workspace can follow a live execution.
    const { items } = await base44.entities.ChainRun.filter({ created_by_id: user.id }, { sort: '-created_date', limit: 1 });
    return Response.json({ run: items?.[0] || null });
  }

  const request = String(body.request || '').trim();
  if (request.length < 8) return Response.json({ error: 'Describe what to build in a sentence or two' }, { status: 400 });

  const model = body.model || 'gemini_3_flash';
  const maxCycles = Math.max(0, Math.min(DEFAULT_MAX_REPAIR_CYCLES, Number(body.max_repair_cycles ?? DEFAULT_MAX_REPAIR_CYCLES)));
  const missionId = `VX-${Date.now().toString(36).toUpperCase()}`;
  const startedAt = new Date().toISOString();

  const modulesReady = ['MODULE-A-BRIEF-INTERPRETER', 'MODULE-B-VISUAL-CREATIVE-DIRECTOR', 'MODULE-C-IMPLEMENTATION-ENGINEER', 'MODULE-D-INDEPENDENT-VALIDATOR', 'MODULE-E-REPAIR-ENGINEER'].filter((id) => !modules[id]);
  const graphValid = !modulesReady.length && NODES.every((n) => !n.module_id || modules[n.module_id]);
  const missingInputs = NODES.filter((n) => !n.inputs || !n.outputs || !n.id);
  const cycles = NODES.map((n) => n.id);
  const hasCycle = new Set(cycles).size !== cycles.length;

  let run = await base44.entities.ChainRun.create({
    mission_id: missionId,
    request,
    status: 'running',
    current_stage: 'graph_validation',
    stage_count: NODES.length,
    completed_count: 0,
    max_repair_cycles: maxCycles,
    revision: REVISION,
    started_at: startedAt,
    resumable: true,
    node_states_json: '[]',
    gates_json: JSON.stringify(GATES.map((g) => ({ ...g, status: 'not_run', reason: '' }))),
    cost_json: JSON.stringify({ model, model_calls: 0, stages_executed: 0 }),
    limitations_json: JSON.stringify([
      'No browser execution capability in this environment: functional browser tests, viewport screenshot capture and pixel comparison are NOT RUN, not passed.',
      'The independent validator is a separate module call with only evidence inputs, not a separate runtime or organization.',
    ]),
  });

  const states = [];
  const outputs = {};
  let modelCalls = 0;

  const persist = async (patch) => {
    run = await base44.entities.ChainRun.update(run.id, {
      node_states_json: JSON.stringify(states),
      completed_count: states.filter((s) => s.status === 'passed').length,
      stage_count: NODES.length,
      cost_json: JSON.stringify({ model, model_calls: modelCalls, stages_executed: states.filter((s) => s.status === 'passed').length }),
      ...patch,
    });
  };

  const stage = async (nodeId, fn) => {
    const node = NODES.find((n) => n.id === nodeId);
    const state = { id: node.id, label: node.label, type: node.type, module_id: node.module_id, risk: node.risk, status: 'running', started_at: new Date().toISOString(), duration_ms: 0, retry_count: 0, evidence: '', error: '' };
    states.push(state);
    await persist({ current_stage: node.id });
    const t0 = Date.now();
    try {
      const result = await fn(state);
      state.status = result?.status === 'not_run' ? 'not_run' : 'passed';
      state.evidence = result?.evidence || '';
      state.output_ref = result?.ref || '';
      if (result?.limitation) state.limitation = result.limitation;
      return result?.value;
    } catch (error) {
      state.status = 'failed';
      state.error = String(error?.message || error);
      await persist({});
      throw error;
    } finally {
      state.finished_at = new Date().toISOString();
      state.duration_ms = Date.now() - t0;
      await persist({});
    }
  };

  let artifactHtml = '';

  try {
    if (!graphValid || missingInputs.length || hasCycle) {
      throw new Error(`Graph validation failed: ${modulesReady.length ? `missing active modules ${modulesReady.join(', ')}` : 'invalid node contracts or duplicate node ids'}`);
    }

    // 1. Intake
    const brief = await stage('intake', async () => {
      const value = await callModule(base44, modules['MODULE-A-BRIEF-INTERPRETER'], contract, {
        request,
        supplied_constraints: body.constraints || null,
        existing_url: body.existing_url || null,
        route_catalog: Object.values(ROUTES).map((r) => ({ project_type: r.route, artifact_label: r.artifact_label })),
      }, model, BRIEF_SCHEMA, 'MODULE-A-BRIEF-INTERPRETER');
      modelCalls++;
      outputs.brief = value;
      await persist({ brief_json: JSON.stringify(value), project_name: value.project_name, project_type: value.project_type });
      return { value, evidence: `Brief returned with ${(value.acceptance_criteria || []).length} acceptance criteria and ${(value.open_questions || []).length} open questions.`, ref: 'brief_json' };
    });

    // 2. Classify
    const blueprint = await stage('classify', async () => {
      const key = ROUTES[brief.project_type] ? brief.project_type : null;
      const value = key ? { ...ROUTES[key], classified_by: 'declared_project_type' }
        : { ...ROUTES.marketing_website, classified_by: 'fallback_default', note: `Declared project_type "${brief.project_type}" is not in the route catalog; defaulted to marketing_website.` };
      outputs.blueprint = value;
      await persist({ route: value.route, project_type: brief.project_type });
      return { value, evidence: `Routed to ${value.route} (${value.classified_by}).` };
    });

    // 3. Research
    const references = await stage('research', async () => {
      const direct = await base44.entities.BenchmarkReference.filter({ is_active: true, site_type: blueprint.benchmark_site_type }, { sort: '-ux_score', limit: 3 });
      let rows = direct.items || [];
      let basis = `site_type=${blueprint.benchmark_site_type}`;
      if (!rows.length) {
        const broad = await base44.entities.BenchmarkReference.filter({ is_active: true }, { sort: '-ux_score', limit: 3 });
        rows = broad.items || [];
        basis = 'fallback: highest-scoring active references (no exact category match)';
      }
      const refs = rows.map((r) => ({
        id: r.id, name: r.name, url: r.url, industry: r.industry, site_type: r.site_type, ux_score: r.ux_score,
        patterns: r.key_patterns || null,
        provenancedesktop: r.desktop_screenshot_url ? 'public_reference' : 'none',
        provenance_mobile: r.mobile_screenshot_url ? 'public_reference' : 'none',
        screenshot_source: r.desktop_screenshot_url ? 'recorded URL on the benchmark record' : 'no screenshot on record',
        capture_date: 'not stored by the existing benchmark schema',
        record_recorded_at: r.updated_date || r.created_date || null,
      }));
      const gaps = [];
      if (!refs.length) gaps.push('No benchmark reference exists for this category. Visual comparison is therefore unavailable and any visual judgement is unreferenced.');
      if (refs.length && !refs.some((r) => r.provenancedesktop === 'public_reference')) gaps.push('Selected references carry no screenshot URL, so this run cannot perform image-level comparison.');
      const value = { basis, references: refs, gaps, provenance_summary: refs.length ? `public_reference (${refs.filter((r) => r.provenancedesktop === 'public_reference').length}), recorded_only (${refs.filter((r) => r.provenancedesktop === 'none').length})` : 'none' };
      outputs.references = value;
      await persist({ references_json: JSON.stringify(value) });
      return { value, evidence: `${refs.length} reference(s) attached via ${basis}. ${gaps.length} gap(s) recorded.` };
    });

    // 4. Direction
    const direction = await stage('direction', async () => {
      const value = await callModule(base44, modules['MODULE-B-VISUAL-CREATIVE-DIRECTOR'], contract, {
        brief, blueprint: { route: blueprint.route, artifact_label: blueprint.artifact_label, required_sections: blueprint.required_sections, avoid_sections: blueprint.avoid_sections },
        benchmark_references: references.references, reference_gaps: references.gaps,
      }, model, DIRECTION_SCHEMA, 'MODULE-B-VISUAL-CREATIVE-DIRECTOR');
      modelCalls++;
      outputs.direction = value;
      await persist({ direction_json: JSON.stringify(value) });
      return { value, evidence: `Direction committed with ${(value.decisions || []).length} reference-derived decisions.`, ref: 'direction_json' };
    });

    // 5. Spec (deterministic assembly from typed upstream outputs)
    const spec = await stage('spec', async () => {
      const value = {
        version: 1,
        source_revision: REVISION,
        project_name: brief.project_name,
        route: blueprint.route,
        sitemap: brief.pages,
        journeys: [brief.primary_journey],
        information_architecture: brief.pages.map((p, i) => ({ order: i + 1, page: p, purpose: `${p} serves ${brief.conversion_goal}` })),
        components: direction.component_hierarchy,
        design_tokens: direction.color,
        typography: direction.typography,
        responsive_rules: direction.responsive_rules,
        accessibility_requirements: direction.accessibility_requirements,
        functional_requirements: brief.features,
        interactions: blueprint.required_sections,
        data_contracts: ['no backend binding in this artifact unless stated in the brief'],
        integrations: [],
        security_requirements: ['no external scripts, no secrets in the artifact, no third-party trackers'],
        states: ['loading', 'empty', 'error', 'success where data or forms appear'],
        acceptance_tests: brief.acceptance_criteria,
        assumptions: brief.assumptions,
        risks: brief.risks,
        dependencies: ['MODULE-D-INDEPENDENT-VALIDATOR', 'render engine'],
        rollback: 'revised build prompts are kept per repair cycle; the previous prompt is the rollback pointer',
      };
      outputs.spec = value;
      await persist({ spec_json: JSON.stringify(value) });
      return { value, evidence: `Spec assembled with ${value.acceptance_tests.length} acceptance tests and ${value.components.length} components.`, ref: 'spec_json' };
    });

    // 6. Implement
    const DEPTH_FLOOR_CHARS = 3000;
    const implementation = await stage('implement', async () => {
      const payload = {
        brief, direction, specification: spec, blueprint: { route: blueprint.route, artifact_label: blueprint.artifact_label, artifact_type: blueprint.artifact_type, required_sections: blueprint.required_sections, avoid_sections: blueprint.avoid_sections },
        benchmark_references: references.references,
      };
      let value = await callModule(base44, modules['MODULE-C-IMPLEMENTATION-ENGINEER'], contract, payload, model, IMPLEMENTATION_SCHEMA, 'MODULE-C-IMPLEMENTATION-ENGINEER');
      modelCalls++;
      let depthEnforced = false;
      let depthModelUsed = '';
      if (String(value.build_prompt || '').length < DEPTH_FLOOR_CHARS) {
        // The build prompt is the only thing the render engine sees, so a thin one is a real
        // defect rather than style. One bounded corrective pass, recorded either way.
        // The fast model under-writes this stage, so the single corrective pass escalates to
        // the thorough model. It is the only escalation a run performs and it is recorded.
        const depthModel = model === 'gemini_3_flash' ? 'claude-sonnet-5' : model;
        const corrected = await callModule(base44, modules['MODULE-C-IMPLEMENTATION-ENGINEER'], contract, payload, depthModel, IMPLEMENTATION_SCHEMA, 'MODULE-C-IMPLEMENTATION-ENGINEER',
          `Your build_prompt was ${String(value.build_prompt || '').length} characters, below the ${DEPTH_FLOOR_CHARS}-character depth floor. Rewrite it region by region: for every region give the copy angle (headline intent, supporting line, action label), the layout and hierarchy, the interaction it must support, the states it must show, the token values it uses, and what changes at each breakpoint. Return the complete build prompt, not a summary of the specification.`);
        modelCalls++;
        depthEnforced = true;
        depthModelUsed = depthModel;
        if (String(corrected.build_prompt || '').length > String(value.build_prompt || '').length) value = corrected;
      }
      const promptChars = String(value.build_prompt || '').length;
      outputs.implementation = value;
      await persist({ artifact_json: JSON.stringify({ artifact_type: blueprint.artifact_type, build_prompt: value.build_prompt, file_plan: value.file_plan, html_length: 0, render_engine: 'renderPreview', rendered: false, prompt_history: [] }) });
      return { value, evidence: `Build prompt ${promptChars} chars for ${value.file_plan.length} regions; depth floor ${promptChars >= DEPTH_FLOOR_CHARS ? 'met' : `NOT met${depthEnforced ? ` after a corrective pass on ${depthModelUsed}` : ''}`}; ${value.self_review_risks.length} self-declared risks.`, ref: 'artifact_json' };
    });

    // 7. Render (real execution — calls the render engine with the blueprint)
    const artifact = await stage('render', async () => {
      const rendered = await base44.functions.invoke('renderPreview', {
        prompt: implementation.build_prompt,
        blueprint: { artifact_type: blueprint.artifact_type, artifact_label: blueprint.artifact_label, required_sections: blueprint.required_sections, avoid_sections: blueprint.avoid_sections, tokens: direction.color },
      });
      const html = rendered?.data?.html || '';
      if (!html || html.length < 500) throw new Error(`Render engine returned no usable artifact (${html.length} chars)`);
      artifactHtml = html;
      outputs.artifact = { artifact_type: blueprint.artifact_type, html_length: html.length, render_engine: 'renderPreview', rendered: true, build_prompt: implementation.build_prompt, prompt_history: [] };
      await persist({ artifact_json: JSON.stringify(outputs.artifact) });
      return { value: outputs.artifact, evidence: `Artifact rendered: ${html.length} characters of self-contained HTML at ${REVISION}.`, ref: 'artifact_json' };
    });

    // 8. Independent validation
    const validateOnce = async (promptUsed, cycleLabel) => {
      const value = await callModule(base44, modules['MODULE-D-INDEPENDENT-VALIDATOR'], contract, {
        brief, specification: spec, direction,
        build_prompt: promptUsed,
        render_record: { artifact_type: blueprint.artifact_type, html_length: artifactHtml.length, rendered: artifactHtml.length > 500, render_engine: 'renderPreview', cycle: cycleLabel },
        executed_checks: [
          { id: 'graph_valid', result: 'executed', detail: 'Graph validated: node contracts complete, module versions loaded, no duplicate node ids.' },
          { id: 'render_executed', result: 'executed', detail: `Render engine returned ${artifactHtml.length} characters.` },
          { id: 'browser_execution', result: 'not_run', detail: 'No browser execution capability in this environment.' },
          { id: 'screenshot_capture', result: 'not_run', detail: 'No screenshot capture capability available to this pipeline.' },
        ],
        benchmark_references: references.references,
        reference_gaps: references.gaps,
        dimension_bounds: DIMENSIONS.map((d) => ({ key: d.key, max: d.max })),
        gate_ids: GATES.map((g) => ({ id: g.id, label: g.label, kind: g.release_only ? 'release_only' : 'blocking' })),
      }, model, VALIDATION_SCHEMA, 'MODULE-D-INDEPENDENT-VALIDATOR');
      modelCalls++;
      return value;
    };

    const scoreOf = (validation) => {
      const byKey = {};
      for (const d of validation.dimensions || []) byKey[d.key] = d;
      const rows = DIMENSIONS.map((d) => {
        const scored = byKey[d.key];
        const raw = typeof scored?.score === 'number' ? scored.score : 0;
        return { key: d.key, label: d.label, max: d.max, score: Math.max(0, Math.min(d.max, raw)), evidence: scored?.evidence || 'No evidence returned for this dimension.', scored: Boolean(scored) };
      });
      const total = rows.reduce((sum, r) => sum + r.score, 0);
      const critical = (validation.findings || []).filter((f) => String(f.severity).toLowerCase() === 'critical');
      const observed = {};
      for (const g of validation.gate_observations || []) observed[g.id] = g;
      const gates = GATES.map((g) => {
        const fromValidator = observed[g.id];
        let status = 'not_run';
        let reason = 'The validator returned no observation for this gate.';
        if (g.id === 'graph_valid') { status = graphValid ? 'pass' : 'fail'; reason = graphValid ? 'Graph validated before execution.' : 'Graph validation failed.'; }
        else if (g.id === 'module_versions_loaded') { status = modulesReady.length ? 'fail' : 'pass'; reason = modulesReady.length ? `Missing modules: ${modulesReady.join(', ')}` : 'All required modules loaded at an active version.'; }
        else if (g.id === 'artifact_rendered') { status = artifactHtml.length > 500 ? 'pass' : 'fail'; reason = `Render engine produced ${artifactHtml.length} characters.`; }
        else if (g.id === 'independent_validation') { status = 'pass'; reason = 'MODULE-D returned a typed assessment over the evidence pack, separate from the builder.'; }
        else if (g.id === 'brief_typed') { status = brief ? 'pass' : 'fail'; reason = brief ? 'Brief interpreter output passed schema validation before any downstream stage consumed it.' : 'No brief was produced.'; }
        else if (g.id === 'benchmark_attached') { status = (references.references || []).length || (references.gaps || []).length ? 'pass' : 'fail'; reason = (references.references || []).length ? `${references.references.length} reference(s) attached with provenance (${references.provenance_summary}).` : `No reference exists for this category; the gap is recorded and an unreferenced visual judgement was declared.`; }
        else if (g.id === 'no_critical_findings') { status = critical.length ? 'fail' : 'pass'; reason = critical.length ? `${critical.length} critical finding(s) open.` : 'No critical findings.'; }
        else if (g.id === 'no_broken_journey') { status = (validation.journey_check?.broken || []).length ? 'fail' : (validation.journey_check?.status === 'not_run' ? 'not_run' : 'pass'); reason = validation.journey_check?.evidence || 'Journey check reported no broken journey.'; }
        else if (g.id === 'protected_action_authorized') { status = 'pass'; reason = 'No protected action was requested or taken during this run.'; }
        else if (g.id === 'records_preserved') { status = 'pass'; reason = 'Chain state, receipt and per-cycle build prompts are written to records.'; }
        else if (fromValidator) { status = ['pass', 'fail', 'not_run', 'unknown'].includes(fromValidator.status) ? fromValidator.status : 'unknown'; reason = fromValidator.reason || ''; }
        return { ...g, status, reason };
      });
      return { rows, total, threshold: RELEASE_THRESHOLD, gates, critical, met: total >= RELEASE_THRESHOLD };
    };

    let validation = await stage('validate', async () => {
      const value = await validateOnce(implementation.build_prompt, 'initial');
      outputs.validation = value;
      await persist({ validation_json: JSON.stringify(value) });
      return { value, evidence: `${(value.findings || []).length} finding(s), confidence ${value.confidence}.`, ref: 'validation_json', status: value.decision === 'NOT RUN' ? 'not_run' : 'passed', limitation: (value.limitations || []).join(' | ') };
    });

    let scorecard = await stage('score', async () => {
      const value = scoreOf(validation);
      outputs.scorecard = value;
      await persist({ scorecard_json: JSON.stringify(value), gates_json: JSON.stringify(value.gates) });
      return { value, evidence: `Weighted total ${value.total}/100 against the ${RELEASE_THRESHOLD} threshold; ${value.gates.filter((g) => g.status === 'fail').length} failing gate(s).`, ref: 'scorecard_json' };
    });

    const repairLog = [];
    const decide = (sc) => {
      const blockingFail = sc.gates.filter((g) => g.blocking && g.status === 'fail');
      const releaseOnly = sc.gates.filter((g) => g.release_only && g.status !== 'pass');
      if (sc.critical.length) return 'REPAIR REQUIRED';
      if (blockingFail.length) {
        const repairable = blockingFail.every((g) => g.repairable);
        return repairable ? 'REPAIR REQUIRED' : 'BLOCKED';
      }
      // A score below the threshold is always a repair decision, never a review hand-off.
      if (!sc.met) return 'REPAIR REQUIRED';
      if (releaseOnly.length) return 'AWAITING REVIEW';
      return 'PASS';
    };

    let decision = decide(scorecard);
    let repairBlocked = false;

    await stage('repair', async () => {
      if (decision !== 'REPAIR REQUIRED') {
        return { status: 'not_run', evidence: `No repair cycle needed: the review decision is ${decision}.` };
      }
      while (decision === 'REPAIR REQUIRED' && repairLog.length < maxCycles) {
          const cycle = repairLog.length + 1;
          const priorPrompt = implementation.build_prompt;
          const plan = await callModule(base44, modules['MODULE-E-REPAIR-ENGINEER'], contract, {
            validation_findings: validation.findings,
            critical_findings: scorecard.critical,
            gate_failures: scorecard.gates.filter((g) => g.status === 'fail'),
            build_prompt: priorPrompt,
            specification: spec,
            render_record: { artifact_type: blueprint.artifact_type, html_length: artifactHtml.length },
            previous_cycles: repairLog.map((c) => ({ cycle: c.cycle, tasks: c.tasks.length, regression: c.regression })),
          }, model, REPAIR_SCHEMA, 'MODULE-E-REPAIR-ENGINEER');
          modelCalls++;

          const revised = String(plan.revised_build_prompt || '').trim();
          // A model that writes "None." as its blocked_reason is reporting no blocker, not a blocker.
          const rawBlocked = String(plan.blocked_reason ?? '').trim().replace(/\.$/, '');
          const blockedReason = rawBlocked && !/^(none|no|n\/a|null|false|-|nothing)$/i.test(rawBlocked) ? rawBlocked : '';
          if (blockedReason || revised.length < 100 || revised === priorPrompt) {
            repairBlocked = true;
            repairLog.push({
              cycle,
              tasks: plan.tasks || [],
              applied: false,
              blocked_reason: blockedReason || (revised.length < 100 ? 'Repair engineer returned no usable revised prompt.' : 'Repair produced an identical prompt, so the same failure would recur.'),
              regression: 'not_run',
            });
            // A stopped cycle is still evidence, so it is written before the loop exits.
            await persist({ repairs_json: JSON.stringify(repairLog), repair_cycles_used: repairLog.length });
            break;
          }

          implementation.build_prompt = revised;
          outputs.implementation = { ...outputs.implementation, build_prompt: revised };

          const reRendered = await base44.functions.invoke('renderPreview', {
            prompt: revised,
            blueprint: { artifact_type: blueprint.artifact_type, artifact_label: blueprint.artifact_label, required_sections: blueprint.required_sections, avoid_sections: blueprint.avoid_sections, tokens: direction.color },
          });
          const newHtml = reRendered?.data?.html || '';
          const previousPrompt = artifactHtml;
          if (newHtml.length > 500) artifactHtml = newHtml;
          // Keep the revised prompt and its history on the record, so the change can be
          // read back and reverted rather than living only in this execution.
          if (outputs.artifact) {
            const history = (outputs.artifact.prompt_history || []).concat([{
              cycle,
              superseded_prompt_chars: priorPrompt.length,
              revised_prompt_chars: revised.length,
              previous_html_length: previousPrompt.length,
              html_length: artifactHtml.length,
            }]);
            outputs.artifact = { ...outputs.artifact, build_prompt: revised, html_length: artifactHtml.length, prompt_history: history };
            await persist({ artifact_json: JSON.stringify(outputs.artifact) });
          }

          const reValidation = await validateOnce(revised, `cycle_${cycle}`);
          const reScore = scoreOf(reValidation);
          repairLog.push({
            cycle,
            tasks: plan.tasks || [],
            applied: newHtml.length > 500,
            rollback_note: plan.rollback_note || 'previous build prompt retained',
            left_untouched: plan.left_untouched || [],
            regression: newHtml.length > 500 ? `re-rendered (${newHtml.length} chars, previous ${previousPrompt.length}) and independently re-validated` : 're-render produced no usable artifact',
            prior_total: scorecard.total,
            total: reScore.total,
            open_critical: reScore.critical.length,
          });
          validation = reValidation;
          scorecard = reScore;
          await persist({ validation_json: JSON.stringify(validation), scorecard_json: JSON.stringify(scorecard), gates_json: JSON.stringify(scorecard.gates), repairs_json: JSON.stringify(repairLog), repair_cycles_used: repairLog.length });
          decision = decide(scorecard);
      }
      return { value: repairLog, evidence: `${repairLog.length} repair cycle(s) executed within the ${maxCycles}-cycle bound.`, ref: 'repairs_json' };
    });

    // Release review
    const review = await stage('release_review', async () => {
      const blockers = [];
      for (const g of scorecard.gates.filter((x) => x.status === 'fail')) blockers.push({ gate: g.id, label: g.label, blocker: g.reason });
      for (const g of scorecard.gates.filter((x) => x.release_only && x.status !== 'pass')) blockers.push({ gate: g.id, label: g.label, blocker: `${g.status.toUpperCase()}: ${g.reason}`, needs: 'external evidence or human approval' });
      if (decision === 'REPAIR REQUIRED' && repairLog.length >= maxCycles) blockers.push({ gate: 'repair_bound', label: 'Repair bound reached', blocker: `Score ${scorecard.total}/100 after ${repairLog.length} cycles; no further automated repair is authorized.` });
      let finalDecision = decision === 'PASS' && blockers.length ? 'AWAITING REVIEW' : decision;
      if (repairBlocked && finalDecision === 'REPAIR REQUIRED') {
        finalDecision = 'BLOCKED';
        blockers.push({ gate: 'repair_blocked', label: 'Repair stopped safely', blocker: repairLog[repairLog.length - 1]?.blocked_reason || 'Repair could not proceed without exceeding scope or authority.' });
      }
      const reason = finalDecision === 'PASS'
        ? `Weighted ${scorecard.total}/100 against the ${RELEASE_THRESHOLD} threshold with all blocking gates passed and release evidence present.`
        : finalDecision === 'AWAITING REVIEW'
          ? `Score ${scorecard.total}/100. Release is not automatic: ${blockers.length} item(s) require external evidence or explicit human authorization.`
          : finalDecision === 'REPAIR REQUIRED'
            ? `Weighted ${scorecard.total}/100 with actionable findings; repair is bounded and further cycles need a new decision.`
            : `Blocked: ${blockers.map((b) => b.blocker).join(' ')}`;
      const limitations = [
        'No browser execution capability in this environment: functional browser tests, viewport screenshot capture and pixel comparison are NOT RUN, not passed.',
        'The independent validator is a separate module call over the evidence pack, not a separate runtime or a different organization, so logical independence is not organizational independence.',
      ];
      if (repairLog.some((c) => c.applied && typeof c.prior_total === 'number' && c.total < c.prior_total)) {
        limitations.push('At least one repair cycle scored lower on independent re-validation than the build it replaced. Single-call model judgement variance cannot be separated from a real regression in this configuration, so the lower score is reported rather than averaged away.');
      }
      if (repairLog.some((c) => c.applied === false)) {
        limitations.push('A repair cycle stopped without applying a change; the blocker it recorded is preserved in the repair history rather than retried.');
      }
      await persist({ decision: finalDecision, decision_reason: reason, blockers_json: JSON.stringify(blockers), limitations_json: JSON.stringify(limitations), status: STATUS_FOR[finalDecision] || 'awaiting_review' });
      return { value: { decision: finalDecision, reason, blockers }, evidence: `Release decision: ${finalDecision}.`, ref: 'decision' };
    });

    // Preservation
    await stage('preserve', async () => {
      const receipt = await base44.entities.ValidationReceipt.create({
        project_id: missionId,
        version: 1,
        validator_id: 'MODULE-D-INDEPENDENT-VALIDATOR + deterministic gate evaluator',
        decision: review.decision === 'PASS' ? 'pass' : review.decision === 'AWAITING REVIEW' ? 'conditional_pass' : 'block',
        findings: JSON.stringify(validation.findings || []),
        checked_items: JSON.stringify(scorecard.gates.map((g) => ({ id: g.id, status: g.status, reason: g.reason }))),
        evidence_hash: hash(`${REVISION}|${JSON.stringify(spec).slice(0, 4000)}|${implementation.build_prompt.length}|${artifactHtml.length}|${scorecard.total}`),
        notes: `${missionId}: ${review.reason} Limitations: ${(validation.limitations || []).join(' | ')}`,
      });
      const executed = [
        { check: 'graph_validation', outcome: 'PASS', evidence: 'Node contracts complete; modules loaded; no duplicate ids.' },
        { check: 'typed_handoffs', outcome: 'PASS', evidence: 'Each stage received validated JSON from the stages it declares.' },
        { check: 'schema_validation', outcome: 'PASS', evidence: 'Every module output was checked against its required keys.' },
        { check: 'artifact_render', outcome: artifactHtml.length > 500 ? 'PASS' : 'FAIL', evidence: `${artifactHtml.length} characters rendered by the render engine.` },
        { check: 'browser_functional_test', outcome: 'NOT RUN', evidence: 'No browser execution capability available to this environment.' },
        { check: 'viewport_screenshots', outcome: 'NOT RUN', evidence: 'No screenshot capture capability available to this pipeline.' },
        { check: 'pixel_benchmark_comparison', outcome: 'NOT RUN', evidence: references.references.some((r) => r.provenancedesktop === 'public_reference') ? 'Reference screenshot URLs exist but no capture/comparison tool is available.' : 'No reference screenshot evidence on record.' },
        { check: 'cross_user_isolation', outcome: 'UNKNOWN', evidence: 'Not exercised by this run; entity rules are inherited from the app.' },
      ];
      const passed = executed.filter((c) => c.outcome === 'PASS').length;
      const failed = executed.filter((c) => c.outcome === 'FAIL').length;
      await base44.entities.TestResult.create({
        project_id: missionId, version: 1, test_type: 'visual',
        results: JSON.stringify(executed), pass_count: passed, fail_count: failed,
        status: failed ? 'failed' : executed.some((c) => c.outcome === 'NOT RUN') ? 'pending' : 'passed',
        failures: JSON.stringify(executed.filter((c) => c.outcome !== 'PASS')),
      });
      await base44.entities.TestResult.create({
        project_id: missionId, version: 1, test_type: 'browser', status: 'pending', pass_count: 0, fail_count: 0,
        results: JSON.stringify([{ suite: 'navigation/buttons/forms/responsive/console', outcome: 'NOT RUN', reason: 'Requires browser execution, which this pipeline does not have.' }]),
        failures: JSON.stringify([{ suite: 'browser_execution', reason: 'not_run' }]),
      });
      await persist({ receipt_id: receipt.id, status: STATUS_FOR[review.decision] || 'awaiting_review', finished_at: new Date().toISOString(), resumable: false });
      return { value: { receipt_id: receipt.id }, evidence: `Receipt ${receipt.id} written; ${executed.length} checks recorded with honest labels (${passed} pass, ${failed} fail, ${executed.length - passed - failed} not run/unknown).`, ref: 'receipt_id' };
    });

    return Response.json({
      mission_id: missionId,
      run,
      artifact: { artifact_type: blueprint.artifact_type, html: artifactHtml, length: artifactHtml.length },
      outputs: { brief, references, direction, spec, implementation: { ...implementation, build_prompt: implementation.build_prompt }, scorecard, validation, repairs: repairLog, review },
    });
  } catch (error) {
    const message = String(error?.message || error);
    await persist({
      status: 'failed',
      decision: 'BLOCKED',
      decision_reason: `Stopped at ${states[states.length - 1]?.id || 'startup'}: ${message}`,
      blockers_json: JSON.stringify([{ blocker: message, stage: states[states.length - 1]?.id || 'startup' }]),
      finished_at: new Date().toISOString(),
    });
    return Response.json({ mission_id: missionId, run, artifact: { artifact_type: 'none', html: artifactHtml, length: artifactHtml.length }, error: message, stage_states: states }, { status: 200 });
  }
}
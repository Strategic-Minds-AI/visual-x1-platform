import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ToolLoopAgent, tool, stepCountIs } from 'npm:ai@7.0.16';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@3.0.5';
import { z } from 'npm:zod@4.4.3';

// Full-write surface: every entity except the secrets vault, every backend function
// except this one. The vault is excluded so credentials never enter a model prompt.
const ENTITIES = [
  'Agent', 'AgentMessage', 'AuditLog', 'BacklinkSite', 'BenchmarkImage', 'BenchmarkReference',
  'ChainRun', 'ClientIntake', 'CloneProject', 'CompetitorProfile', 'Deployment', 'DiscoveryReport',
  'FactoryBatch', 'GoogleComplianceRule', 'IndustryCategory', 'Job', 'Knowledge', 'LaunchLocation',
  'LeadOpportunity', 'Memory', 'ProductSpec', 'Project', 'PromptVersion', 'QARefinement',
  'QualityScorecard', 'ReasoningLog', 'SEOTemplate', 'SEOVariant', 'ServiceIndustry', 'SheetSync',
  'SimulationResult', 'SiteVariation', 'StrategyPlaybook', 'StrategySimulation', 'SystemAuditRun',
  'SystemBenchmark', 'SystemPattern', 'SystemRole', 'TestResult', 'Todo', 'ValidationReceipt',
  'WorkflowStep'
];
const FUNCTIONS = [
  'agentChat', 'agentCommunicationBus', 'auditSystem', 'autoRepairLoop', 'buildProgrammaticStructure',
  'checkBacklinkHealth', 'clientDiscovery', 'compilePromptLab', 'convertPrompt', 'draftVisionStatement',
  'fetchBacklinkTraffic', 'fetchWebPage', 'generateBacklinkSites', 'generateBenchmarkImages',
  'generateStrategyProposal', 'independentValidation', 'ingestClone', 'judgePageContent',
  'multiAgentRound', 'orchestrateAgents', 'orchestrateFactory', 'promptSimulator', 'qaAudit',
  'qaFeedbackLoop', 'queueBulkBacklinks', 'renderPreview', 'repairDefects', 'runPromptChain',
  'scoreBenchmark', 'securityAudit', 'simulateSeoGrowth', 'syncGoogleTasks', 'syncJobToGoogleTasks',
  'syncMetricsToSheets', 'syncVariationMetrics', 'triggerPostDeploymentQA', 'verifyClone'
];

const parseJson = (raw, fallback) => {
  if (raw === undefined || raw === null || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return { __parse_error: 'That was not valid JSON. Pass a JSON string, or an empty object for no filter.' };
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const message = String(body.message || '').trim();
    if (!message) return Response.json({ error: 'message is required' }, { status: 400 });
    const maxSteps = Math.min(Math.max(Number(body.max_steps) || 8, 1), 12);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!base44.asServiceRole?.aiGateway) {
      return Response.json({ error: 'The AI gateway is not reachable from this runtime.' }, { status: 500 });
    }
    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();

    const service = base44.asServiceRole;
    const trail = [];
    const note = (step) => trail.push(step);

    const entityName = (name) => {
      if (!ENTITIES.includes(name)) {
        return { error: `"${name}" is not an available entity. Available: ${ENTITIES.join(', ')}` };
      }
      return { name };
    };

    const readEntity = tool({
      description: 'Read records from an entity. filter_json is a MongoDB-style filter, e.g. {"status":"open"} or {"created_date":{"$gte":"2026-01-01"}}. Use {} for everything. The record id field is "id" (not "_id"), e.g. {"id":"abc123"}.',
      inputSchema: z.object({
        entity: z.string(),
        filter_json: z.string().optional(),
        limit: z.number().optional(),
        sort: z.string().optional()
      }),
      execute: async ({ entity, filter_json, limit, sort }) => {
        const ok = entityName(entity);
        if (ok.error) return ok.error;
        const filter = parseJson(filter_json, {});
        const res = await service.entities[entity].filter(filter, { limit: Math.min(limit || 25, 100), sort: sort || '-created_date' });
        const items = res.items || [];
        note({ tool: 'read_entity', arguments: { entity, filter, limit: limit || 25 }, ok: true, observation: `${items.length} record(s) returned` });
        return JSON.stringify(items.slice(0, 25));
      }
    });

    const countEntity = tool({
      description: 'Count records matching a filter. Returns a number, transfers no records.',
      inputSchema: z.object({ entity: z.string(), filter_json: z.string().optional() }),
      execute: async ({ entity, filter_json }) => {
        const ok = entityName(entity);
        if (ok.error) return ok.error;
        const filter = parseJson(filter_json, {});
        const total = await service.entities[entity].count(filter);
        note({ tool: 'count_entity', arguments: { entity, filter }, ok: true, observation: `${total} record(s)` });
        return String(total);
      }
    });

    const createEntity = tool({
      description: 'Create one record. data_json is a JSON object of field values for that entity.',
      inputSchema: z.object({ entity: z.string(), data_json: z.string() }),
      execute: async ({ entity, data_json }) => {
        const ok = entityName(entity);
        if (ok.error) return ok.error;
        const data = parseJson(data_json, null);
        if (!data || data.__parse_error) return 'data_json must be a JSON object.';
        const created = await service.entities[entity].create(data);
        note({ tool: 'create_entity', arguments: { entity, data }, ok: true, observation: `created ${created?.id || 'record'}` });
        return `Created ${entity} ${created?.id || ''}`;
      }
    });

    const updateEntity = tool({
      description: 'Update one record by id. data_json is a JSON object of the fields to change.',
      inputSchema: z.object({ entity: z.string(), id: z.string(), data_json: z.string() }),
      execute: async ({ entity, id, data_json }) => {
        const ok = entityName(entity);
        if (ok.error) return ok.error;
        const data = parseJson(data_json, null);
        if (!data || data.__parse_error) return 'data_json must be a JSON object.';
        const updated = await service.entities[entity].update(id, data);
        note({ tool: 'update_entity', arguments: { entity, id, data }, ok: true, observation: 'record updated' });
        return `Updated ${entity} ${updated?.id || id}`;
      }
    });

    const deleteEntity = tool({
      description: 'Delete one record by id. Only call this when the request is unambiguous about which record should be deleted.',
      inputSchema: z.object({ entity: z.string(), id: z.string() }),
      execute: async ({ entity, id }) => {
        const ok = entityName(entity);
        if (ok.error) return ok.error;
        await service.entities[entity].delete(id);
        note({ tool: 'delete_entity', arguments: { entity, id }, ok: true, observation: 'record deleted' });
        return `Deleted ${entity} ${id}`;
      }
    });

    const runFunction = tool({
      description: `Run one of the app's backend functions and return its result. Available: ${FUNCTIONS.join(', ')}. payload_json is the JSON payload that function expects. Known payload keys — convertPrompt: {sentence, category}; renderPreview: {prompt, context}; promptSimulator: {prompt}; runPromptChain: {request, model, max_repair_cycles}; ingestClone: {name, source_type, url|content|file_url, industry}; verifyClone: {project_id, clone_html, reference_image_url, clone_image_url}; multiAgentRound: {agent_ids, topic, rounds}; agentChat: {agent_id, message}; fetchWebPage: {url}; clientDiscovery: {intake_id}; orchestrateFactory: {sentence}. Other functions take the fields their own records show. If a call answers 400 the payload was rejected — check the function's expected keys before retrying, and do not guess the same key twice. Long functions (a factory run, a discovery run) take minutes.`,
      inputSchema: z.object({ function_name: z.string(), payload_json: z.string().optional() }),
      execute: async ({ function_name, payload_json }) => {
        if (!FUNCTIONS.includes(function_name)) {
          return `"${function_name}" cannot be called from here. Available: ${FUNCTIONS.join(', ')}`;
        }
        const payload = parseJson(payload_json, {});
        try {
          const res = await service.functions.invoke(function_name, payload);
          const data = res?.data ?? res;
          const text = JSON.stringify(data);
          note({ tool: 'run_function', arguments: { function_name, payload }, ok: true, observation: `returned ${text.length} characters` });
          return text.length > 12000 ? `${text.slice(0, 12000)}… (truncated)` : text;
        } catch (e) {
          note({ tool: 'run_function', arguments: { function_name, payload }, ok: false, observation: e.message });
          return `The function failed: ${e.message}`;
        }
      }
    });

    const fetchUrl = tool({
      description: 'Read a public web page as text. Use this for research, competitor pages, and anything you need from the live web.',
      inputSchema: z.object({ url: z.string() }),
      execute: async ({ url }) => {
        try {
          const res = await fetch(url, {
            headers: { 'user-agent': 'Mozilla/5.0 (compatible; VisualXAutonomy/1.0)', accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
            redirect: 'follow',
            signal: AbortSignal.timeout(15000)
          });
          const raw = await res.text();
          const text = raw
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 12000);
          note({ tool: 'fetch_url', arguments: { url }, ok: res.ok, observation: `HTTP ${res.status}, ${text.length} characters read` });
          return `HTTP ${res.status}\n${text}`;
        } catch (e) {
          note({ tool: 'fetch_url', arguments: { url }, ok: false, observation: e.message });
          return `Could not read that URL: ${e.message}`;
        }
      }
    });

    const base44Models = createOpenAICompatible({ name: 'base44', baseURL, apiKey: token, headers });

    const agent = new ToolLoopAgent({
      model: base44Models('automatic'),
      instructions: `You are the operating agent of Visual X, an autonomous website engineering system. The operator has given you full read, write, execute and create access to this app's data and its backend functions, plus the ability to read the live web.

What you can do: read, create, update and delete records in every app entity except the secrets vault; count and filter records; run any of the app's backend functions; and read public web pages.

How to work:
- Act. When the operator asks for something, do it with tools rather than describing how it could be done.
- Look before you write: read the records or entity fields you need so the data you write is real and the field names are correct.
- Chain work when one answer depends on another, and stop as soon as the requested outcome exists.
- Report only what actually happened: what you ran, what came back, and what you could not do and why. Never claim a result you did not observe. If a tool failed, say so plainly instead of working around it silently.
- Destructive calls: delete only what the request clearly identifies. Prefer reading and creating over deleting when either would satisfy the request.
- Billing and time: a factory or discovery run costs real model credits and can take minutes. Use those functions when the operator's request calls for them.
- Boundaries you must state rather than hide: the secrets vault is excluded so credentials never enter a prompt; there is no browser automation in this environment, so actions that need a real browser (clicking, screenshot capture, pixel comparison) cannot be performed — say NOT RUN, never guess. Access to a third-party account only covers accounts the operator has already connected.`,
      tools: {
        read_entity: readEntity,
        count_entity: countEntity,
        create_entity: createEntity,
        update_entity: updateEntity,
        delete_entity: deleteEntity,
        run_function: runFunction,
        fetch_url: fetchUrl
      },
      stopWhen: [stepCountIs(maxSteps)]
    });

    const historyText = history.length
      ? `\n\nEarlier in this conversation:\n${history.map((h) => `${h.role}: ${String(h.content).slice(0, 900)}`).join('\n')}`
      : '';

    const result = await agent.generate({ prompt: `${message}${historyText}` });
    // Hitting the step ceiling must still tell the operator what happened.
    const written = typeof result?.text === 'string' ? result.text.trim() : '';
    const answer = written || (trail.length
      ? `No written summary was produced before the step limit. What ran: ${trail.map((t) => `${t.tool}${t.ok ? '' : ' (failed)'}`).join(' → ')}. Last observation: ${trail[trail.length - 1].observation}`
      : 'Nothing ran, so there is nothing to report.');

    return Response.json({
      answer,
      trail,
      steps_used: trail.length,
      step_limit: maxSteps,
      boundaries: [
        'Secrets vault excluded — credentials never enter a model prompt.',
        'No browser automation in this environment: click, screenshot and pixel work is NOT RUN.',
        'Third-party accounts are reachable only where the operator has already connected them.'
      ]
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
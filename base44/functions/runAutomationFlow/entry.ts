import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { loadPolicy, num, parseJson, policyWithDefaults } from '../../shared/loop.ts';

// Executes a designed automation flow, in order, deterministically. Steps run
// sequentially so the run log reads as the flow was drawn; each step records what
// it actually did, and a step that fails is reported as failed rather than skipped
// silently. A flow marked as requiring approval does nothing until the caller
// approves it, and reports exactly which steps would have run.
const WRITABLE = [
  'Todo', 'Job', 'TaskAssignment', 'ChangeLedger', 'RegressionGuard', 'AutomationFlow',
  'ArchitectureItem', 'SocialPost', 'SEOVariant', 'SiteVariation', 'BacklinkSite', 'ClientIntake',
  'Knowledge', 'Memory', 'PromptVersion', 'QARefinement', 'ValidationReceipt', 'Deployment',
  'FactoryBatch', 'LeadOpportunity', 'StrategyPlaybook', 'GoogleComplianceRule', 'BenchmarkReference',
];
const STEP_LIMIT = 40;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const flowId = String(body.flow_id || '').trim();
    const approved = body.approved === true;

    let flow = null;
    if (flowId) {
      flow = await service.entities.AutomationFlow.get(flowId);
      if (!flow) return Response.json({ error: 'No flow with that id' }, { status: 404 });
    } else if (body.flow) {
      flow = body.flow;
    } else {
      return Response.json({ error: 'flow_id or flow is required' }, { status: 400 });
    }

    const steps = parseJson(flow.steps_json, []);
    if (!Array.isArray(steps) || !steps.length) {
      return Response.json({ error: 'This flow has no steps yet' }, { status: 400 });
    }
    if (steps.length > STEP_LIMIT) {
      return Response.json({ error: `A run is capped at ${STEP_LIMIT} steps; this flow has ${steps.length}.` }, { status: 400 });
    }
    if (flow.requires_approval && !approved) {
      return Response.json({
        held: true,
        reason: 'This flow requires approval before it runs.',
        steps: steps.map((s) => `${s.type}: ${s.label || s.id}`),
        approve_with: { flow_id: flow.id || null, approved: true },
      });
    }

    const policy = policyWithDefaults(await loadPolicy(service));
    if (policy.kill_switch) {
      return Response.json({ held: true, reason: 'The kill switch is on: nothing runs until it is cleared.' });
    }

    const input = body.input && typeof body.input === 'object' ? body.input : {};
    const log = [];
    let skipped = 0;

    const runStep = async (step) => {
      const type = String(step.type || '');
      const config = step.config || {};
      switch (type) {
        case 'invoke_function': {
          const name = String(config.function_name || '').trim();
          if (!name) return { ok: false, observation: 'no function named on the step' };
          if (name === 'runAutomationFlow') return { ok: false, observation: 'a flow cannot invoke itself' };
          const payload = parseJson(config.payload_json, {}) || {};
          const res = await service.functions.invoke(name, payload);
          const data = res?.data ?? res;
          const text = JSON.stringify(data);
          return { ok: true, observation: `${name} returned ${text.length} characters`, result: text.slice(0, 2000) };
        }
        case 'assign_task': {
          const res = await service.functions.invoke('assignTask', {
            title: config.title || `${flow.name} assignment`,
            detail: config.detail || flow.purpose || '',
            work_type: config.work_type || 'build',
            assigned_agent: config.assigned_agent || flow.owner_agent || 'X1 Orchestrator',
            priority: config.priority || 'medium',
            due_hours: num(config.due_hours, 48),
            channels: Array.isArray(config.channels) ? config.channels : ['tasks'],
            notify_email: config.notify_email || user.email,
          });
          const data = res?.data ?? res;
          return { ok: !data?.error, observation: `assignment ${data?.assignment_id || 'created'} pushed to ${(data?.channels || []).join(', ') || 'nothing'}`, result: JSON.stringify(data).slice(0, 2000) };
        }
        case 'create_todo': {
          const created = await service.entities.Todo.create({
            title: config.title || `${flow.name}: next step`,
            description: config.description || '',
            status: 'pending',
            priority: config.priority || 'medium',
            due_date: new Date(Date.now() + num(config.due_days, 7) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          });
          return { ok: true, observation: `todo created: ${created.id}`, result: created.id };
        }
        case 'create_record': {
          const entity = String(config.entity || '');
          if (!WRITABLE.includes(entity)) return { ok: false, observation: `"${entity}" is not writable from a flow` };
          const created = await service.entities[entity].create(parseJson(config.data_json, {}) || {});
          return { ok: true, observation: `${entity} created: ${created?.id || ''}`, result: created?.id || '' };
        }
        case 'update_record': {
          const entity = String(config.entity || '');
          if (!WRITABLE.includes(entity)) return { ok: false, observation: `"${entity}" is not writable from a flow` };
          const id = String(config.record_id || input.record_id || '');
          if (!id) return { ok: false, observation: 'no record id on the step or in the run input' };
          await service.entities[entity].update(id, parseJson(config.data_json, {}) || {});
          return { ok: true, observation: `${entity} ${id} updated` };
        }
        case 'propose_changes': {
          const res = await service.functions.invoke('proposeNextChanges', {});
          const data = res?.data ?? res;
          return { ok: !data?.error, observation: `proposer raised ${data?.proposed ?? 0} proposal(s)` };
        }
        case 'sync_outcomes': {
          const res = await service.functions.invoke('outcomeSync', {});
          const data = res?.data ?? res;
          return { ok: !data?.error, observation: `outcomeSync closed ${data?.closed ?? 0}, waiting ${data?.waiting ?? 0}` };
        }
        case 'loop_audit': {
          const res = await service.functions.invoke('loopAudit', {});
          const data = res?.data ?? res;
          return { ok: !data?.error, observation: `loop audit scored ${data?.overall_score ?? '—'}/100 (${data?.verdict || 'no verdict'})` };
        }
        case 'validate_page': {
          const html = String(config.html || input.html || '');
          if (!html) return { ok: false, observation: 'no HTML to validate' };
          const res = await service.functions.invoke('independentValidation', { html, batch_id: config.batch_id });
          const data = res?.data ?? res;
          return { ok: !data?.error, observation: `validator returned ${data?.overall_score ?? '—'}`, result: JSON.stringify(data).slice(0, 2000) };
        }
        case 'prompt_chain': {
          const res = await service.functions.invoke('runPromptChain', {
            request: config.request || input.request || flow.purpose || flow.name,
            model: config.model || 'automatic',
            max_repair_cycles: num(config.max_repair_cycles, 1),
          });
          const data = res?.data ?? res;
          return { ok: !data?.error, observation: 'prompt chain completed' };
        }
        case 'notify': {
          const to = config.to || user.email;
          await service.integrations.Core.SendEmail({
            to,
            subject: config.subject || `${flow.name} ran`,
            body: config.body || `The automation "${flow.name}" completed its run.`,
          });
          return { ok: true, observation: `notification sent to ${to}` };
        }
        case 'wait': {
          return { ok: true, observation: `wait step recorded (${config.duration || 'no duration'}); durable waits belong to platform workflows`, skipped: true };
        }
        case 'branch': {
          const key = String(config.key || '');
          const expected = config.equals;
          const actual = input[key];
          const matched = String(actual) === String(expected);
          if (!matched) {
            skipped = num(config.skip_next, 0);
            return { ok: true, observation: `condition ${key}=${actual} did not equal ${expected}; skipping the next ${skipped} step(s)` };
          }
          return { ok: true, observation: `condition ${key}=${actual} matched` };
        }
        default:
          return { ok: false, observation: `unknown step type "${type}"` };
      }
    };

    for (const step of steps) {
      if (skipped > 0) {
        skipped -= 1;
        log.push({ step_id: step.id, type: step.type, label: step.label, ok: true, observation: 'skipped by the branch above' });
        continue;
      }
      let outcome;
      try {
        outcome = await runStep(step);
      } catch (error) {
        outcome = { ok: false, observation: error.message };
      }
      log.push({ step_id: step.id, type: step.type, label: step.label || '', ...outcome });
      if (!outcome.ok && (step.on_fail || 'stop') === 'stop') {
        break;
      }
    }

    const failed = log.filter((l) => !l.ok);

    if (flow.id) {
      await service.entities.AutomationFlow.update(flow.id, {
        last_run_at: new Date().toISOString(),
        last_run_status: failed.length ? 'failed' : 'completed',
        run_count: num(flow.run_count, 0) + 1,
        last_run_log_json: JSON.stringify(log).slice(0, 40000),
      });
    }

    await service.entities.AuditLog.create({
      entity_type: 'AutomationFlow',
      entity_id: flow.id || '',
      action: 'update',
      user_email: user.email,
      details: `Flow "${flow.name}" ran ${log.length}/${steps.length} step(s), ${failed.length} failed`,
      severity: failed.length ? 'warning' : 'info',
    });

    return Response.json({
      ok: failed.length === 0,
      flow: flow.name,
      ran: log.length,
      of: steps.length,
      failed: failed.length,
      log,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
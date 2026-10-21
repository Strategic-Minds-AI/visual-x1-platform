import { base44 } from "@/api/base44Client";

// One place for every call the loop's surfaces make, so the pages stay presentational
// and the function names and payload shapes live in a single file.
const call = (name, payload) =>
  base44.functions.invoke(name, payload).then((res) => res.data);

export const openChange = (change) => call("ledgerWrite", { action: "open", ...change });
export const gateChange = (id, gate) => call("ledgerWrite", { action: "gate", id, ...gate });
export const applyChange = (id, payload) => call("ledgerWrite", { action: "apply", id, ...payload });
export const recordOutcome = (id, payload) => call("ledgerWrite", { action: "outcome", id, ...payload });
export const revertChange = (id, reason) => call("ledgerWrite", { action: "revert", id, reason });

export const syncOutcomes = () => call("outcomeSync", {});
export const proposeNextChanges = () => call("proposeNextChanges", {});
export const runLoopAudit = () => call("loopAudit", {});

export const runFlow = (flowId, options = {}) => call("runAutomationFlow", { flow_id: flowId, ...options });
export const assignTask = (assignment) => call("assignTask", assignment);
export const vaultCall = (payload) => call("vaultAccess", payload);

// The transformer is what makes a typed message a production-quality prompt. It
// rejects anything over 2000 characters, so callers pass a sentence, not a brief.
export const transformPrompt = (sentence, category = "general") =>
  call("convertPrompt", { sentence, category });

export const askOrchestrator = (message, history, maxSteps = 8) =>
  call("autonomyChat", { message, history, max_steps: maxSteps });

export const readRecords = async (entity, options = {}) => {
  const page = await base44.entities[entity].filter(options.filter || {}, {
    limit: options.limit || 50,
    sort: options.sort || "-updated_date",
  });
  return page.items || page || [];
};

export const readOne = async (entity, filter) => {
  const page = await base44.entities[entity].filter(filter, { limit: 1, sort: "-updated_date" });
  const items = page.items || page || [];
  return items[0] || null;
};
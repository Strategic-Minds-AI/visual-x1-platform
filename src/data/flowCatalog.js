// The step catalogue behind the flow designer. Every entry is a step type the
// runner actually implements, with the config fields it reads, so a designer never
// offers a step the executor cannot perform. Presets are ordinary invoke_function
// steps with a real backend function already chosen — the way social, funnels and
// growth work is linked into one flow.
export const STEP_TYPES = [
  {
    id: "invoke_function",
    label: "Run a system module",
    hint: "Calls one of the app's backend functions and records what it returned",
    fields: [
      { key: "function_name", label: "Function", type: "select", options: [] },
      { key: "payload_json", label: "Payload (JSON)", type: "textarea", placeholder: '{"sentence":"..."}' },
    ],
  },
  {
    id: "assign_task",
    label: "Assign work to an agent",
    hint: "Creates the assignment and pushes it to Google Tasks, Calendar and email",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "work_type", label: "Work type", type: "select", options: ["audit", "repair", "build", "content", "social", "funnel", "research", "monitor"] },
      { key: "assigned_agent", label: "Assigned agent", type: "text" },
      { key: "priority", label: "Priority", type: "select", options: ["critical", "high", "medium", "low"] },
      { key: "due_hours", label: "Due in (hours)", type: "number" },
      { key: "channels", label: "Push to", type: "multiselect", options: ["tasks", "calendar", "gmail"] },
    ],
  },
  {
    id: "create_todo",
    label: "Create a todo",
    hint: "Adds a task to the operating board",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Detail", type: "textarea" },
      { key: "priority", label: "Priority", type: "select", options: ["high", "medium", "low"] },
      { key: "due_days", label: "Due in (days)", type: "number" },
    ],
  },
  {
    id: "create_record",
    label: "Create a record",
    hint: "Writes one record to an entity the flow is allowed to write",
    fields: [
      { key: "entity", label: "Entity", type: "text" },
      { key: "data_json", label: "Fields (JSON)", type: "textarea" },
    ],
  },
  {
    id: "update_record",
    label: "Update a record",
    hint: "Updates one record by id, from the step or the run input",
    fields: [
      { key: "entity", label: "Entity", type: "text" },
      { key: "record_id", label: "Record id (or leave blank to use the run input)", type: "text" },
      { key: "data_json", label: "Fields (JSON)", type: "textarea" },
    ],
  },
  {
    id: "propose_changes",
    label: "Propose the next changes",
    hint: "Computes the metric gaps and writes proposals with todos",
    fields: [],
  },
  {
    id: "sync_outcomes",
    label: "Close change outcomes",
    hint: "Measures every applied change whose window has elapsed and records its verdict",
    fields: [],
  },
  {
    id: "loop_audit",
    label: "Audit the loop",
    hint: "Checks outcomes, validation, rollback, guards and budget, and records the run",
    fields: [],
  },
  {
    id: "validate_page",
    label: "Validate a page",
    hint: "Runs independent validation over HTML supplied by the step or the run input",
    fields: [
      { key: "batch_id", label: "Batch id (optional)", type: "text" },
    ],
  },
  {
    id: "prompt_chain",
    label: "Run a prompt chain",
    hint: "Runs the orchestrator's prompt chain and records the decision",
    fields: [
      { key: "request", label: "Request", type: "textarea" },
      { key: "max_repair_cycles", label: "Repair cycles", type: "number" },
    ],
  },
  {
    id: "notify",
    label: "Notify by email",
    hint: "Sends a summary to a registered app user",
    fields: [
      { key: "to", label: "To (defaults to you)", type: "text" },
      { key: "subject", label: "Subject", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
    ],
  },
  {
    id: "branch",
    label: "Branch on a value",
    hint: "Skips the next steps unless the run input matches",
    fields: [
      { key: "key", label: "Input key", type: "text" },
      { key: "equals", label: "Equals", type: "text" },
      { key: "skip_next", label: "Steps to skip when it does not match", type: "number" },
    ],
  },
  {
    id: "wait",
    label: "Wait",
    hint: "Records a pause. Durable waits across hours or days belong to platform workflows.",
    fields: [{ key: "duration", label: "Duration (recorded, not held)", type: "text" }],
  },
];

// One-click presets for the work the system already knows how to do. Each one is
// an invoke_function step with a real function name pre-filled.
export const STEP_PRESETS = [
  { id: "social_schedule", label: "Generate a social schedule", type: "invoke_function", config: { function_name: "generateSocialSchedule" }, category: "social" },
  { id: "campaign", label: "Launch a campaign", type: "invoke_function", config: { function_name: "campaignLaunch" }, category: "growth" },
  { id: "programmatic", label: "Build programmatic structure", type: "invoke_function", config: { function_name: "buildProgrammaticStructure" }, category: "funnel" },
  { id: "backlinks", label: "Queue backlink sites", type: "invoke_function", config: { function_name: "queueBulkBacklinks" }, category: "growth" },
  { id: "mass_launch", label: "Run a mass launch", type: "invoke_function", config: { function_name: "massLaunch" }, category: "funnel" },
  { id: "factory", label: "Run the website factory", type: "invoke_function", config: { function_name: "orchestrateFactory", payload_json: '{"sentence":"..."}' }, category: "site" },
  { id: "clone", label: "Ingest a source for parity", type: "invoke_function", config: { function_name: "ingestClone" }, category: "site" },
  { id: "health", label: "Check backlink health", type: "invoke_function", config: { function_name: "checkBacklinkHealth" }, category: "monitor" },
  { id: "security", label: "Run a security audit", type: "invoke_function", config: { function_name: "securityAudit" }, category: "monitor" },
  { id: "repair", label: "Run the repair loop", type: "invoke_function", config: { function_name: "autoRepairLoop" }, category: "repair" },
  { id: "propose", label: "Propose next changes", type: "propose_changes", config: {}, category: "loop" },
  { id: "outcomes", label: "Close change outcomes", type: "sync_outcomes", config: {}, category: "loop" },
  { id: "audit", label: "Audit the loop", type: "loop_audit", config: {}, category: "loop" },
  { id: "assign", label: "Assign work to an agent", type: "assign_task", config: { work_type: "build", priority: "medium", due_hours: 48, channels: ["tasks"] }, category: "tasks" },
  { id: "todo", label: "Create a todo", type: "create_todo", config: { priority: "medium", due_days: 7 }, category: "tasks" },
  { id: "page_validation", label: "Validate a page", type: "validate_page", config: {}, category: "quality" },
  { id: "chain", label: "Run a prompt chain", type: "prompt_chain", config: { max_repair_cycles: 1 }, category: "quality" },
  { id: "mail", label: "Notify by email", type: "notify", config: {}, category: "tasks" },
];

export const stepTypeById = (id) => STEP_TYPES.find((s) => s.id === id) || null;

export const emptyStep = (type) => {
  const spec = stepTypeById(type);
  const config = {};
  (spec?.fields || []).forEach((f) => {
    config[f.key] = f.type === "multiselect" ? [] : "";
  });
  return {
    id: `step-${Math.random().toString(36).slice(2, 8)}`,
    type,
    label: spec?.label || type,
    config,
    on_fail: "stop",
  };
};

export const FLOW_CATEGORIES = ["site", "social", "funnel", "tasks", "growth", "operations", "custom"];
export const TRIGGER_KINDS = [
  { id: "manual", label: "Manual — I press run" },
  { id: "schedule", label: "Schedule — a cron expression" },
  { id: "entity_event", label: "Entity event — a record changes" },
  { id: "site_event", label: "Site event — recorded by the loop" },
];
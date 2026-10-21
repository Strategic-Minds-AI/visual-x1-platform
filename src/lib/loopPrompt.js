// The loop's prompt blocks. These are what turn the studio's brief from a request
// into a self-evaluating instruction: what the target is, what evidence must be
// gathered first, which past lessons apply, which guards must stay green, what the
// run predicts, how it proves the change, what would falsify it, how it is undone,
// what it must write back, and when it must stop. Every block is built from records
// — nothing here is invented at prompt time.
import { LOOP_BLUEPRINT, blueprintByLayer } from "@/data/loopBlueprint";

const parseJson = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const observationSteps = () =>
  blueprintByLayer("observation").map((i) => `${i.title}: ${i.requirement}`);

export function applicableLessons(ledger, change) {
  const rows = (ledger || []).filter((r) => r.lesson && ["worked", "harmed", "no_effect"].includes(r.verdict));
  const caps = new Set(change?.capability_ids || []);
  const metric = change?.predicted_metric || "";
  const scored = rows.map((row) => {
    let score = 0;
    (row.capability_ids || []).forEach((c) => {
      if (caps.has(c)) score += 2;
    });
    if (metric && row.predicted_metric === metric) score += 2;
    if (change?.routes?.length && (row.routes || []).some((r) => change.routes.includes(r))) score += 1;
    if (row.verdict === "harmed") score += 1;
    return { score, row };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ row }) => `${row.change_key} (${row.verdict}): ${row.lesson}`);
}

export function guardsText(guards) {
  const armed = (guards || []).filter((g) => g.status === "armed");
  if (!armed.length) return "REGRESSION GUARDS: none armed yet. Raise a guard for every defect this change touches.";
  return [
    "REGRESSION GUARDS (armed — none of these may break):",
    ...armed.map((g) => `- ${g.guard_key}${g.severity === "blocking" ? " [blocking]" : ""}: ${g.title} — check: ${g.check_spec || "as recorded"}`),
  ].join("\n");
}

export function targetsText(policy, metrics) {
  const targets = parseJson(policy?.metric_targets_json, []);
  if (!targets.length) {
    return "TARGETS: the policy sets no metric targets yet, so judge against the benchmark and say plainly that no target existed.";
  }
  return [
    `TARGETS (objective: ${policy?.objective_kind || "balanced"}):`,
    ...targets.map((t) => {
      const measured = (metrics || []).find((m) => m.metric === t.metric);
      return `- ${t.metric} ${t.comparator || "gte"} ${t.target} within ${t.window_days || 28} days — currently ${measured ? measured.value : "not measured"}`;
    }),
  ].join("\n");
}

export function blastRadiusText(change, policy) {
  return [
    "BLAST RADIUS & ROLLBACK:",
    `- Routes this change may touch: ${(change?.routes || []).join(", ") || "not named yet — name them before editing"}`,
    `- Maximum routes allowed by policy: ${policy?.max_routes_per_change ?? 3}`,
    `- Forbidden paths: ${(policy?.forbidden_paths || []).join(", ") || "none set"}`,
    "- State the snapshot taken before the change, the canary plan for a route-level change, and the exact steps that revert it.",
    "- A change without a rollback is refused by the ledger, so write the rollback before you write the change.",
  ].join("\n");
}

export function outcomeRecordText(change) {
  return [
    "OUTCOME RECORD (mandatory — the loop cannot learn without it):",
    `- Open the change in the ledger with: change_key "${change?.change_key || "name it"}", the objective, the routes and the predicted metric.`,
    "- Record each gate as it passes: validation score and decision, QA score, content score, regression result.",
    "- Record the apply with snapshot_ref and rollback_plan, which opens the attribution window.",
    "- When the window closes, record metric_before, metric_after and the confounders. The verdict is computed by the shared rule, not by you.",
    "- Write one reusable lesson: what worked, what did not, and what the next run of this class should do differently.",
  ].join("\n");
}

export function autonomyBudgetText(policy) {
  return [
    "AUTONOMY & BUDGET:",
    `- Autonomy level: ${policy?.autonomy_level || "L1_stage"} — do not go further without being told.`,
    `- Daily change budget: ${policy?.daily_change_budget ?? 5} applied changes.`,
    `- Cycle budget: ${policy?.budget_credits_per_cycle ?? 250} integration credits, ${policy?.budget_latency_ms ?? 600000} ms.`,
    `- Kill switch: ${policy?.kill_switch ? "ON — propose only, take no action" : "off"}. Anomaly pause: ${policy?.anomaly_pause ? "armed" : "off"}.`,
  ].join("\n");
}

export function stopConditionsText(policy) {
  const custom = (policy?.stop_conditions || "").split("\n").map((s) => s.trim()).filter(Boolean);
  return [
    "STOP CONDITIONS — stop and report the moment any of these is reached:",
    "- A budget or the daily change budget is spent.",
    "- A blocking regression guard fails, or the validator scores below 95, or a hard gate fails.",
    "- The same defect survives two repair rounds.",
    "- The change would cross a forbidden path, or the objective would be harmed to win a metric.",
    ...custom.map((c) => `- ${c}`),
  ].join("\n");
}

export function evidenceFirstText() {
  return [
    "EVIDENCE TO GATHER FIRST (before editing anything):",
    ...observationSteps().map((s) => `- ${s}`),
    "Anything you cannot gather must be reported as NOT RUN or unmeasured — never implied as passing.",
  ].join("\n");
}

export function predictionText(change) {
  return [
    "PREDICTION + CONFIDENCE:",
    `- State the metric this change is predicted to move${change?.predicted_metric ? ` (${change.predicted_metric})` : ""}, the size of the expected move, and a confidence 0-100.`,
    "- If the evidence does not support a prediction, say so and predict nothing. A confident wrong number is worse than an honest unknown.",
  ].join("\n");
}

export function selfEvaluationText(change) {
  return [
    "SELF-EVALUATION LOOP:",
    "- Work build → simulate → preview → validate → test → judge, and loop until the validator reads 95 or above with no hard-gate failure and every armed guard green.",
    "- Simulation and preview may be run as many times as it takes. A failed round is information, not a reason to lower the bar.",
    `- After ${change?.max_rounds || 3} rounds on the same defect, stop repairing and escalate with one precise question plus the evidence you already gathered.`,
    "- The loop's own integrity is part of what must pass: every applied change needs an outcome, a validation and a rollback.",
  ].join("\n");
}

export function proofText() {
  return [
    "PROOF-OF-CHANGE:",
    "- Re-run the same probes you ran before the change, and report them side by side: metric, before, after, and the source each number came from.",
    "- Confirm every armed guard still passes, and state any guard you could not run.",
    "- Where a claim has no evidence in the artifact, mark it unsupported rather than removing it from the report.",
  ].join("\n");
}

export function falsificationText(change) {
  return [
    "WHAT WOULD FALSIFY THIS:",
    `- ${change?.falsification || "Name, up front, the evidence that would prove this change failed — then go and look for it."}`,
    "- If you find that evidence, report the change as failed. Never report a change as successful because no one looked.",
  ].join("\n");
}

export function lessonsText(ledger, change) {
  const lessons = applicableLessons(ledger, change);
  if (!lessons.length) return "LESSONS THAT APPLY: none recorded yet for this class of change — the first run sets the baseline.";
  return ["LESSONS THAT APPLY (from measured outcomes, not opinion):", ...lessons.map((l) => `- ${l}`)].join("\n");
}

export function architectureText(items) {
  const live = (items || []).filter((i) => i.status === "live" || i.status === "verified");
  const open = (items || []).filter((i) => ["planned", "building", "blocked"].includes(i.status));
  return [
    "ARCHITECTURE CHECKLIST (the loop's own foundation):",
    `- Live (${live.length}): ${live.map((i) => i.title).join("; ") || "nothing yet"}`,
    `- Not yet live (${open.length}): ${open.map((i) => i.title).join("; ") || "nothing"}`,
    "- Do not propose work that an item above already provides; build on it instead.",
  ].join("\n");
}

// The full loop section appended to every brief. Blocks with nothing true to say
// are dropped rather than filled with filler.
export function buildLoopPrompt(ctx = {}) {
  const { policy, metrics, ledger, guards, change, items } = ctx;
  const blocks = [
    targetsText(policy, metrics),
    evidenceFirstText(),
    lessonsText(ledger, change),
    guardsText(guards),
    predictionText(change),
    selfEvaluationText(change),
    proofText(),
    falsificationText(change),
    blastRadiusText(change, policy),
    outcomeRecordText(change),
    autonomyBudgetText(policy),
    stopConditionsText(policy),
  ];
  if (items?.length) blocks.push(architectureText(items));
  return [
    "== THE LOOP ==",
    `This brief carries the ${LOOP_BLUEPRINT.length}-item foundation of a self-operating system. Work it as a closed loop.`,
    "",
    blocks.filter(Boolean).join("\n\n"),
  ].join("\n");
}

// The brief handed to the transformer. The transformer caps its input, so the loop
// section is compressed to its headings plus the load-bearing lines.
export function loopTransformerBrief(ctx = {}) {
  const { policy, change } = ctx;
  return [
    "Loop blocks required:",
    targetsText(policy, ctx.metrics).split("\n")[0],
    `autonomy ${policy?.autonomy_level || "L1_stage"}`,
    `routes ${(change?.routes || []).join(", ") || "unnamed"}`,
    "evidence-first, regression guards, prediction with confidence, self-evaluation loop, proof-of-change, falsification, blast radius and rollback, outcome write-back, stop conditions.",
  ].join(" ");
}
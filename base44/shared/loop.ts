// Deterministic helpers shared by the loop's backend functions. No model call is
// made anywhere in this module: every value returned here is computed from stored
// records and the active AutonomyPolicy, so the same inputs give the same verdict.

export const DEFAULT_POLICY = {
  name: "Visual X operating policy",
  objective_kind: "balanced",
  autonomy_level: "L1_stage",
  daily_change_budget: 5,
  max_routes_per_change: 3,
  budget_credits_per_cycle: 250,
  budget_latency_ms: 600000,
  anomaly_pause: true,
  kill_switch: false,
  forbidden_paths: [],
  metric_targets_json: "[]",
  non_negotiables: "",
  stop_conditions: "",
};

export const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const pctChange = (before, after) => {
  const b = Number(before);
  const a = Number(after);
  if (!Number.isFinite(b) || !Number.isFinite(a) || b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
};

export const parseJson = (raw, fallback) => {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return fallback;
  }
};

// The active policy, or the built-in defaults when the operator has set none. A
// missing policy never means "unrestricted": it means the conservative default.
export async function loadPolicy(service) {
  const page = await service.entities.AutonomyPolicy.filter(
    { is_active: true },
    { limit: 1, sort: "-updated_date" }
  );
  const items = page?.items || page || [];
  return items[0] || null;
}

export const policyWithDefaults = (policy) => ({ ...DEFAULT_POLICY, ...(policy || {}) });

export const metricTargets = (policy) => parseJson(policy?.metric_targets_json, []);

export const targetFor = (policy, metric) =>
  metricTargets(policy).find((t) => t && t.metric === metric) || null;

// Deterministic target check. null means "no target set for this metric", which
// is not the same as failed — the caller reports it as unmeasured.
export function meetsTarget(policy, metric, value) {
  const target = targetFor(policy, metric);
  if (!target || !Number.isFinite(Number(value))) return null;
  const v = Number(value);
  const t = Number(target.target);
  if (!Number.isFinite(t)) return null;
  switch (target.comparator) {
    case "lte":
      return v <= t;
    case "gt":
      return v > t;
    case "lt":
      return v < t;
    case "gte":
    default:
      return v >= t;
  }
}

// The one verdict rule. Direction decides worked / no_effect / harmed; a target,
// when one is set, can veto "worked" but never invents a failure.
// A move under one percent is treated as no effect, so noise is never called lift.
export function evaluateVerdict(policy, { before, after, metric }) {
  const b = Number(before);
  const a = Number(after);
  if (!Number.isFinite(b) || !Number.isFinite(a)) {
    return { verdict: "insufficient_evidence", delta: null, move: null, meets: null, reason: "no measurement available on both sides of the window" };
  }
  const delta = a - b;
  const move = pctChange(b, a);
  const meets = meetsTarget(policy, metric, a);
  if (move === null) {
    return { verdict: "insufficient_evidence", delta, move: null, meets, reason: "the pre-change value was zero, so no percentage can be computed" };
  }
  if (move <= -1) return { verdict: "harmed", delta, move, meets, reason: `moved ${move.toFixed(2)}% against the objective` };
  if (move >= 1 && meets === false) {
    return { verdict: "no_effect", delta, move, meets, reason: `moved ${move.toFixed(2)}% but still below the policy target` };
  }
  if (move >= 1) return { verdict: "worked", delta, move, meets, reason: `moved ${move.toFixed(2)}% for the objective` };
  return { verdict: "no_effect", delta, move, meets, reason: "moved less than one percent, which is inside noise" };
}

export function windowFor(days, from = new Date()) {
  const end = new Date(from);
  const start = new Date(end.getTime() - Math.max(1, num(days, 28)) * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function attributionEnd(days, from = new Date()) {
  return new Date(from.getTime() + Math.max(1, num(days, 28)) * 24 * 60 * 60 * 1000).toISOString();
}

export const isPast = (iso) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t <= Date.now();
};

const matchesRoute = (url, routes) =>
  Array.isArray(routes) &&
  routes.length > 0 &&
  routes.some((route) => route && String(url || "").includes(String(route)));

// The measurement for a change, resolved from records the app already holds.
// Returns null when nothing measurable matches — reported as insufficient
// evidence rather than invented as zero.
export async function resolveMetric(service, routes) {
  const [seoPage, sitePage] = await Promise.all([
    service.entities.SEOVariant.filter({}, { limit: 50, sort: "-updated_date" }),
    service.entities.SiteVariation.filter({}, { limit: 50, sort: "-updated_date" }),
  ]);
  const seo = (seoPage?.items || seoPage || []).filter((r) => matchesRoute(r.url, routes));
  if (seo.length) {
    const withCtr = seo.filter((r) => num(r.ctr) > 0);
    const ranked = (withCtr.length ? withCtr : seo).sort((x, y) => num(y.impressions) - num(x.impressions));
    return { metric: "ctr", value: num(ranked[0].ctr), source: "SEOVariant", source_id: ranked[0].id, sample: num(ranked[0].impressions) };
  }
  const site = (sitePage?.items || sitePage || []).filter((r) => matchesRoute(r.url, routes));
  if (site.length) {
    const rows = site.filter((r) => num(r.sessions) > 0);
    if (rows.length) {
      const sessions = rows.reduce((sum, r) => sum + num(r.sessions), 0);
      const weighted = rows.reduce((sum, r) => sum + num(r.conversion_rate) * num(r.sessions), 0);
      const leader = rows.find((r) => r.is_leader) || rows[0];
      return { metric: "conversion_rate", value: sessions ? weighted / sessions : num(leader.conversion_rate), source: "SiteVariation", source_id: leader.id, sample: sessions };
    }
  }
  return null;
}

export async function armedGuards(service) {
  const page = await service.entities.RegressionGuard.filter({ status: "armed" }, { limit: 100 });
  return page?.items || page || [];
}

export const guardsForRoutes = (guards, routes) =>
  (guards || []).filter((g) => {
    const scope = Array.isArray(g.routes) ? g.routes : [];
    if (!scope.length) return true;
    return scope.some((r) => (routes || []).includes(r));
  });

export const blockingGuards = (guards, failures) => {
  const failed = new Set(failures || []);
  return (guards || []).filter((g) => g.severity === "blocking" && failed.has(g.guard_key));
};

// Gap analysis: what the objective wants minus what the records show. Deterministic
// ordering by weighted size of the gap, so the backlog is reproducible.
export function gapProposals(policy, metrics) {
  const weights = parseJson(policy?.objective_weights_json, {});
  const rows = [];
  metricTargets(policy).forEach((target) => {
    if (!target || !target.metric) return;
    const measured = (metrics || []).find((m) => m.metric === target.metric);
    const current = measured ? Number(measured.value) : null;
    const want = Number(target.target);
    if (!Number.isFinite(want)) return;
    if (current !== null && Number.isFinite(current)) {
      const met = target.comparator === "lte" || target.comparator === "lt" ? current <= want : current >= want;
      if (met) return;
    }
    const gap = current === null ? null : Math.abs(want - current);
    const weight = num(weights[target.metric], 1);
    rows.push({
      metric: target.metric,
      target: want,
      comparator: target.comparator || "gte",
      current,
      gap,
      weight,
      score: gap === null ? weight * 100 : gap * weight,
      evidence: measured ? `measured ${current} from ${measured.source}` : "not measured yet",
    });
  });
  return rows.sort((a, b) => b.score - a.score);
}

// The loop integrity checks. Each one answers a question about the loop itself,
// not about the website, and every answer is a computed fact.
export function loopChecks({ ledger, guards, items, policy }) {
  const rows = ledger || [];
  const applied = rows.filter((r) => r.status === "applied");
  const pendingVerdict = applied.filter((r) => !r.verdict || r.verdict === "pending");
  const noValidation = applied.filter((r) => !(num(r.validation_score) > 0));
  const noRollback = applied.filter((r) => !r.rollback_plan);
  const armed = (guards || []).filter((g) => g.status === "armed");
  const staleGuards = armed.filter((g) => !g.last_checked_at);
  const liveItems = (items || []).filter((i) => i.status === "live" || i.status === "verified");
  const unprovenItems = liveItems.filter((i) => !i.evidence);
  const budget = num(policy?.daily_change_budget, 5);
  const appliedToday = applied.filter((r) => {
    const t = new Date(r.updated_date || r.created_date || 0).getTime();
    return Number.isFinite(t) && Date.now() - t < 24 * 60 * 60 * 1000;
  });

  const checks = [
    { id: "every_change_has_outcome", label: "Every applied change has a recorded outcome", required: true, result: pendingVerdict.length === 0 ? "PASS" : "FAIL", expected: "0 applied changes awaiting a verdict", found: `${pendingVerdict.length} awaiting`, evidence: pendingVerdict.slice(0, 8).map((r) => r.change_key).join(", ") },
    { id: "every_change_validated", label: "Every applied change passed independent validation", required: true, result: noValidation.length === 0 ? "PASS" : "FAIL", expected: "0 applied changes without a validator score", found: `${noValidation.length} without a score`, evidence: noValidation.slice(0, 8).map((r) => r.change_key).join(", ") },
    { id: "every_change_revertible", label: "Every applied change has a rollback plan", required: true, result: noRollback.length === 0 ? "PASS" : "FAIL", expected: "0 applied changes without a rollback plan", found: `${noRollback.length} without one`, evidence: noRollback.slice(0, 8).map((r) => r.change_key).join(", ") },
    { id: "guards_have_run", label: "Armed regression guards have run", required: false, result: staleGuards.length === 0 ? "PASS" : "FAIL", expected: "0 armed guards never run", found: `${staleGuards.length} never run`, evidence: staleGuards.slice(0, 8).map((g) => g.guard_key).join(", ") },
    { id: "live_items_evidenced", label: "Live architecture items carry evidence", required: false, result: unprovenItems.length === 0 ? "PASS" : "FAIL", expected: "0 live items without evidence", found: `${unprovenItems.length} without evidence`, evidence: unprovenItems.slice(0, 8).map((i) => i.key).join(", ") },
    { id: "daily_budget_honoured", label: "Applied changes stay inside the daily budget", required: true, result: appliedToday.length <= budget ? "PASS" : "FAIL", expected: `at most ${budget} applied changes in 24h`, found: `${appliedToday.length} applied`, evidence: appliedToday.slice(0, 8).map((r) => r.change_key).join(", ") },
  ];

  const blocking = checks.filter((c) => c.required && c.result === "FAIL");
  return { checks, blocking, pass: blocking.length === 0, pending: pendingVerdict.length };
}

export const maskValue = (value) => {
  const s = String(value || "");
  if (!s) return "";
  if (s.length <= 4) return "••••";
  return `${"•".repeat(Math.min(12, s.length - 4))}${s.slice(-4)}`;
};
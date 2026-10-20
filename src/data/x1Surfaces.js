// Measured from the X1-OPERATING-SYSTEMS repository (Strategic-Minds-AI) and its live
// deployment on 2026-10-20: BrandTheme.css, main.jsx, vercel.json, the api/x1 route
// files, and response headers/status from www.strategicmindsai.com itself.
// Nothing here is inferred from naming: each entry was read from the source or answered
// by the live endpoint. Parity states are recorded honestly, including the blockers.

export const X1_BRAND = {
  name: "Strategic Minds AI",
  system: "X1 Operating System",
  tagline: "INTELLIGENCE IN MOTION",
  site: "https://www.strategicmindsai.com",
  emblem: "https://www.strategicmindsai.com/v2-assets/silver-emblem.png",
  wordmark: "https://www.strategicmindsai.com/v2-assets/chrome-wordmark.png",
  earth: "https://www.strategicmindsai.com/v2-assets/connected-earth.jpg",
  font: "Inter",
  swatches: [
    { token: "canvas", hex: "#02050d" },
    { token: "header", hex: "#02060f" },
    { token: "surface", hex: "#030914" },
    { token: "panel", hex: "#061726" },
    { token: "cyan", hex: "#02cfff" },
    { token: "blue", hex: "#128cff" },
    { token: "green", hex: "#66ff9c" },
    { token: "white", hex: "#f6fbff" },
    { token: "muted", hex: "#9bbdd0" },
    { token: "focus", hex: "#83ffb4" }
  ]
};

// The nine experiences inside apps/strategic-minds-v2/src, each a lazy-loaded route.
export const X1_EXPERIENCES = [
  { name: "V2Experience", routes: "/v2/a · /v2/b · /v2/c · /v2/eden", what: "Cinematic marketing front end: chrome S, Earth and star motion, services, approach, Eden discovery demo.", parity: "pending" },
  { name: "PricingExperience", routes: "/pricing", what: "Discovery-first pricing across reach tiers (city, region, nationwide, international) with proposal request.", parity: "pending" },
  { name: "ClientPortalExperience", routes: "/portal · /portal/demo", what: "Client workspace: project status, timeline, approvals, guided by Eden.", parity: "pending" },
  { name: "LaunchStudio", routes: "/admin/launch-studio", what: "Largest module (62 KB): build brief to generated site — brand, industry, niche, market, audience, goal.", parity: "pending" },
  { name: "VisualStudio", routes: "/admin/visual-editor", what: "Visual editor surface for generated output.", parity: "pending" },
  { name: "X1AgentConsole", routes: "/admin/agent", what: "Agent console for the X1 agent plane.", parity: "pending" },
  { name: "PromptLab", routes: "/admin/prompt-lab", what: "Prompt asset library with ordered multi-step blueprints, category and instructions; email-code gate.", parity: "pending" },
  { name: "CodingKanban", routes: "/admin/coding-kanban", what: "X1 engineering queue: new work packet, task queue, staging sign-in.", parity: "pending" },
  { name: "IntelligenceWorkbench", routes: "/admin/intelligence", what: "Intelligence workbench: GitHub Search repository discovery, staging sign-in.", parity: "pending" }
];

// The twelve serverless routes under api/x1. reachable = what the endpoint answered
// when Visual X read it just now; X1's production runtime refuses non-preview work.
export const X1_API_PLANE = [
  { name: "health", path: "/api/x1/health", read: true, note: "Staging adapter health, writes and dispatch flags.", answer: 'status UNBOUND · reason NON_PREVIEW_RUNTIME · writes DISABLED · dispatch DISABLED' },
  { name: "worker-status", path: "/api/x1/worker-status", read: true, note: "Railway worker plane status.", answer: "status BLOCKED · reason NON_PREVIEW_RUNTIME" },
  { name: "operator-status", path: "/api/x1/operator-status", read: true, note: "Operator status, tenant-scoped, JWT caller.", answer: "status BLOCKED · reason AUTHENTICATION_REQUIRED" },
  { name: "browser-health", path: "/api/x1/browser-health", read: true, note: "Browser engine health, JWT caller.", answer: "status BLOCKED · reason AUTHENTICATION_REQUIRED" },
  { name: "agent-config", path: "/api/x1/agent-config", read: true, note: "Agent configuration; gpt and dispatch flags.", answer: "status UNBOUND · gpt DISABLED · dispatch DISABLED" },
  { name: "work-items", path: "/api/x1/work-items", read: true, note: "Work packets in the coding queue.", answer: "status UNBOUND · reason NON_PREVIEW_RUNTIME" },
  { name: "agent-chat", path: "/api/x1/agent-chat", read: false, note: "POST + GET agent chat; privileged writes behind a caller JWT.", answer: "Write path. Not opened from here." },
  { name: "agent-sessions", path: "/api/x1/agent-sessions", read: true, note: "Agent session records behind a caller JWT.", answer: "status BLOCKED · reason AUTHENTICATION_REQUIRED" },
  { name: "intelligence-scan", path: "/api/x1/intelligence-scan", read: false, note: "Delegates to the server-side intelligence scan module.", answer: "Not read yet." },
  { name: "prompt-assets", path: "/api/x1/prompt-assets", read: false, note: "Prompt asset library behind the X1 prompt workbench.", answer: "Not read yet." },
  { name: "prompt-evaluate", path: "/api/x1/prompt-evaluate", read: false, note: "Prompt evaluation endpoint.", answer: "Not read yet." },
  { name: "mcp", path: "/api/x1/mcp", read: false, note: "X1's own MCP surface; replaced by the platform's MCP server rather than merged.", answer: "Not read yet." }
];

// Facts that decide what a merge can and cannot do. Each was observed, not assumed.
export const X1_BLOCKERS = [
  {
    id: "no-base44",
    title: "X1 is required to run without Base44",
    evidence: "docs/X1_AUTONOMOUS_FACTORY_TARGET_ARCHITECTURE.md, non-negotiable rule 1: no Base44 runtime dependency; Base44 apps may be read as legacy export sources only.",
    consequence: "Visual X cannot absorb X1 by owning its runtime. It reads and presents X1, and X1 stays the authority for its own queue and workers."
  },
  {
    id: "non-preview",
    title: "X1's production runtime refuses to bind",
    evidence: "/api/x1/health answered 503 status UNBOUND, reason NON_PREVIEW_RUNTIME, writes DISABLED, dispatch DISABLED.",
    consequence: "Live operational parity cannot come from X1's production deployment. It needs X1's preview runtime with a bound session, or a ported module."
  },
  {
    id: "framing",
    title: "X1 blocks being framed",
    evidence: "apps/strategic-minds-v2/vercel.json sets X-Frame-Options SAMEORIGIN on every path.",
    consequence: "X1's interface cannot be embedded in a Visual X panel. Visual X holds the controls and links out; X1 keeps its own screens."
  },
  {
    id: "auth",
    title: "Two identities",
    evidence: "operator-status and browser-health answered 401 AUTHENTICATION_REQUIRED; the consoles sign in with an email one-time code.",
    consequence: "Status reads need an X1 session. A truly merged console needs one identity decision, and X1's docs put its auth outside Base44."
  },
  {
    id: "one-queue",
    title: "One orchestration authority only",
    evidence: "Same doc, rule 2: reuse the canonical X1 Supabase queue, leases, idempotency keys and worker plane; do not create a second queue, scheduler or agent registry.",
    consequence: "No second queue is built in Visual X. Work routed to X1 goes through X1's own plane."
  }
];

export const PARITY_LABELS = {
  pending: "Not ported",
  live: "Read live here",
  blocked: "Blocked by X1"
};
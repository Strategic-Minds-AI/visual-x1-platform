// X1 source inventory, read directly from the GitHub repository through the
// authorized connector. Every entry below was observed in the repository tree,
// the router, or the deployment configuration — nothing here is inferred.

export const X1_SOURCE = {
  repo: "Strategic-Minds-AI/X1-OPERATING-SYSTEMS",
  app_root: "apps/strategic-minds-v2",
  pinned_commit: "4cd951118810081a02a4c010c269fb116123f2e0",
  production_url: "https://www.strategicmindsai.com",
  vercel_project: "x1-operating-system",
  files_total: 136,
  app_files: 83,
  app_source_files: 22,
  source_breakdown: "10 JSX pages and workspaces · 10 CSS files · 1 engine module · 1 template catalog",
  ingested_at: "2026-10-20T09:15:00-04:00",
  stack: "React 18.3.1 · Vite 7.1.2 · react-router-dom 6.30.1 · lucide-react 0.475.0 (no Base44 SDK in the source app)",
};

// X1's route contract, taken from src/main.jsx and vercel.json rewrites.
// status: "native"  = the real X1 surface, ported from X1 source
//         "module"  = this application's working implementation serving that X1 workspace
//         "deferred"= source read and scheduled, not yet ported
export const X1_ROUTES = [
  { route: "/", source: "main.jsx redirect", target: "/v2/b", local: "/", status: "native", note: "Root serves the extended homepage exactly as X1 does; the Visual X console moved behind /workspace" },
  { route: "/v2/a", source: "src/V2Experience.jsx", local: "/v2/a", status: "native", note: "Cinematic hero, chrome S, single CTA" },
  { route: "/v2/b", source: "src/V2Experience.jsx", local: "/v2/b", status: "native", note: "Extended homepage: hero, 8 services, reach, approach, CTA" },
  { route: "/v2/c", source: "src/V2Experience.jsx", local: "/v2/c", status: "native", note: "Eden Skye portrait plus four-question discovery demo" },
  { route: "/v2/eden", source: "main.jsx variant alias", local: "/v2/eden", status: "native", note: "Alias route to the same Eden workspace" },
  { route: "/pricing", source: "src/PricingExperience.jsx (11.2 kB)", local: "/pricing", status: "native", note: "Pricing workspace: three engagements, proposal builder, journey and FAQ" },
  { route: "/portal", source: "src/ClientPortalExperience.jsx (20.9 kB)", local: "/portal", status: "native", note: "Portal gateway with the secure sign-in state, exactly as X1 renders it" },
  { route: "/portal/workspace", source: "src/ClientPortalExperience.jsx", local: "/portal/workspace", status: "native", note: "Seven-workspace client portal; X1's 40.8 kB CommercePortal.css and brand tokens bundled byte-exact" },
  { route: "/admin/studio", source: "src/VisualStudio.jsx (21.7 kB)", local: "/admin/studio", status: "module", note: "Served by the Visual X Visual Editor engine" },
  { route: "/admin/visual-editor", source: "src/VisualStudio.jsx", local: "/admin/visual-editor", status: "module", note: "Same X1 workspace under its second route" },
  { route: "/admin/coding-kanban", source: "src/CodingKanban.jsx (13.6 kB)", local: "/admin/coding-kanban", status: "module", note: "Served by the Kanban execution board" },
  { route: "/admin/prompt-lab", source: "src/PromptLab.jsx (18.9 kB)", local: "/admin/prompt-lab", status: "module", note: "Served by Prompt Lab" },
  { route: "/admin/intelligence", source: "src/IntelligenceWorkbench.jsx (9.9 kB)", local: "/admin/intelligence", status: "module", note: "Served by the analytics workspace" },
  { route: "/admin/agent", source: "src/X1AgentConsole.jsx (15.3 kB)", local: "/admin/agent", status: "module", note: "Served by the agent activity console" },
  { route: "/admin/launch-studio", source: "src/LaunchStudio.jsx (61.4 kB)", local: "/admin/launch-studio", status: "module", note: "Served by the website factory pipeline" },
  { route: "/admin/parity", source: "this ledger", local: "/admin/parity", status: "native", note: "Clone parity ledger" },
  { route: "*", source: "main.jsx catch-all", target: "/v2/b", local: "—", status: "native", note: "Unknown paths return to the extended homepage" },
];

// The X1 backend interfaces observed in the repository, and whether this
// application can reach them today. Status codes below were measured live on
// 2026-10-20, not carried over from earlier assumptions.
export const X1_BACKEND_INTERFACES = [
  { interface: "api/x1/health.js", purpose: "Control-plane health and component status", reachable: false, measured: "503 UNBOUND / NON_PREVIEW_RUNTIME", note: "X1 answers as an unbound staging adapter: writes DISABLED, dispatch DISABLED outside an authorized preview runtime" },
  { interface: "api/x1/operator-status.js", purpose: "Operator and lease state", reachable: false, measured: "401 AUTHENTICATION_REQUIRED", note: "Reachable endpoint, but this application holds no X1 operator credential" },
  { interface: "api/x1/worker-status.js", purpose: "Railway worker fleet status", reachable: false, measured: "503 NON_PREVIEW_RUNTIME", note: "Blocked by the same staging-adapter gate plus no authorized Railway connector" },
  { interface: "api/x1/work-items.js", purpose: "Queue and work-item records", reachable: false, measured: "503 UNBOUND", note: "Queue reads stay closed until the adapter is bound to an authorized runtime" },
  { interface: "api/x1/agent-chat.js", purpose: "Agent conversation bridge", reachable: false, measured: "blocked (adapter gate)", note: "Ollama is configured locally as a secret; X1's own bridge is not serving" },
  { interface: "api/x1/intelligence-scan.js", purpose: "Intelligence scan dispatch", reachable: false, measured: "blocked (dispatch DISABLED)", note: "Dispatch is switched off upstream" },
  { interface: "api/x1/prompt-assets.js", purpose: "Prompt asset library", reachable: false, measured: "503 UNBOUND", note: "Prompt assets cannot be pulled from X1 yet" },
  { interface: "api/x1/prompt-evaluate.js", purpose: "Prompt evaluation", reachable: false, measured: "blocked (adapter gate)", note: "Evaluation runs locally instead until the X1 surface opens" },
  { interface: "api/x1/browser-health.js", purpose: "Browser capture engine health", reachable: false, measured: "401 AUTHENTICATION_REQUIRED", note: "This is why no rendered visual score can be claimed yet" },
  { interface: "api/x1/mcp.js", purpose: "MCP surface", reachable: false, measured: "blocked (adapter gate)", note: "Blocked with the rest of the X1 HTTP plane" },
  { interface: "Supabase data plane (read-only)", purpose: "Tenant, project and operational records", reachable: null, measured: "read-only connector", note: "Connector holds projects:read and database:read only; production reported zero tenant memberships" },
  { interface: "GitHub repository", purpose: "Complete application source", reachable: true, measured: "200", note: "Read at the pinned commit; this is the source of the clone" },
  { interface: "Vercel delivery", purpose: "Deployment status and preview environments", reachable: true, measured: "authorized", note: "Deployed console with a project token; used for release and preview control" },
];

// Blockers measured on this application, recorded rather than assumed.
export const X1_LIMITS = [
  { id: "capture", title: "Automated browser capture is refused", evidence: "The capture engine answers 401 to authenticated requests from this application.", consequence: "No rendered visual similarity score can be produced honestly; scoring stays open." },
  { id: "upstream", title: "X1's HTTP plane is an unbound staging adapter", evidence: "Measured 2026-10-20: health and work-items answer 503 UNBOUND / NON_PREVIEW_RUNTIME with writes and dispatch DISABLED; operator-status and browser-health answer 401 AUTHENTICATION_REQUIRED.", consequence: "X1 queue, lease, worker and capture state cannot be read or driven from here yet. The gate is runtime binding plus an operator credential, not a missing deployment." },
  { id: "railway", title: "No Railway connector is authorized", evidence: "Railway is not present in this workspace's authorized connectors.", consequence: "Agent workers and long-running queues cannot be provisioned from here; they stay owned by X1." },
  { id: "supabase", title: "The data plane is read-only", evidence: "The Supabase connector grants projects:read and database:read only.", consequence: "X1 records can be read and mirrored, never merged or overwritten." },
  { id: "tenancy", title: "Production tenants are unpopulated", evidence: "Production Supabase reports zero tenant memberships.", consequence: "Portal and organization workflows cannot be proven with real tenant data yet." },
];
import {
  Activity, Award, BarChart3, Bot, Boxes, Briefcase, ClipboardCheck, Code2, Compass, Cpu, Download,
  ExternalLink, Factory, FlaskConical, FolderOpen, Gauge, GitBranch, Globe2, GraduationCap, LayoutDashboard,
  LayoutGrid, LayoutTemplate, Layers, Link2, ListChecks, Palette, Rocket, Search, Share2, ShieldCheck,
  Sparkles, Target, TrendingUp, Truck, UserPlus, Users, Wand2, Workflow,
} from "lucide-react";

// The console's own sections. They render inside the operator shell.
export const CONSOLE_SECTIONS = [
  { id: "overview", label: "Command Deck", icon: LayoutDashboard },
  { id: "architecture", label: "System Architecture", icon: Workflow },
  { id: "flows", label: "Flow Designer", icon: GitBranch },
  { id: "agents", label: "Agent Registry", icon: Bot },
  { id: "vault", label: "Guardian Vault", icon: ShieldCheck },
  { id: "prompt", label: "Prompt System", icon: Sparkles },
  { id: "visualeditor", label: "Visual Editor", icon: Code2 },
  { id: "clone", label: "Clone & Ingest", icon: Download },
  { id: "factory", label: "Website Factory", icon: Factory },
  { id: "approvals", label: "Release Gates", icon: ShieldCheck },
  { id: "clients", label: "Client Intake", icon: Users },
  { id: "assets", label: "Brand Assets", icon: FolderOpen },
  { id: "releases", label: "QA & Deployments", icon: Rocket },
];

// Every Visual X module, grouped by what it is for. Each entry is a real route in
// this app: the hub and the rail use them as the way into the system's technology.
export const MODULE_GROUPS = [
  {
    label: "The Loop",
    items: [
      { to: "/admin?section=architecture", label: "System Architecture", desc: "The living checklist, the prompt foundation and the ledger", Icon: Workflow },
      { to: "/admin?section=flows", label: "Flow Designer", desc: "Drag steps into an automation across social, funnels and tasks", Icon: GitBranch },
      { to: "/admin?section=agents", label: "Agent Registry", desc: "Agents, their skills, access levels and assignments", Icon: Bot },
      { to: "/admin?section=vault", label: "Guardian Vault", desc: "Credential references, scopes and the audited read trail", Icon: ShieldCheck },
    ],
  },
  {
    label: "Build",
    items: [
      { to: "/prompt-system", label: "Prompt System", desc: "Versioned prompt modules and the chain runner", Icon: Sparkles },
      { to: "/prompt-lab", label: "Prompt Lab", desc: "Idea to refined prompt to compiled spec", Icon: FlaskConical },
      { to: "/prompt-studio", label: "Prompt Studio", desc: "Convert a request into an advanced prompt", Icon: Wand2 },
      { to: "/admin/studio", label: "Visual Studio", desc: "X1's studio surface for visual builds", Icon: Palette },
      { to: "/factory", label: "Website Factory", desc: "Batch site generation, QA and repair", Icon: Factory },
      { to: "/template-engine", label: "Template Engine", desc: "Industry templates mapped to programmatic structure", Icon: LayoutTemplate },
      { to: "/academy-templates", label: "Academy Templates", desc: "Teaching pattern library", Icon: GraduationCap },
    ],
  },
  {
    label: "Operate",
    items: [
      { to: "/job-board", label: "Job Board", desc: "Live job queue and agent assignment", Icon: Briefcase },
      { to: "/kanban", label: "Kanban", desc: "Work in flight across the system", Icon: ListChecks },
      { to: "/agent-activity", label: "Agent Activity", desc: "Reasoning logs and agent messages", Icon: Bot },
      { to: "/system-control", label: "System Control", desc: "Agents, memory, guardian and QA in one view", Icon: Cpu },
      { to: "/workflow-map", label: "Workflow Map", desc: "Every stage and its gates", Icon: Workflow },
      { to: "/clone-ingest", label: "Clone & Ingest", desc: "Capture a source and prove parity", Icon: Download },
      { to: "/delivery", label: "Delivery Console", desc: "Deployments and their live status", Icon: Truck },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/analytics", label: "Intelligence", desc: "Traffic, performance and agent analytics", Icon: BarChart3 },
      { to: "/benchmarks", label: "Benchmark Library", desc: "Reference sites and scorecards", Icon: Award },
      { to: "/opportunities", label: "Opportunity Matrix", desc: "Ranked lead verticals and markets", Icon: Target },
      { to: "/seo-simulator", label: "SEO Simulator", desc: "Strategy simulation before spend", Icon: TrendingUp },
      { to: "/variations", label: "Variations", desc: "Site variants and their measured lift", Icon: GitBranch },
      { to: "/discovery", label: "Discovery Package", desc: "Client research, competitors and proposal", Icon: Search },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/backlink-health", label: "Backlink Health", desc: "Programmatic properties and their uptime", Icon: Link2 },
      { to: "/social-studio", label: "Social Studio", desc: "Scheduled campaigns and drafted posts", Icon: Share2 },
      { to: "/visual-approval", label: "Visual Approval", desc: "Batch previews awaiting a human decision", Icon: ClipboardCheck },
      { to: "/onboarding", label: "Client Onboarding", desc: "Intake, tools and the locked goal", Icon: UserPlus },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/x1", label: "X1 Operating System", desc: "The runtime this system sits under", Icon: Layers },
      { to: "/x1-experience", label: "X1 Experience", desc: "The X1 host surfaces and their status", Icon: Globe2 },
      { to: "/builder-map", label: "Builder Map", desc: "The builder's own surface map", Icon: Compass },
      { to: "/system-capabilities", label: "System Capabilities", desc: "What the system can do today", Icon: Boxes },
      { to: "/system-benchmarks", label: "System Benchmarks", desc: "Where we stand against each benchmark", Icon: Gauge },
      { to: "/system-audit", label: "System Audit", desc: "Evidence-gated audit of the system itself", Icon: ShieldCheck },
      { to: "/workspace", label: "Workspace", desc: "The builder workspace", Icon: LayoutGrid },
      { to: "/dashboard", label: "Dashboard", desc: "The earlier operating dashboard", Icon: Activity },
      { to: "/portal", label: "Client Portal", desc: "What the client sees", Icon: ExternalLink },
    ],
  },
];

const ALL_MODULES = MODULE_GROUPS.flatMap((group) => group.items);

// The rail carries the modules an operator reaches for most; the hub holds all.
const RAIL_ORDER = ["/job-board", "/kanban", "/agent-activity", "/analytics", "/benchmarks", "/opportunities", "/prompt-lab", "/delivery"];
export const RAIL_MODULES = RAIL_ORDER.map((to) => ALL_MODULES.find((m) => m.to === to)).filter(Boolean);
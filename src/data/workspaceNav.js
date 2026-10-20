import {
  Home, LayoutDashboard, Copy, Code2, Briefcase, Users, Boxes, Gauge,
  Sprout, Cpu, Wand2, Sparkles, Search, ListChecks, Layers, ShieldCheck,
  CalendarClock, Rocket, Map as MapIcon, Radar, Globe, Star, Eye, Link2, Clapperboard
} from "lucide-react";

// One place for the workspace's navigation and brand assets, so the shell and the
// Visual Editor's own top bar and tool rail can never drift apart.
// X1's own brand assets, taken from the live X1 front end.
export const X1_EMBLEM = "https://www.strategicmindsai.com/v2-assets/silver-emblem.png";
export const X1_WORDMARK = "https://www.strategicmindsai.com/v2-assets/chrome-wordmark.png";

// Thin vertical rail: the always-visible spine of the system.
export const WORKSPACE_RAIL = [
  { to: "/workspace", label: "Visual X Console", Icon: Home },
  { to: "/x1-home", label: "X1 Home", Icon: Star },
  { to: "/x1", label: "X1 Operating System", Icon: Radar },
  { to: "/x1-experience", label: "X1 Live App", Icon: Globe },
  { to: "/visual-x", label: "Visual X Module", Icon: Wand2 },
  { to: "/clone-ingest", label: "Clone & Ingest", Icon: Copy },
  { to: "/delivery", label: "Delivery", Icon: Rocket },
  { to: "/visual-editor", label: "Visual Editor", Icon: Code2 },
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/job-board", label: "Job Board", Icon: Briefcase },
  { to: "/agent-activity", label: "Agent Activity", Icon: Users },
  { to: "/factory", label: "Website Factory", Icon: Boxes },
  { to: "/benchmarks", label: "Benchmarks", Icon: Gauge },
  { to: "/seo-simulator", label: "Growth Simulator", Icon: Sprout },
  { to: "/system-control", label: "System Control", Icon: Cpu },
];

export const WORKSPACE_TOP_LINKS = [
  { to: "/workspace", label: "Visual X Console" },
  { to: "/x1-home", label: "X1 Home" },
  { to: "/x1", label: "X1 OS" },
  { to: "/x1-experience", label: "X1 Live App" },
  { to: "/clone-ingest", label: "Clone & Ingest" },
  { to: "/visual-editor", label: "Visual Editor" },
  { to: "/delivery", label: "Delivery" },
  { to: "/prompt-system", label: "Prompt System" },
];

export const WORKSPACE_TOP_GROUPS = [
  {
    label: "Clients",
    items: [
      { to: "/onboarding", label: "Client Onboarding", Icon: Users },
      { to: "/discovery", label: "Discovery Packages", Icon: Search },
      { to: "/workflow-map", label: "Workflow Map", Icon: ListChecks },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/x1-home", label: "X1 Home", Icon: Star },
      { to: "/x1", label: "X1 Operating System", Icon: Radar },
      { to: "/x1-experience", label: "X1 Live App", Icon: Globe },
      { to: "/system-capabilities", label: "Capabilities", Icon: Layers },
      { to: "/builder-map", label: "Builder Map", Icon: MapIcon },
      { to: "/system-benchmarks", label: "System Benchmarks", Icon: Gauge },
      { to: "/system-audit", label: "System Audit", Icon: ShieldCheck },
      { to: "/system-control", label: "System Control", Icon: Cpu },
      { to: "/benchmarks", label: "Benchmark Library", Icon: Gauge },
      { to: "/visual-x", label: "Visual X Module", Icon: Wand2 },
      { to: "/admin/parity", label: "Clone Parity Ledger", Icon: ListChecks },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/job-board", label: "Job Board", Icon: Briefcase },
      { to: "/kanban", label: "Kanban", Icon: ListChecks },
      { to: "/agent-activity", label: "Agent Activity", Icon: Users },
      { to: "/analytics", label: "Analytics", Icon: Gauge },
      { to: "/factory", label: "Website Factory", Icon: Boxes },
      { to: "/visual-approval", label: "Visual Approval", Icon: ShieldCheck },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/seo-simulator", label: "Growth Simulator", Icon: Sprout },
      { to: "/opportunities", label: "Opportunities", Icon: Sparkles },
      { to: "/template-engine", label: "Template Engine", Icon: Layers },
      { to: "/variations", label: "Variations", Icon: Gauge },
      { to: "/backlink-health", label: "Backlink Health", Icon: ShieldCheck },
      { to: "/social-studio", label: "Social Studio", Icon: CalendarClock },
      { to: "/prompt-studio", label: "Prompt Studio", Icon: Wand2 },
      { to: "/prompt-lab", label: "Prompt Lab", Icon: Sparkles },
    ],
  },
];

// The Visual Editor's tool rail. Ids mirror the tabs of the canvas panel on the
// right, so a rail button and a canvas tab drive the exact same view.
export const EDITOR_TOOLS = [
  { id: "preview", label: "Artifact preview", Icon: Eye },
  { id: "video", label: "Video generator", Icon: Clapperboard },
  { id: "browser", label: "Live browser", Icon: Globe },
  { id: "agents", label: "Multi-agent round", Icon: Users },
  { id: "simulator", label: "Prompt simulator", Icon: ShieldCheck },
  { id: "chain", label: "Prompt chain", Icon: Link2 },
];
import React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home, LayoutDashboard, Copy, Code2, Briefcase, Users, Boxes, Gauge,
  Sprout, Cpu, ChevronDown, LogOut, Wand2, Sparkles, Search, ListChecks, Layers, ShieldCheck,
  Moon, Sun, CalendarClock, Palette
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import useTheme from "@/hooks/useTheme";

const BRAND_LOGO = "https://media.base44.com/images/public/6ad5e96eb2cfcf9aafe9f1df/eda871bc3_logo.png";

// Thin vertical rail: the always-visible spine of the system.
const RAIL = [
  { to: "/", label: "Workspace", Icon: Home, end: true },
  { to: "/clone-ingest", label: "Clone & Ingest", Icon: Copy },
  { to: "/visual-editor", label: "Visual Editor", Icon: Code2 },
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/job-board", label: "Job Board", Icon: Briefcase },
  { to: "/agent-activity", label: "Agent Activity", Icon: Users },
  { to: "/factory", label: "Website Factory", Icon: Boxes },
  { to: "/benchmarks", label: "Benchmarks", Icon: Gauge },
  { to: "/seo-simulator", label: "Growth Simulator", Icon: Sprout },
  { to: "/system-control", label: "System Control", Icon: Cpu },
];

const TOP_LINKS = [
  { to: "/", label: "Workspace", end: true },
  { to: "/clone-ingest", label: "Clone & Ingest" },
  { to: "/visual-editor", label: "Visual Editor" },
  { to: "/prompt-system", label: "Prompt System" },
];

const TOP_GROUPS = [
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
      { to: "/system-capabilities", label: "Capabilities", Icon: Layers },
      { to: "/system-benchmarks", label: "System Benchmarks", Icon: Gauge },
      { to: "/system-audit", label: "System Audit", Icon: ShieldCheck },
      { to: "/system-control", label: "System Control", Icon: Cpu },
      { to: "/benchmarks", label: "Benchmark Library", Icon: Gauge },
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

export default function AppShell() {
  const { pathname } = useLocation();
  const { isDark, toggle } = useTheme();

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="h-14 px-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={BRAND_LOGO} alt="" className="h-7 w-7 rounded-md object-contain" />
            <span className="font-heading font-semibold tracking-tight hidden sm:inline">Visual X</span>
          </Link>

          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {TOP_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "px-2.5 py-1.5 rounded-md border border-transparent text-sm whitespace-nowrap electric-hover",
                    isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            {TOP_GROUPS.map((g) => (
              <DropdownMenu key={g.label}>
                <DropdownMenuTrigger className="px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition flex items-center gap-1 whitespace-nowrap">
                  {g.label} <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {g.items.map((it) => (
                    <DropdownMenuItem key={it.to} asChild>
                      <Link to={it.to} className={cn("flex items-center gap-2 cursor-pointer", pathname === it.to && "font-medium")}>
                        <it.Icon className="w-4 h-4" /> {it.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden md:inline">Autonomy console</span>
            <button
              onClick={toggle}
              className="p-2 rounded-md border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted electric-hover"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => base44.auth.logout(window.location.origin)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-14 shrink-0 border-r border-border bg-card flex flex-col items-center py-2 gap-1 overflow-y-auto">
          {RAIL.map(({ to, label, Icon, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={label}
                aria-label={label}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border border-transparent electric-hover",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
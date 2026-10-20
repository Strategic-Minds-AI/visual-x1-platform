import React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import {
  X1_EMBLEM, X1_WORDMARK,
  WORKSPACE_RAIL as RAIL,
  WORKSPACE_TOP_LINKS as TOP_LINKS,
  WORKSPACE_TOP_GROUPS as TOP_GROUPS,
} from "@/data/workspaceNav";

export default function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="shrink-0 bg-card/60 backdrop-blur-xl">
        <div className="h-16 px-3 sm:px-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={X1_EMBLEM} alt="Strategic Minds AI" className="h-8 w-8 object-contain x1-emblem-glow" />
            <span className="hidden xl:flex flex-col leading-none gap-1.5">
              <img src={X1_WORDMARK} alt="Strategic Minds AI" className="h-3.5 w-auto object-contain self-start" />
              <span className="flex items-center gap-2">
                <span className="x1-rule w-5" />
                <span className="x1-track text-[8px] text-muted-foreground whitespace-nowrap">Intelligence in motion</span>
              </span>
            </span>
          </Link>

          <nav className="x1-glass x1-pill flex items-center gap-0.5 px-1.5 py-1 overflow-x-auto">
            {TOP_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "x1-pill x1-track px-3 py-1.5 text-[10px] font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "x1-nav-active text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            {TOP_GROUPS.map((g) => (
              <DropdownMenu key={g.label}>
                <DropdownMenuTrigger className="x1-pill x1-track px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition flex items-center gap-1 whitespace-nowrap">
                  {g.label} <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
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
            <button
              onClick={() => base44.auth.logout(window.location.origin)}
              className="x1-glass x1-pill p-2 text-muted-foreground hover:text-foreground electric-hover"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-14 shrink-0 bg-card/40 backdrop-blur-xl flex flex-col items-center py-2 gap-1 overflow-y-auto">
          {RAIL.map(({ to, label, Icon, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={label}
                aria-label={label}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border border-transparent transition-colors electric-hover",
                  active ? "x1-active-glow" : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
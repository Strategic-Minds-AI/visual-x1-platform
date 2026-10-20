import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { X1_EMBLEM, X1_WORDMARK, WORKSPACE_TOP_LINKS, WORKSPACE_TOP_GROUPS } from "@/data/workspaceNav";

/** The Visual Editor's own horizontal top navigation bar, in X1's chrome. */
export default function EditorTopBar() {
  const { pathname } = useLocation();

  return (
    <header className="shrink-0 bg-card/60 backdrop-blur-xl">
      <div className="h-16 px-3 sm:px-4 flex items-center gap-3">
        <Link to="/workspace" className="flex items-center gap-2.5 shrink-0">
          <img src={X1_EMBLEM} alt="Strategic Minds AI" className="h-8 w-8 object-contain x1-emblem-glow" />
          <span className="hidden xl:flex flex-col leading-none gap-1.5">
            <img src={X1_WORDMARK} alt="Strategic Minds AI" className="h-3.5 w-auto object-contain self-start" />
            <span className="flex items-center gap-2">
              <span className="x1-rule w-5" />
              <span className="x1-track text-[8px] text-muted-foreground whitespace-nowrap">Intelligence in motion</span>
            </span>
          </span>
        </Link>

        <nav aria-label="Workspace" className="x1-glass x1-pill flex items-center gap-0.5 px-1.5 py-1 overflow-x-auto">
          {WORKSPACE_TOP_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "x1-pill x1-track px-3 py-1.5 text-[10px] font-medium whitespace-nowrap transition-colors",
                  isActive ? "x1-nav-active text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {WORKSPACE_TOP_GROUPS.map((g) => (
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
          <span className="x1-glass x1-pill hidden md:flex items-center gap-2 px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
            <span className="x1-track text-[9px] text-muted-foreground">Visual Editor</span>
          </span>
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
  );
}
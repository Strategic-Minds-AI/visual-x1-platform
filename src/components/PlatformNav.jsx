import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/onboarding", label: "Onboarding" },
  { to: "/discovery", label: "Discovery" },
  { to: "/workflow-map", label: "Workflow" },
  { to: "/system-capabilities", label: "Capabilities" },
  { to: "/system-benchmarks", label: "Benchmarks" },
  { to: "/system-audit", label: "System Audit" },
  { to: "/seo-simulator", label: "Simulator" },
];

// Shared strip so every stage of the client workflow is one click away.
export default function PlatformNav() {
  const { pathname } = useLocation();
  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1 overflow-x-auto">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-md hover:bg-muted whitespace-nowrap"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <span className="text-muted-foreground/40">|</span>
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={cn(
              "text-xs px-2 py-1 rounded-md whitespace-nowrap transition",
              pathname === l.to
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
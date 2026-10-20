import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const X1_EMBLEM = "https://www.strategicmindsai.com/v2-assets/silver-emblem.png";

// The frame Visual X presents while it is mounted as a page inside the X1 admin.
// It carries X1's lockup, and it is deliberately chrome-free: X1 already owns the
// outer shell, so this adds only the module header and its surface switcher.
export default function X1ModuleShell({ surfaces, active, onSelect, hostContext, children }) {
  const tenant = hostContext?.tenant_name || hostContext?.tenant_id || "";
  const operator = hostContext?.operator_name || hostContext?.operator_email || "";

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="h-12 px-3 flex items-center gap-3">
          <img src={X1_EMBLEM} alt="Strategic Minds AI" className="h-6 w-6 object-contain" />
          <span className="flex flex-col leading-none">
            <span className="font-heading font-semibold tracking-[0.16em] text-[10px]">VISUAL X</span>
            <span className="text-[9px] tracking-[0.28em] text-muted-foreground mt-0.5">X1 ADMIN MODULE</span>
          </span>
          {tenant ? (
            <Badge variant="outline" className="text-[10px]">
              Tenant {tenant}
            </Badge>
          ) : null}
          {operator ? (
            <span className="ml-auto text-xs text-muted-foreground truncate">{operator}</span>
          ) : null}
        </div>

        <div className="px-2 pb-2 flex items-center gap-1 overflow-x-auto">
          {surfaces.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-transparent text-sm whitespace-nowrap electric-hover",
                active === id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
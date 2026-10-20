import React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle } from "lucide-react";

// Phase rail: where the project is, and how much of each phase is done.
export default function PhaseRail({ phases, activePhase, onSelect }) {
  return (
    <div className="space-y-1">
      {phases.map((p) => {
        const pct = p.total ? Math.round((p.approved / p.total) * 100) : 0;
        return (
          <button
            key={p.name}
            type="button"
            onClick={() => onSelect(p.name)}
            className={cn(
              "w-full text-left rounded-lg border px-3 py-2.5 transition",
              activePhase === p.name ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium leading-snug">{p.name}</span>
              {p.gatesPending > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              {p.gatesPending === 0 && p.approved === p.total && p.total > 0 && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {p.approved}/{p.total} done{p.gatesPending ? ` · ${p.gatesPending} gate(s) waiting` : ""}
            </p>
          </button>
        );
      })}
    </div>
  );
}
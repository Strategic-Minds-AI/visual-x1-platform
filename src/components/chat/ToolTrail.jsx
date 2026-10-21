import React, { useState } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";

// What the orchestrator actually ran, in order. This is a report of calls, not a
// summary: a step that failed shows as failed, and its observation is the text the
// tool returned.
export default function ToolTrail({ trail }) {
  const [open, setOpen] = useState(false);
  if (!trail || !trail.length) return null;

  const failed = trail.filter((t) => !t.ok).length;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {trail.length} step{trail.length === 1 ? "" : "s"} run
        {failed > 0 && <span className="text-destructive">· {failed} failed</span>}
      </button>
      {open && (
        <ol className="mt-2 space-y-1.5 border-l border-border/60 pl-3">
          {trail.map((step, index) => (
            <li key={index} className="text-[11px] leading-relaxed">
              <span className="flex items-center gap-1.5">
                {step.ok ? <Check size={11} className="text-primary" /> : <X size={11} className="text-destructive" />}
                <span className="font-mono">{step.tool}</span>
              </span>
              <span className="block text-muted-foreground">{step.observation}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
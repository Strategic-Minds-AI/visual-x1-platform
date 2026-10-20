import React from "react";
import { SIMULATION_MODES } from "@/data/simulationModes";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// Mode ladder for the simulator. Each mode states what it changes, so a heavier setting is
// never read as a stronger promise.
export default function ModeSelector({ modeId, onChange, disabled }) {
  const active = SIMULATION_MODES.find((m) => m.id === modeId);
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-heading text-sm font-semibold">Simulation mode</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Higher modes widen the modeled band and run more scenarios. They never change the inputs you entered.
        </p>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SIMULATION_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={cn(
              "text-left rounded-lg border px-3 py-2 transition",
              modeId === m.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/40",
              disabled && "opacity-60"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{m.name}</span>
              {modeId === m.id && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.tagline}</p>
          </button>
        ))}
      </div>
      {active && (
        <div className="px-4 pb-4 space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">What this mode adds</p>
          <ul className="space-y-1">
            {active.adds.map((a) => (
              <li key={a} className="text-xs text-foreground flex gap-2">
                <span className="text-primary">+</span> {a}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground pt-1">{active.reasoning_depth}</p>
        </div>
      )}
    </div>
  );
}
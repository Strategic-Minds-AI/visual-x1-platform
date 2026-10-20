import React from "react";
import { Check, Lock } from "lucide-react";

const PHASES = [
  { id: 1, label: "Idea", short: "One sentence" },
  { id: 2, label: "Pattern", short: "Select archetype" },
  { id: 3, label: "Refine", short: "Compile prompt + spec" },
  { id: 4, label: "Simulate", short: "Test + risk analysis" },
  { id: 5, label: "Visual", short: "Design + preview" },
  { id: 6, label: "Generate", short: "App source code" },
  { id: 7, label: "Test", short: "Builds + automated tests" },
  { id: 8, label: "Validate", short: "Independent review" },
  { id: 9, label: "Deploy", short: "Preview + approved deploy" },
  { id: 10, label: "Operate", short: "Monitor live system" },
  { id: 11, label: "Improve", short: "Feedback loop" }
];

export default function PhaseStepper({ currentPhase, maxReachedPhase, onPhaseClick }) {
  return (
    <div className="w-56 shrink-0 border-r border-border bg-card p-4 space-y-1 overflow-y-auto">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pipeline Phases</div>
      {PHASES.map(phase => {
        const isComplete = phase.id < currentPhase;
        const isCurrent = phase.id === currentPhase;
        const isLocked = phase.id > maxReachedPhase;
        const isFuture = phase.id > currentPhase && !isLocked;
        return (
          <button
            key={phase.id}
            onClick={() => !isLocked && onPhaseClick(phase.id)}
            disabled={isLocked}
            className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition ${
              isCurrent ? "bg-primary text-primary-foreground" :
              isComplete ? "bg-accent hover:bg-accent/80" :
              isFuture ? "hover:bg-accent/50" :
              "opacity-50 cursor-not-allowed"
            }`}
          >
            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
              isComplete ? "bg-primary text-primary-foreground" :
              isCurrent ? "bg-primary-foreground text-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {isComplete ? <Check className="w-3 h-3" /> : isLocked ? <Lock className="w-2.5 h-2.5" /> : phase.id}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium leading-tight">{phase.label}</div>
              <div className={`text-xs leading-tight mt-0.5 ${isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {phase.short}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
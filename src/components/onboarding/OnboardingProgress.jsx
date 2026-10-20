import React from "react";
import { cn } from "@/lib/utils";

// One question per screen, with the rail showing how far in the client is.
export default function OnboardingProgress({ steps, currentIndex, onJump }) {
  const pct = Math.round(((currentIndex + 1) / steps.length) * 100);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step {currentIndex + 1} of {steps.length}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ol className="hidden lg:block space-y-1">
        {steps.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => i <= currentIndex && onJump(i)}
              disabled={i > currentIndex}
              className={cn(
                "w-full text-left text-xs px-2 py-1.5 rounded-md transition flex items-center gap-2",
                i === currentIndex
                  ? "bg-primary/10 text-foreground font-medium"
                  : i < currentIndex
                    ? "text-muted-foreground hover:bg-muted"
                    : "text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0",
                  i < currentIndex ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {i + 1}
              </span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
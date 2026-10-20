import React from "react";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

// Dimension score against the benchmark bar, with the gap and the suggested move.
export default function AuditScoreTable({ dimensions }) {
  if (!dimensions?.length) return null;
  return (
    <div className="space-y-2">
      {dimensions.map((d) => {
        const met = d.gap <= 0;
        return (
          <div key={d.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs font-medium">{d.label}</p>
                {d.confidence != null && (
                  <p className="text-[10px] text-muted-foreground">rubric confidence {Math.round(d.confidence * 100)}%</p>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold">{d.score}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" /> {d.benchmark_ceiling}
                </span>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full", met ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200")}>
                  {met ? "at bar" : `gap ${d.gap}`}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={met ? "h-full bg-emerald-500" : "h-full bg-amber-500"} style={{ width: `${d.score}%` }} />
            </div>
            {d.suggestion && (
              <p className="text-[11px] text-muted-foreground mt-2">
                <span className="uppercase tracking-wide">Suggested move:</span> {d.suggestion}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
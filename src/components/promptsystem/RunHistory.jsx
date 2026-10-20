import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE = {
  PASS: "bg-emerald-600 text-white",
  "AWAITING REVIEW": "bg-amber-600 text-white",
  "REPAIR REQUIRED": "bg-orange-600 text-white",
  BLOCKED: "bg-rose-600 text-white",
};

export default function RunHistory({ runs = [], onSelect, activeId }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Recent runs</CardTitle></CardHeader>
      <CardContent className="space-y-1.5">
        {runs.length === 0 && <p className="text-xs text-muted-foreground">No chain run yet. Start one above.</p>}
        {runs.map((run) => (
          <button
            key={run.id}
            onClick={() => onSelect(run)}
            className={cn(
              "w-full text-left border rounded-lg px-2.5 py-2 transition hover:bg-muted/50",
              activeId === run.id ? "border-primary" : "border-border"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground">{run.mission_id}</span>
              <Badge className={cn("text-[10px] ml-auto", TONE[run.decision] || "bg-muted text-muted-foreground")}>
                {run.decision || run.status}
              </Badge>
            </div>
            <p className="text-xs mt-0.5 line-clamp-2">{run.request}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {run.status} · {run.completed_count}/{run.stage_count} stages · {run.repair_cycles_used || 0} repair cycle(s)
            </p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
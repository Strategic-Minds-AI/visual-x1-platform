import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GATE_STYLES = {
  passed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  not_run: "bg-slate-100 text-slate-600 border-slate-200"
};

export default function CloneList({ projects, selectedId, onSelect }) {
  if (!projects.length) {
    return <p className="text-sm text-muted-foreground">No clone projects yet. Capture a source to start one.</p>;
  }
  return (
    <div className="space-y-2">
      {projects.map((p) => (
        <Card
          key={p.id}
          onClick={() => onSelect(p)}
          className={cn("cursor-pointer transition hover:border-primary/50", selectedId === p.id && "ring-2 ring-primary")}
        >
          <CardContent className="py-3 px-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.source_url || p.source_label || p.source_type}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{p.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge className={cn("text-xs border", GATE_STYLES[p.operational_gate] || GATE_STYLES.pending)} variant="outline">
                operational {p.operational_gate}
              </Badge>
              <Badge className={cn("text-xs border", GATE_STYLES[p.visual_gate] || GATE_STYLES.pending)} variant="outline">
                visual {p.visual_gate}
              </Badge>
              {p.human_approved ? <Badge className="text-xs border bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">accepted</Badge> : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
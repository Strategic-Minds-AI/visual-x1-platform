import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GATE_STYLES = {
  passed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  failed: "bg-rose-500/15 text-rose-400 border-rose-500/40",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  not_run: "bg-muted/40 text-muted-foreground border-border"
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
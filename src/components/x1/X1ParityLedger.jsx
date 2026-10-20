import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, Server, ShieldAlert, ListChecks } from "lucide-react";
import { X1_EXPERIENCES, X1_API_PLANE, X1_BLOCKERS, PARITY_LABELS } from "@/data/x1Surfaces";
import { cn } from "@/lib/utils";

const TONE = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
  blocked: "border-amber-200 bg-amber-50 text-amber-700"
};

export default function X1ParityLedger() {
  const readCount = X1_API_PLANE.filter((r) => r.read).length;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" /> X1 experiences
            <Badge variant="outline" className="text-xs border ml-auto">{X1_EXPERIENCES.length} in the X1 front end</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {X1_EXPERIENCES.map((x) => (
            <div key={x.name} className="rounded-lg border border-border p-2.5 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{x.name}</span>
                <Badge variant="outline" className={cn("text-[10px] border ml-auto", TONE[x.parity])}>{PARITY_LABELS[x.parity]}</Badge>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">{x.routes}</p>
              <p className="text-xs text-muted-foreground">{x.what}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4" /> X1 API plane
            <Badge variant="outline" className="text-xs border ml-auto">{readCount} of {X1_API_PLANE.length} readable from here</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {X1_API_PLANE.map((r) => (
            <div key={r.name} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-2.5 py-2">
              <span className="text-xs font-medium">{r.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{r.path}</span>
              <Badge variant="outline" className={cn("text-[10px] border ml-auto", r.read ? TONE.live : TONE.pending)}>
                {r.read ? "Bridged" : "Not bridged"}
              </Badge>
              <p className="text-xs text-muted-foreground w-full">{r.note} — <span className="opacity-80">{r.answer}</span></p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> What decides the merge
            <Badge variant="outline" className="text-xs border ml-auto">{X1_BLOCKERS.length} measured constraints</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {X1_BLOCKERS.map((b) => (
            <div key={b.id} className="rounded-lg border border-border p-2.5 space-y-1">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" /> {b.title}
              </p>
              <p className="text-xs text-muted-foreground"><span className="font-medium">Evidence:</span> {b.evidence}</p>
              <p className="text-xs"><span className="font-medium">So:</span> {b.consequence}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
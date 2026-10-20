import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Route, Server, ShieldAlert, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { X1_SOURCE, X1_ROUTES, X1_BACKEND_INTERFACES, X1_LIMITS } from "@/data/x1SourceMap";

const TONE = {
  native: "bg-primary/15 text-primary",
  module: "bg-chart-3/15 text-chart-3",
  deferred: "bg-chart-4/20 text-muted-foreground",
};

export default function X1CloneLedger() {
  const [evidence, setEvidence] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [projects, runs, receipts] = await Promise.all([
        base44.entities.CloneProject.count(),
        base44.entities.ChainRun.count(),
        base44.entities.ValidationReceipt.count(),
      ]);
      if (alive) setEvidence({ projects, runs, receipts });
    })();
    return () => { alive = false; };
  }, []);

  const counts = X1_ROUTES.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});
  const bridged = X1_BACKEND_INTERFACES.filter((i) => i.reachable === true).length;
  const blocked = X1_BACKEND_INTERFACES.filter((i) => i.reachable === false).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">X1 clone parity ledger</h1>
        <p className="text-sm text-muted-foreground">
          Every row is taken from the X1 repository at its pinned commit. Statuses record what is actually running here.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> Source
            <Badge variant="outline" className="ml-auto font-mono text-[10px]">{X1_SOURCE.pinned_commit.slice(0, 12)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-xs sm:grid-cols-2">
          <p><span className="text-muted-foreground">Repository:</span> {X1_SOURCE.repo}</p>
          <p><span className="text-muted-foreground">App root:</span> {X1_SOURCE.app_root}</p>
          <p><span className="text-muted-foreground">Files ingested:</span> {X1_SOURCE.app_files} application files ({X1_SOURCE.app_source_files} source)</p>
          <p><span className="text-muted-foreground">Production:</span> {X1_SOURCE.production_url}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">Breakdown:</span> {X1_SOURCE.source_breakdown}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">Stack:</span> {X1_SOURCE.stack}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="w-4 h-4" /> Route parity
            <Badge variant="outline" className="ml-auto text-[10px]">
              {counts.native || 0} native · {counts.module || 0} module · {counts.deferred || 0} deferred
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {X1_ROUTES.map((r) => (
            <div key={r.route + r.local} className="rounded-xl bg-popover/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium font-mono">{r.route}</span>
                <Badge className={cn("text-[10px] ml-auto", TONE[r.status])}>{r.status}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{r.source} → {r.local}</p>
              <p className="text-xs mt-1">{r.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4" /> X1 backend interfaces
            <Badge variant="outline" className="ml-auto text-[10px]">{bridged} reachable · {blocked} blocked</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {X1_BACKEND_INTERFACES.map((i) => (
            <div key={i.interface} className="rounded-xl bg-popover/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono">{i.interface}</span>
                <Badge className={cn("text-[10px] ml-auto", i.reachable === true ? TONE.native : i.reachable === null ? TONE.module : TONE.deferred)}>
                  {i.reachable === true ? "reachable" : i.reachable === null ? "read-only" : "blocked"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{i.purpose} — {i.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Measured limits
            <Badge variant="outline" className="ml-auto text-[10px]">{X1_LIMITS.length} open</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {X1_LIMITS.map((b) => (
            <div key={b.id} className="rounded-xl bg-popover/40 p-3">
              <p className="text-sm font-medium">{b.title}</p>
              <p className="text-xs text-muted-foreground mt-1">Evidence: {b.evidence}</p>
              <p className="text-xs mt-1">Effect: {b.consequence}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Runtime evidence</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-xs sm:grid-cols-3">
          <p><span className="text-muted-foreground">Clone projects:</span> {evidence ? evidence.projects : "…"}</p>
          <p><span className="text-muted-foreground">Chain runs:</span> {evidence ? evidence.runs : "…"}</p>
          <p><span className="text-muted-foreground">Validation receipts:</span> {evidence ? evidence.receipts : "…"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
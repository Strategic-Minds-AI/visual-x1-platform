import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

const parse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value || "");
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const DECISION_TONE = {
  PASS: "bg-emerald-600 text-white",
  "AWAITING REVIEW": "bg-amber-600 text-white",
  "REPAIR REQUIRED": "bg-orange-600 text-white",
  BLOCKED: "bg-rose-600 text-white",
  "NOT RUN": "bg-muted text-muted-foreground",
};

const GATE_TONE = { pass: "text-emerald-600", fail: "text-rose-600", not_run: "text-amber-600", unknown: "text-muted-foreground" };

// Reads the run's stored evidence rather than a live response, so a historical
// run shows exactly the same decision, gates and limitations it was recorded with.
export default function DecisionPanel({ run }) {
  if (!run) return null;
  const scorecard = parse(run.scorecard_json, null);
  const validation = parse(run.validation_json, null);
  const blockers = parse(run.blockers_json, []);
  const repairs = parse(run.repairs_json, []);
  const limitations = parse(run.limitations_json, []);

  const decision = run.decision || "NOT RUN";
  const total = scorecard?.total;
  const findings = validation?.findings || [];
  const critical = findings.filter((f) => String(f.severity).toLowerCase() === "critical");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Release review</CardTitle>
          <Badge className={cn("text-xs", DECISION_TONE[decision] || DECISION_TONE["NOT RUN"])}>{decision}</Badge>
        </div>
        {run.decision_reason && <p className="text-xs text-muted-foreground">{run.decision_reason}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {typeof total === "number" && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">Weighted scorecard</span>
              <span className="font-mono">{total}/100 · threshold {scorecard.threshold}</span>
            </div>
            <Progress value={total} className="h-2" />
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-3">
              {(scorecard.rows || []).map((row) => (
                <div key={row.key} className="flex items-start gap-2 text-xs">
                  <span className="font-mono shrink-0 w-12 text-right">{row.score}/{row.max}</span>
                  <span className="min-w-0">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground"> — {row.evidence}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(scorecard?.gates || []).length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1.5">Hard gates</p>
            <div className="space-y-1">
              {scorecard.gates.map((gate) => (
                <div key={gate.id} className="flex items-start gap-2 text-xs">
                  <span className={cn("font-mono font-semibold shrink-0 w-16", GATE_TONE[gate.status])}>{(gate.status || "unknown").replace("_", " ").toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="font-medium">{gate.label}</span>
                    {gate.release_only ? <span className="text-muted-foreground"> (release evidence)</span> : null}
                    <span className="text-muted-foreground"> — {gate.reason}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {findings.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1.5">Validator findings ({findings.length}, {critical.length} critical)</p>
            <div className="space-y-1.5">
              {findings.map((f, i) => (
                <div key={i} className="border border-border rounded-md px-2.5 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={String(f.severity).toLowerCase() === "critical" ? "destructive" : "secondary"} className="text-[10px] uppercase">{f.severity}</Badge>
                    {f.location && <span className="text-muted-foreground font-mono">{f.location}</span>}
                  </div>
                  <p className="mt-1">{f.problem}</p>
                  {f.likely_cause && <p className="text-muted-foreground mt-0.5">Cause: {f.likely_cause}</p>}
                  {f.smallest_fix && <p className="text-muted-foreground mt-0.5">Smallest fix: {f.smallest_fix}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {repairs.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1.5">Repair history (bounded to {run.max_repair_cycles} cycles)</p>
            <div className="space-y-1">
              {repairs.map((cycle) => (
                <div key={cycle.cycle} className="text-xs border border-border rounded-md px-2.5 py-2">
                  <span className="font-medium">Cycle {cycle.cycle}</span> · {cycle.tasks?.length || 0} task(s) ·{" "}
                  {cycle.applied ? `re-rendered, score ${cycle.prior_total} → ${cycle.total}` : "not applied"}
                  {cycle.regression && <span className="text-muted-foreground"> · {cycle.regression}</span>}
                  {cycle.blocked_reason && <p className="text-rose-600 mt-0.5">Stopped: {cycle.blocked_reason}</p>}
                  {cycle.rollback_note && <p className="text-muted-foreground mt-0.5">Rollback: {cycle.rollback_note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {blockers.length > 0 && (
          <div className="border border-amber-500/30 bg-amber-500/10 rounded-md p-2.5">
            <p className="text-xs font-semibold mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> What still stops release</p>
            {blockers.map((b, i) => (
              <p key={i} className="text-xs text-amber-900">
                <span className="font-medium">{b.label}:</span> {b.blocker}{b.needs ? ` (needs ${b.needs})` : ""}
              </p>
            ))}
          </div>
        )}

        {limitations.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1">Known limitations</p>
            {limitations.map((l, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {l}</p>
            ))}
          </div>
        )}

        <div className="text-[11px] text-muted-foreground font-mono">
          {run.mission_id} · receipt {run.receipt_id || "not written"} · revision {run.revision}
        </div>
      </CardContent>
    </Card>
  );
}
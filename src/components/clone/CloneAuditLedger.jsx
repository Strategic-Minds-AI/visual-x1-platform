import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

const GATE_STYLES = {
  passed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  failed: "bg-rose-500/15 text-rose-400 border-rose-500/40",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  not_run: "bg-slate-500/15 text-slate-400 border-slate-500/40"
};

export default function CloneAuditLedger({ refreshKey }) {
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("auditClonePortfolio", {});
      const data = res.data || {};
      if (data.error) setError(data.error);
      else setReport(data);
    } catch (e) {
      setError(e?.response?.data?.error || "The audit could not run.");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const summary = report?.summary;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Validation audit
          </CardTitle>
          <Button size="sm" variant="outline" onClick={run} disabled={running}>
            {running ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
            Re-run audit
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {report?.agent ? `${report.agent.name} — ${report.agent.specialization || report.agent.role}` : "Clone Validation Auditor"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="flex items-start gap-1.5 text-xs text-rose-500">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </p>
        )}

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Clones</p>
              <p className="text-lg font-semibold">{summary.total}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">At 100%</p>
              <p className="text-lg font-semibold text-emerald-400">{summary.compliant}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Missing visual proof</p>
              <p className="text-lg font-semibold text-amber-400">{summary.missing_visual_evidence}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Awaiting sign-off</p>
              <p className="text-lg font-semibold">{summary.awaiting_sign_off}</p>
            </div>
          </div>
        )}

        {report?.rows?.length ? (
          <div className="space-y-2">
            {report.rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{row.name}</p>
                  <Badge variant="outline" className="text-xs">{row.source_type}</Badge>
                  <Badge variant="outline" className={cn("text-xs border", GATE_STYLES[row.operational_gate] || GATE_STYLES.pending)}>
                    operational {row.passed_checks}/{row.required_checks || 0}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs border", GATE_STYLES[row.visual_gate] || GATE_STYLES.not_run)}>
                    visual {row.visual_gate}
                  </Badge>
                  {row.compliant ? (
                    <Badge variant="outline" className="text-xs border bg-emerald-500/15 text-emerald-400 border-emerald-500/40">compliant</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border bg-amber-500/15 text-amber-400 border-amber-500/40">not compliant</Badge>
                  )}
                </div>
                {row.blockers?.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                    {row.blockers.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          !running && <p className="text-sm text-muted-foreground">No clone projects to audit yet.</p>
        )}

        {report?.method && <p className="text-xs text-muted-foreground">{report.method}</p>}
      </CardContent>
    </Card>
  );
}
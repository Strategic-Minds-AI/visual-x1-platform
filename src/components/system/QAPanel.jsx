import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardCheck, Loader2, AlertCircle, Check, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function QAPanel() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runAudit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("qaAudit", {});
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || "Audit failed.");
    } finally {
      setLoading(false);
    }
  };

  const score = result?.qa?.quality_score || 0;
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  const healthVariant = result?.qa?.health_status === 'healthy' ? 'default' : result?.qa?.health_status === 'degraded' ? 'secondary' : 'destructive';

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">QA Agent</h3>
            <p className="text-xs text-muted-foreground">Quality enforcement, gap analysis, system improvement</p>
          </div>
        </div>
        <Button size="sm" onClick={runAudit} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />}
          Run QA Audit
        </Button>
      </div>

      {error && (
        <div className="text-sm text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${scoreColor}`}>{score}<span className="text-lg text-muted-foreground">/100</span></div>
            <Badge variant={healthVariant}>{result.qa.health_status || 'unknown'}</Badge>
          </div>

          {result.qa.summary && (
            <p className="text-sm text-muted-foreground">{result.qa.summary}</p>
          )}

          {result.qa.critical_gaps?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-rose-600 mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Critical Gaps
              </div>
              <div className="space-y-1">
                {result.qa.critical_gaps.map((g, i) => (
                  <div key={i} className="text-sm text-rose-600 flex items-start gap-2 pl-4">
                    <span>•</span> {g}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.qa.improvements?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-violet-600 mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Improvements
              </div>
              <div className="space-y-1">
                {result.qa.improvements.map((imp, i) => (
                  <div key={i} className="text-sm text-muted-foreground flex items-start gap-2 pl-4">
                    <span>•</span> {imp}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.improvements_created > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-2">
              <Check className="w-4 h-4" /> {result.improvements_created} improvement tasks created
            </div>
          )}

          {result.system_state && (
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
              {Object.entries(result.system_state.counts).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-lg font-semibold">{val}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
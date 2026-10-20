import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Loader2, AlertCircle, Check, Wrench, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GuardianPanel() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoFix, setAutoFix] = useState(true);
  const [error, setError] = useState("");

  const runAudit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("securityAudit", { auto_fix: autoFix });
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || "Audit failed.");
    } finally {
      setLoading(false);
    }
  };

  const score = result?.audit?.security_score || 0;
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">Guardian Agent</h3>
            <p className="text-xs text-muted-foreground">Security audit, secret management, auto-fix</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={autoFix} onChange={e => setAutoFix(e.target.checked)} className="rounded" />
            Auto-fix
          </label>
          <Button size="sm" onClick={runAudit} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Shield className="w-3.5 h-3.5 mr-1.5" />}
            Run Audit
          </Button>
        </div>
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
            <Badge variant={score >= 80 ? "default" : "destructive"}>{result.audit.summary?.slice(0, 60) || 'Audit complete'}</Badge>
          </div>

          {result.audit.critical_findings?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-rose-600 mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Critical Findings
              </div>
              <div className="space-y-1">
                {result.audit.critical_findings.map((f, i) => (
                  <div key={i} className="text-sm text-rose-600 flex items-start gap-2 pl-4">
                    <span>•</span> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.audit.recommended_fixes?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Recommended Fixes
              </div>
              <div className="space-y-1">
                {result.audit.recommended_fixes.map((f, i) => (
                  <div key={i} className="text-sm text-muted-foreground flex items-start gap-2 pl-4">
                    <span>•</span> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.auto_fix_enabled && result.fixes_created > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-2">
              <Check className="w-4 h-4" /> {result.fixes_created} fix tasks created automatically
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Lock className="w-3.5 h-3.5" /> Secrets managed securely via platform vault — never exposed in code or logs.
          </div>
        </div>
      )}
    </div>
  );
}
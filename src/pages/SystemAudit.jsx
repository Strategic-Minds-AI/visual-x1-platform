import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlatformNav from "@/components/PlatformNav";
import AuditScoreTable from "@/components/system/AuditScoreTable";
import { SYSTEM_CAPABILITIES } from "@/data/systemCapabilities";
import { Gauge, Loader2, AlertCircle, ShieldCheck, RefreshCw, ChevronRight } from "lucide-react";

// The QA and validation pass on ourselves: score every capability against the benchmark bar,
// return the gaps, and always hand back a suggested move for each one.
export default function SystemAudit() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [audit, setAudit] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    const { items } = await base44.entities.SystemAuditRun.filter({}, { sort: "-created_date", limit: 10 });
    setHistory(items || []);
    return items || [];
  };

  useEffect(() => {
    (async () => {
      try {
        const [{ items }] = await Promise.all([
          base44.entities.SystemBenchmark.filter({ is_active: true }, { sort: "display_order", limit: 100 }),
          loadHistory(),
        ]);
        setBenchmarks(items || []);
      } catch (e) {
        setError(e.message || "The audit page could not load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("auditSystem", {
        scope: "Visual X capability set vs benchmark systems",
        capabilities: SYSTEM_CAPABILITIES.map((c) => ({
          id: c.id, name: c.name, domain: c.domain, what_it_does: c.what_it_does,
          automation_level: c.automation_level, maturity: c.maturity, evidence: c.evidence,
        })),
        benchmarks: benchmarks.map((b) => ({
          name: b.name, category: b.category, what_it_does: b.what_it_does,
          evidence_total: b.evidence_total, evidence_max: b.evidence_max,
          our_parity: b.our_parity, gap_note: b.gap_note,
        })),
      });
      if (res.data?.error) setError(res.data.error);
      else {
        setAudit(res.data);
        await loadHistory();
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "The audit did not run.");
    } finally {
      setRunning(false);
    }
  };

  const showStored = (run) => {
    try {
      setAudit({
        run_id: run.id,
        overall_score: run.overall_score,
        benchmark_ceiling: run.benchmark_ceiling,
        dimensions: JSON.parse(run.dimension_scores_json || "[]"),
        gaps: JSON.parse(run.gaps_json || "[]"),
        suggestions: JSON.parse(run.suggestions_json || "[]"),
        verdict: run.verdict,
        confidence: run.confidence,
        scoring_note: run.notes,
        stored: run.run_name,
      });
    } catch {
      setError("That stored run could not be read back.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PlatformNav />
        <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <header className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> System audit and validation
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                An independent scoring pass over {SYSTEM_CAPABILITIES.length} capabilities against {benchmarks.length} benchmark systems.
                Every dimension comes back with its gap and a suggested move, and a capability only scores above level 2 when the evidence shows it running on real work.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/system-capabilities"><Button size="sm" variant="outline">Capabilities</Button></Link>
              <Button size="sm" onClick={run} disabled={running}>
                {running ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Gauge className="w-4 h-4 mr-1.5" />}
                {running ? "Auditing..." : "Run audit"}
              </Button>
            </div>
          </div>
        </header>

        {audit ? (
          <>
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {audit.stored ? `Stored run · ${audit.stored}` : "Latest run"}
                  </p>
                  <div className="flex items-end gap-3 mt-1">
                    <span className="text-3xl font-semibold">{audit.overall_score}</span>
                    <span className="text-sm text-muted-foreground mb-1">/ {audit.benchmark_ceiling} benchmark bar</span>
                  </div>
                  <p className="text-xs mt-2 max-w-2xl">{audit.verdict}</p>
                </div>
                <div className="text-right">
                  <Badge variant={audit.overall_score >= audit.benchmark_ceiling ? "default" : "secondary"} className="text-[11px]">
                    {audit.overall_score >= audit.benchmark_ceiling ? "at the bar" : `${audit.benchmark_ceiling - audit.overall_score} points to go`}
                  </Badge>
                  {audit.confidence != null && (
                    <p className="text-[11px] text-muted-foreground mt-1">confidence {Math.round(audit.confidence * 100)}%</p>
                  )}
                </div>
              </div>
              {audit.gaps?.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-300">Gaps found, biggest first</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {audit.gaps.map((g) => (
                      <li key={g.dimension} className="text-xs text-amber-800 dark:text-amber-200">
                        {g.dimension}: {g.score} vs {g.benchmark} (gap {g.gap})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card">
              <div className="px-5 py-3.5 border-b border-border">
                <h2 className="font-heading text-sm font-semibold">Dimension scores</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Each dimension scored 0-5 on the rubric and mapped to 0-100, against a declared benchmark bar.
                </p>
              </div>
              <div className="p-5">
                <AuditScoreTable dimensions={audit.dimensions} />
              </div>
              {audit.suggestions?.length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Auto-suggested actions</p>
                  <div className="mt-2 space-y-1.5">
                    {audit.suggestions.map((s) => (
                      <div key={s.dimension} className="rounded-lg border border-border p-2.5">
                        <p className="text-xs font-medium flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 text-primary" /> {s.dimension}
                          <Badge variant="outline" className="text-[10px]">gap {s.gap}</Badge>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{s.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {audit.scoring_note && (
                <p className="px-5 pb-5 text-[11px] text-muted-foreground">{audit.scoring_note}</p>
              )}
            </section>
          </>
        ) : (
          <section className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-3">
            <ShieldCheck className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              No audit has been run in this session. Run one to score the system against the benchmarks, with the gaps and the suggested moves.
            </p>
            <Button size="sm" onClick={run} disabled={running}>
              {running ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Gauge className="w-4 h-4 mr-1.5" />}
              Run the first audit
            </Button>
          </section>
        )}

        {history.length > 0 && (
          <section className="rounded-xl border border-border bg-card">
            <div className="px-5 py-3.5 border-b border-border">
              <h2 className="font-heading text-sm font-semibold">Audit history</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Every run is stored, so improvement is measured rather than claimed.</p>
            </div>
            <div className="divide-y divide-border">
              {history.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => showStored(h)}
                  className="w-full text-left px-5 py-3 hover:bg-muted/40 transition flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-medium">{h.run_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {h.created_date ? new Date(h.created_date).toLocaleString() : ""} · {h.scope}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold">{h.overall_score}<span className="text-muted-foreground">/{h.benchmark_ceiling}</span></span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
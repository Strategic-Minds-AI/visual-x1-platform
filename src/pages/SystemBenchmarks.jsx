import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlatformNav from "@/components/PlatformNav";
import { Loader2, ExternalLink, ChevronRight, AlertCircle } from "lucide-react";

const CATEGORIES = [
  ["competitive_intel", "Competitive intelligence"],
  ["market_research", "Market research and discovery"],
  ["scraping_data", "Scraping, enrichment and data"],
  ["browser_automation", "Browser automation"],
  ["simulation_prediction", "Simulation and prediction"],
  ["audit_qa", "Audit, QA and review"],
  ["onboarding", "Onboarding and intake"],
  ["internal_package", "Internal packages and engines"],
];

const PRIORITY_TONE = {
  critical: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

// The systems that set the bar, scored on documented capability coverage — the same method the
// CloudBrowser benchmark used: 0-2 per dimension, evidence of documentation only, never a
// performance certification.
export default function SystemBenchmarks() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.SystemBenchmark.filter(
          { is_active: true }, { sort: "display_order", limit: 100 }
        );
        setBenchmarks(items || []);
      } catch (e) {
        setError(e.message || "Benchmarks could not be loaded.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const parity = benchmarks.length
    ? Math.round(benchmarks.reduce((s, b) => s + (Number(b.our_parity) || 0), 0) / benchmarks.length)
    : 0;
  const coverage = benchmarks.length
    ? Math.round(benchmarks.reduce((s, b) => s + ((Number(b.evidence_total) || 0) / (Number(b.evidence_max) || 16)), 0) / benchmarks.length * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-full bg-background">
        <PlatformNav />
        <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
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
              <h1 className="font-heading text-lg font-semibold">System benchmarks</h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                The systems that set the bar for each capability, how each assessment was produced, and where Visual X stands against it.
                External benchmarks were researched online; internal ones come from the delivered packages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/system-capabilities"><Button size="sm" variant="outline">Capabilities</Button></Link>
              <Link to="/system-audit"><Button size="sm">System audit <ChevronRight className="w-4 h-4 ml-1" /></Button></Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Benchmarks tracked</p>
              <p className="text-lg font-semibold mt-0.5">{benchmarks.length}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Average parity</p>
              <p className="text-lg font-semibold mt-0.5">{parity}%</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Benchmark evidence coverage</p>
              <p className="text-lg font-semibold mt-0.5">{coverage}%</p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border p-3 mt-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">How these scores were produced</p>
            <p className="text-xs text-muted-foreground mt-1">
              Each benchmark is rated on documented capability coverage, 0-2 per dimension (2 = explicit documentation found,
              1 = partial or beta, 0 = nothing found). That measures documentation coverage only — not quality, speed, security or
              reliability — and it is not a controlled same-workload test. Parity is where Visual X stands against that benchmark today.
            </p>
          </div>
        </header>

        {CATEGORIES.filter(([key]) => benchmarks.some((b) => b.category === key)).map(([key, label]) => (
          <section key={key} className="rounded-xl border border-border bg-card">
            <div className="px-5 py-3.5 border-b border-border">
              <h2 className="font-heading text-sm font-semibold">{label}</h2>
            </div>
            <div className="divide-y divide-border">
              {benchmarks.filter((b) => b.category === key).map((b) => (
                <div key={b.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-semibold">{b.name}</h3>
                        <Badge variant={PRIORITY_TONE[b.priority] || "outline"} className="text-[10px] capitalize">{b.priority}</Badge>
                        {b.vendor_type === "internal" && <Badge variant="outline" className="text-[10px]">internal</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{b.what_it_does}</p>
                      {b.why_it_matters && <p className="text-[11px] text-muted-foreground mt-1">{b.why_it_matters}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold">{b.evidence_total ?? 0}/{b.evidence_max ?? 16}</p>
                      <p className="text-[10px] text-muted-foreground">evidence coverage</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Our parity</p>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                        <div
                          className={(Number(b.our_parity) || 0) >= 80 ? "h-full bg-emerald-500" : (Number(b.our_parity) || 0) >= 55 ? "h-full bg-amber-500" : "h-full bg-destructive"}
                          style={{ width: `${Math.min(100, Number(b.our_parity) || 0)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{b.our_parity ?? 0}%</p>
                    </div>
                    {b.gap_note && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Gap to close</p>
                        <p className="text-xs text-muted-foreground mt-1">{b.gap_note}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-muted-foreground">
                    {b.method_note && <span>Method: {b.method_note}</span>}
                    {(b.source_url || b.url) && (
                      <a href={b.source_url || b.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                        <ExternalLink className="w-3 h-3" /> source
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {benchmarks.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No benchmarks are stored yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const TILES = [
  { key: "captured", label: "Sources captured", note: "clone and ingest runs" },
  { key: "verified", label: "Gate-verified builds", note: "operational and visual gates passed" },
  { key: "passed", label: "Validation passes", note: "independent validator decisions" },
  { key: "benchmarks", label: "Benchmark references", note: "the mandatory reference gate" },
];

// Live counts from the Visual X data plane: two grouped aggregates and one count,
// never a loaded list. A zero is shown as a zero.
export default function X1ProofStrip() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [byStatus, byDecision, benchmarks] = await Promise.all([
        base44.entities.CloneProject.aggregate({ groupBy: "status" }),
        base44.entities.ChainRun.aggregate({ groupBy: "decision" }),
        base44.entities.BenchmarkReference.count({ is_active: true }),
      ]);
      if (!alive) return;
      const statusRows = byStatus.rows || [];
      const decisionRows = byDecision.rows || [];
      setStats({
        captured: statusRows.reduce((n, r) => n + (r.count || 0), 0),
        verified: (statusRows.find((r) => r.status === "verified") || {}).count || 0,
        passed: (decisionRows.find((r) => r.decision === "PASS") || {}).count || 0,
        benchmarks,
      });
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TILES.map((t) => (
            <div key={t.key} className="x1-glass-flat rounded-xl px-4 py-4">
              <p className="font-heading text-2xl sm:text-3xl font-extrabold text-primary tabular-nums">
                {stats ? stats[t.key] : "—"}
              </p>
              <p className="mt-1 text-xs font-medium">{t.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{t.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] x1-track text-muted-foreground">
          {stats && stats.captured === 0 && stats.passed === 0
            ? "No runs recorded yet — the first capture will appear here."
            : "Read live from the Visual X data plane."}
        </p>
      </div>
    </section>
  );
}
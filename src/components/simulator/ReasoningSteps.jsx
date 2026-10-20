import React from "react";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ListOrdered } from "lucide-react";

// Why the numbers came out the way they did, and what the system itself would do next.
export default function ReasoningSteps({ result }) {
  if (!result) return null;
  const rec = result.recommendation;
  return (
    <div className="space-y-5">
      {result.scenarios?.length > 1 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-heading text-sm font-semibold">Scenario band</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              The same inputs read across the modeled spread — {result.mode?.label} runs {result.scenarios.length} scenario(s).
            </p>
          </div>
          <div className="divide-y divide-border">
            {result.scenarios.map((s) => (
              <div key={s.name} className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.note}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-right">
                  <span><span className="font-medium">{s.days_to_page1}</span> <span className="text-muted-foreground">days</span></span>
                  <span><span className="font-medium">{s.leads_12m.toLocaleString()}</span> <span className="text-muted-foreground">leads</span></span>
                  <span><span className="font-medium">${s.revenue_12m.toLocaleString()}</span> <span className="text-muted-foreground">value</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-muted-foreground" />
          <div>
            <h3 className="font-heading text-sm font-semibold">How the system got here</h3>
            <p className="text-xs text-muted-foreground">Every step taken to reach the numbers above, in order.</p>
          </div>
        </div>
        <ol className="p-4 space-y-3">
          {(result.reasoning || []).map((r, i) => (
            <li key={r.step} className="flex gap-3">
              <span className="w-5 h-5 shrink-0 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-medium">{r.step}</p>
                <p className="text-xs text-muted-foreground">{r.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {rec && (
        <div className="rounded-xl border border-primary/30 bg-primary/5">
          <div className="px-4 py-3 border-b border-primary/20 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-heading text-sm font-semibold">What the system would do</h3>
              <p className="text-xs text-muted-foreground">Its own single recommendation, with the reasoning exposed.</p>
            </div>
          </div>
          <div className="p-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Who", rec.who],
              ["What", rec.what],
              ["When", rec.when],
              ["Where", rec.where],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-card p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-xs mt-1">{value}</p>
              </div>
            ))}
            <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Why</p>
              <p className="text-xs mt-1">{rec.why}</p>
            </div>
            {rec.why_not_others && (
              <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Why not the alternatives</p>
                <p className="text-xs mt-1">{rec.why_not_others}</p>
              </div>
            )}
          </div>
          <div className="px-4 pb-4">
            <Badge variant="outline" className="text-[11px]">
              Recommendation from the model's own assumptions — a planning choice, not a guaranteed outcome
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
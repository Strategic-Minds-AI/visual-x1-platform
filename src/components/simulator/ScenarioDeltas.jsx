import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FlaskConical, Zap } from "lucide-react";

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 1 });

export default function ScenarioDeltas({ result }) {
  if (!result) return null;
  const deltas = result.deltas || [];
  const best = result.leverage?.best_moves || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> If You Add This — What Changes
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Each row is the same simulation re-run with only that change applied. Increments are on top of the current setup.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {deltas.map((d) => (
            <div key={d.key} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{d.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{d.detail}</p>
                </div>
                {d.days_saved > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] shrink-0">
                    −{fmt(d.days_saved)} days
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[11px]">
                <span>+{fmt(d.extra_clicks)} clicks</span>
                <span>+{fmt(d.extra_sessions_12m)} sessions (12m)</span>
                <span>+{fmt(d.extra_leads_12m)} leads (12m)</span>
                <span>≈ ${fmt(d.extra_revenue_12m)} est. lead value</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {best.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Highest-Leverage Next Moves
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {best.map((b, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Zap className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium">{b.label}</p>
                  <p className="text-[11px] text-muted-foreground">{b.why}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
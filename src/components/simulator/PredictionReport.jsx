import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Users, DollarSign } from "lucide-react";

const money = (n) => `$${Number(n || 0).toLocaleString()}`;

function Row({ horizon }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 pr-3 text-xs font-medium whitespace-nowrap">{horizon.label}</td>
      <td className="py-2.5 pr-3 text-xs">
        <span className="font-medium">{horizon.leads.toLocaleString()}</span>
        <span className="text-muted-foreground"> leads</span>
        <div className="text-[11px] text-muted-foreground">
          range {horizon.lead_range.low}–{horizon.lead_range.high}
        </div>
      </td>
      <td className="py-2.5 pr-3 text-xs">
        <span className="font-medium">{money(horizon.revenue)}</span>
        <div className="text-[11px] text-muted-foreground">
          range {money(horizon.revenue_range.low)}–{money(horizon.revenue_range.high)}
        </div>
      </td>
      <td className="py-2.5 pr-3 text-xs">
        <span className="font-medium">{horizon.sessions.toLocaleString()}</span>
        <span className="text-muted-foreground"> sessions</span>
      </td>
      <td className="py-2.5 pr-3 text-xs">
        {money(horizon.spend)}
        <div className="text-[11px] text-muted-foreground">
          {horizon.cost_per_lead != null ? `$${horizon.cost_per_lead}/lead` : "—"}
        </div>
      </td>
      <td className="py-2.5 text-xs">
        {horizon.break_even_month ? `month ${horizon.break_even_month}` : "not inside the window"}
        <div className="text-[11px] text-muted-foreground">
          {horizon.revenue_per_dollar != null ? `${horizon.revenue_per_dollar}x return` : "—"}
        </div>
      </td>
    </tr>
  );
}

// The prediction report: every horizon a business owner asks about, with the range shown next
// to the point estimate and the assumptions kept attached.
export default function PredictionReport({ result }) {
  if (!result?.prediction_horizons?.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Run a simulation to see the time-based prediction report.
      </div>
    );
  }
  const total = result.totals || {};
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-heading text-sm font-semibold">Prediction report</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modeled ranges per horizon. Point estimates sit inside a band, and no result is guaranteed.
          </p>
        </div>
        {result.mode && <Badge variant="secondary" className="text-[11px]">{result.mode.label} mode</Badge>}
      </div>

      <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-border">
        <div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Page 1</p>
          <p className="text-sm font-semibold mt-0.5">{result.days_to_page1?.p50} days</p>
          <p className="text-[11px] text-muted-foreground">{result.days_to_page1?.p10}–{result.days_to_page1?.p90} band</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Leads / 12m</p>
          <p className="text-sm font-semibold mt-0.5">{Number(total.leads_12m || 0).toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">modeled</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Value / 12m</p>
          <p className="text-sm font-semibold mt-0.5">{money(total.revenue_12m)}</p>
          <p className="text-[11px] text-muted-foreground">against {money(total.cost_12m)} cost</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Return</p>
          <p className="text-sm font-semibold mt-0.5">{total.roi_12m != null ? `${total.roi_12m}x` : "—"}</p>
          <p className="text-[11px] text-muted-foreground">modeled, before close rate</p>
        </div>
      </div>

      <div className="px-4 overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Horizon</th>
              <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Leads</th>
              <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Modeled value</th>
              <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Sessions</th>
              <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Spend</th>
              <th className="py-2 text-[11px] font-medium text-muted-foreground">Break-even</th>
            </tr>
          </thead>
          <tbody>
            {result.prediction_horizons.map((h) => <Row key={h.id} horizon={h} />)}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Assumptions behind every number above</p>
        <ul className="space-y-1">
          {(result.assumptions || []).map((a) => (
            <li key={a} className="text-xs text-muted-foreground flex gap-2">
              <span className="text-primary">·</span> {a}
            </li>
          ))}
        </ul>
        {result.disclaimer && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
            {result.disclaimer}
          </p>
        )}
      </div>
    </div>
  );
}
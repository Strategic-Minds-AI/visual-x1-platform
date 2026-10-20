import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Gauge, TrendingUp, AlertTriangle } from "lucide-react";

const SCORE_LABELS = {
  technical: "Technical",
  content: "Content",
  authority: "Authority",
  engagement: "Engagement",
  aeo: "AEO",
  geo: "GEO",
};

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function SimulationRanges({ result }) {
  if (!result) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Run a simulation to see the growth range.
        </CardContent>
      </Card>
    );
  }

  const { days_to_page1: days, scores, ranges, timeline, totals, confidence } = result;
  const months = (d) => (d / 30).toFixed(1);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="w-4 h-4" /> Time to Google Page 1 (organic)
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Modeled range, not a promise. P10 = fast case, P90 = slow case.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "P10", v: days.p10, tone: "text-emerald-600" },
              { k: "P50 (expected)", v: days.p50, tone: "text-sky-600" },
              { k: "P90", v: days.p90, tone: "text-amber-600" },
            ].map((d) => (
              <div key={d.k} className="rounded-lg border border-border p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{d.k}</p>
                <p className={`text-2xl font-semibold ${d.tone}`}>{fmt(d.v)}</p>
                <p className="text-[11px] text-muted-foreground">{months(d.v)} months</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 mt-5">
            {Object.entries(SCORE_LABELS).map(([key, label]) => (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-medium">{Math.round(scores[key] || 0)}</span>
                </div>
                <Progress value={Math.round(scores[key] || 0)} className="h-1.5 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Growth Curve — Sessions by Month
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Shaded band is the modeled slow-to-fast range at each month.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(m) => `M${m}`} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="p90_sessions" stroke="none" fill="url(#bandFill)" name="Fast case" />
              <Area type="monotone" dataKey="p10_sessions" stroke="none" fill="#ffffff" fillOpacity={0.85} name="Slow case" />
              <Line type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2} name="Expected sessions" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Possibility Range — 12 Months</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Same strategy set, three market outcomes. Estimated lead value uses the industry benchmark in the assumptions list.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outcome</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Est. lead value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["conservative", "expected", "aggressive"].map((band) => (
                <TableRow key={band}>
                  <TableCell className="capitalize text-sm">{band}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(ranges[band].sessions_12m)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(ranges[band].leads_12m)}</TableCell>
                  <TableCell className="text-right text-sm">${fmt(ranges[band].revenue_12m)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { l: "Sessions 3m", v: fmt(totals.sessions_3m) },
              { l: "Sessions 6m", v: fmt(totals.sessions_6m) },
              { l: "Sessions 12m", v: fmt(totals.sessions_12m) },
              { l: "Leads 12m", v: fmt(totals.leads_12m) },
            ].map((x) => (
              <div key={x.l} className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{x.l}</p>
                <p className="text-lg font-semibold mt-0.5">{x.v}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Badge variant="secondary" className="text-[11px]">Confidence {Math.round((confidence || 0) * 100)}%</Badge>
            <span className="text-[11px] text-muted-foreground">
              {result.data_gaps?.length || 0} input gap(s) reducing confidence
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Assumptions & Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[11px] text-muted-foreground">{result.disclaimer}</p>
          <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-1">
            {(result.assumptions || []).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
          {(result.data_gaps || []).length > 0 && (
            <div>
              <p className="text-[11px] font-medium mt-2">To sharpen this simulation</p>
              <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-1">
                {result.data_gaps.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
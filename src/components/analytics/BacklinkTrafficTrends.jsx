import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, RefreshCw, Link2 } from "lucide-react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6", "#14b8a6", "#f43f5e"];

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function BacklinkTrafficTrends() {
  const [days, setDays] = useState("28");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sites, setSites] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const loadSites = useCallback(async () => {
    try {
      const { items } = await base44.entities.BacklinkSite.filter(
        {},
        { sort: "-created_date", limit: 30, fields: ["target_domain", "target_keyword", "site_url", "ga_property_id", "status"] }
      );
      setSites(items || []);
    } catch {
      setSites([]);
    }
  }, []);

  const load = useCallback(async (window) => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("fetchBacklinkTraffic", { days: Number(window) });
      setData(res.data);
      if (res.data?.error) setError(res.data.error);
    } catch (err) {
      const payload = err.response?.data;
      setData(null);
      setError(payload?.error || err.message || "Could not load Google Analytics traffic");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSites(); }, [loadSites]);
  useEffect(() => { load(days); }, [days, load]);

  const attach = async (site) => {
    const value = (drafts[site.id] || "").trim();
    if (!value) return;
    setSavingId(site.id);
    try {
      await base44.entities.BacklinkSite.update(site.id, { ga_property_id: value });
      setDrafts((d) => ({ ...d, [site.id]: "" }));
      await loadSites();
      await load(days);
    } finally {
      setSavingId(null);
    }
  };

  const untracked = sites.filter((s) => !s.ga_property_id);
  const hasTraffic = (data?.series || []).length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" /> Backlink Site Traffic — Google Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="h-7 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="28">Last 28 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 180 days</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => load(days)} disabled={loading}>
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          One line per live backlink site, side by side. Tracks up to 8 properties per load.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-800">
            {error}
            {data?.message && <span> {data.message}</span>}
          </div>
        )}

        {loading && !hasTraffic && (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading Google Analytics traffic...</div>
        )}

        {!loading && !hasTraffic && !error && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No tracked sites yet. Attach a GA4 property below to start comparing traffic.
          </div>
        )}

        {hasTraffic && (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {(data.labels || []).map((l, i) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    name={l.label}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(data.series || []).map((s, i) => (
                <div key={s.key} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[11px] font-medium truncate">{s.label}</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">{fmt(s.sessions)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    sessions · {fmt(s.users)} users · {fmt(s.conversions)} conversions
                  </p>
                </div>
              ))}
            </div>

            {(data.failures || []).length > 0 && (
              <div className="rounded-md border border-border p-3">
                <p className="text-[11px] font-medium">Properties that could not be read</p>
                <ul className="text-[11px] text-muted-foreground list-disc pl-4 mt-1">
                  {data.failures.map((f, i) => <li key={i}>{f.property}: {f.error}</li>)}
                </ul>
              </div>
            )}
          </>
        )}

        {untracked.length > 0 && (
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Link2 className="w-3 h-3" /> Attach a GA4 property to compare a site
            </p>
            <div className="space-y-2 mt-2">
              {untracked.slice(0, 6).map((site) => (
                <div key={site.id} className="flex items-center gap-2">
                  <span className="text-[11px] w-40 truncate shrink-0">
                    {site.target_domain || site.target_keyword || site.site_url || "Untitled site"}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{site.status || "pending"}</Badge>
                  <Input
                    className="h-7 text-xs"
                    placeholder="GA4 property id, e.g. 123456789"
                    value={drafts[site.id] || ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [site.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    disabled={savingId === site.id || !(drafts[site.id] || "").trim()}
                    onClick={() => attach(site)}
                  >
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
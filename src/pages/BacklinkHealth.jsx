import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Activity, ChevronLeft, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import HealthSummary from "@/components/backlinks/HealthSummary";
import BacklinkTable from "@/components/backlinks/BacklinkTable";
import BacklinkGenerator from "@/components/backlinks/BacklinkGenerator";

const PAGE_SIZE = 40;

export default function BacklinkHealth() {
  const [statusRows, setStatusRows] = useState([]);
  const [healthRows, setHealthRows] = useState([]);
  const [industryRows, setIndustryRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");

  const loadSummary = useCallback(async () => {
    const [statusAgg, healthAgg, industryAgg] = await Promise.all([
      base44.entities.BacklinkSite.aggregate({ groupBy: "status" }),
      base44.entities.BacklinkSite.aggregate({ groupBy: "health_status" }),
      base44.entities.BacklinkSite.aggregate({ groupBy: "industry", avg: ["domain_authority"] }),
    ]);
    setStatusRows(statusAgg.rows || []);
    setHealthRows(healthAgg.rows || []);
    setIndustryRows(industryAgg.rows || []);
  }, []);

  const buildQuery = useCallback(() => {
    const query = {};
    if (statusFilter !== "all") query.status = statusFilter;
    if (industryFilter !== "all") query.industry = industryFilter;
    if (search.trim()) query.target_keyword = { $regex: search.trim(), $options: "i" };
    return query;
  }, [statusFilter, industryFilter, search]);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const { items, next_cursor, has_more } = await base44.entities.BacklinkSite.filter(buildQuery(), {
        sort: "-created_date",
        limit: PAGE_SIZE,
      });
      setRows(items);
      setCursor(next_cursor);
      setHasMore(Boolean(has_more));
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const timer = setTimeout(() => loadFirstPage(), 300);
    return () => clearTimeout(timer);
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const { items, next_cursor, has_more } = await base44.entities.BacklinkSite.filter(buildQuery(), {
        sort: "-created_date",
        limit: PAGE_SIZE,
        cursor,
      });
      setRows((prev) => [...prev, ...items]);
      setCursor(next_cursor);
      setHasMore(Boolean(has_more));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const updateSite = async (id, site_url) => {
    await base44.entities.BacklinkSite.update(id, { site_url });
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, site_url } : row)));
  };

  const runCheck = async (ids) => {
    setChecking(true);
    setNote("");
    try {
      const res = await base44.functions.invoke("checkBacklinkHealth", ids?.length ? { ids } : {});
      const data = res.data || {};
      setNote(data.checked ? `Checked ${data.checked} site${data.checked === 1 ? "" : "s"}.` : data.message || "");
      setSelectedIds([]);
      await Promise.all([loadFirstPage(), loadSummary()]);
    } catch (error) {
      setNote(error.response?.data?.error || error.message || "Health check failed");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-semibold">Backlink Network Health</h1>
        </div>
        <Link to="/factory" className="ml-auto text-xs text-muted-foreground hover:text-foreground transition">
          Back to Factory →
        </Link>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <HealthSummary statusRows={statusRows} healthRows={healthRows} />

        <BacklinkGenerator
          onCreated={() => {
            loadFirstPage();
            loadSummary();
          }}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Site health checks</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search keyword"
                  className="h-9 pl-8 w-56"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-48 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industryRows
                    .filter((row) => row.industry)
                    .map((row) => (
                      <SelectItem key={row.industry} value={row.industry}>
                        {row.industry} ({row.count})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => runCheck(selectedIds)} disabled={checking || selectedIds.length === 0}>
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Check selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
              </Button>
              <Button size="sm" variant="outline" onClick={() => runCheck([])} disabled={checking}>
                Scan next needing attention
              </Button>
              {note && <Badge variant="outline" className="text-xs font-normal">{note}</Badge>}
            </div>

            <BacklinkTable
              rows={rows}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              selectedIds={selectedIds}
              onToggle={toggle}
              onUpdate={updateSite}
            />
          </CardContent>
        </Card>

        {industryRows.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">By industry</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {industryRows.map((row) => (
                  <div key={row.industry || "unknown"} className="flex items-center justify-between border rounded-md px-3 py-2">
                    <span className="text-sm truncate">{row.industry || "Unassigned"}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {row.count} sites · DA {Math.round(row.avg_domain_authority || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FlaskConical, Loader2, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import VariationCreator from "@/components/variations/VariationCreator";
import VariationTable from "@/components/variations/VariationTable";

export default function VariationTracker() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("all");
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.FactoryBatch.filter({}, { sort: "-created_date", limit: 50, fields: ["sentence", "industry"] });
      setBatches(items);
    })();
  }, []);

  const loadVariations = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.SiteVariation.filter(
        batchId === "all" ? {} : { batch_id: batchId },
        { sort: "-performance_score", limit: 60 }
      );
      setVariations(items);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    loadVariations();
  }, [loadVariations]);

  const update = async (id, data) => {
    await base44.entities.SiteVariation.update(id, data);
    setVariations((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
  };

  const sync = async () => {
    setSyncing(true);
    setNote("");
    try {
      const res = await base44.functions.invoke("syncVariationMetrics", batchId === "all" ? {} : { batch_id: batchId });
      const data = res.data || {};
      setNote(
        data.synced
          ? `Pulled ${data.window_days} days of Google Analytics data for ${data.synced} variation${data.synced === 1 ? "" : "s"}.`
          : data.message || "Nothing to sync yet."
      );
      await loadVariations();
    } catch (error) {
      setNote(error.response?.data?.error || error.message || "Google Analytics sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const leader = variations.find((v) => v.is_leader);
  const totalSessions = variations.reduce((sum, v) => sum + (v.sessions || 0), 0);
  const totalConversions = variations.reduce((sum, v) => sum + (v.conversions || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-semibold">Multi-Site Variation Testing</h1>
        </div>
        <Link to="/visual-approval" className="ml-auto text-xs text-muted-foreground hover:text-foreground transition">
          Visual approval gate →
        </Link>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-3">
              <p className="text-xl font-bold">{variations.length}</p>
              <p className="text-xs text-muted-foreground">Variations in test</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-xl font-bold">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions · {totalConversions} conversions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3">
              <p className="text-xl font-bold text-yellow-600 flex items-center gap-1">
                {leader ? <Trophy className="w-4 h-4" /> : null}
                {leader ? leader.label : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {leader ? `Best performer · score ${leader.performance_score}` : "No winner yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        <VariationCreator batchId={batchId === "all" ? "" : batchId} onCreated={loadVariations} />

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">Variation performance</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger className="w-64 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All batches</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.sentence?.slice(0, 48) || batch.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={sync} disabled={syncing}>
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sync Google Analytics
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {note && <Badge variant="outline" className="text-xs font-normal">{note}</Badge>}
            <VariationTable variations={variations} loading={loading} onUpdate={update} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
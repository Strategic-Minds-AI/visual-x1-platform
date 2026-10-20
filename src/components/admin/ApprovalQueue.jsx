import React, { useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pipelineError, readRecords, when } from "@/lib/adminPipelines";

// Live release gates. Factory batches awaiting a visual decision and verified
// clones awaiting human acceptance, decided against real records.
export default function ApprovalQueue() {
  const [batches, setBatches] = useState(null);
  const [clones, setClones] = useState(null);
  const [operator, setOperator] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [batchRows, cloneRows] = await Promise.all([
        readRecords("FactoryBatch", { query: { visual_approval: "pending" }, limit: 25 }),
        readRecords("CloneProject", { query: { human_approved: false }, limit: 25 }),
      ]);
      setBatches(batchRows);
      setClones(cloneRows);
    } catch (e) {
      setError(pipelineError(e));
      setBatches([]);
      setClones([]);
    }
  };

  useEffect(() => {
    load();
    base44.auth.me().then((me) => setOperator(me?.email || "")).catch(() => setOperator(""));
  }, []);

  const decideBatch = async (batch, decision) => {
    setBusy(batch.id);
    setError("");
    try {
      await base44.entities.FactoryBatch.update(batch.id, {
        visual_approval: decision,
        approved_at: new Date().toISOString(),
        approved_by: operator,
      });
      await load();
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  const acceptClone = async (clone, accepted) => {
    setBusy(clone.id);
    setError("");
    try {
      await base44.entities.CloneProject.update(clone.id, {
        human_approved: accepted,
        approved_by: operator,
        approved_at: new Date().toISOString(),
        status: accepted ? "verified" : "rejected",
      });
      await load();
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  const loading = batches === null || clones === null;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="x1-track text-xs font-bold text-muted-foreground">Release Gates</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Nothing advances to public release without this decision. A high score never substitutes for it.
        </p>
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      </Card>

      <Card className="p-5">
        <p className="x1-track text-xs font-bold text-muted-foreground">Factory batches awaiting visual approval</p>
        {loading ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
        ) : batches.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No batch is waiting on a visual decision.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {batches.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-foreground">{batch.sentence}</span>
                  <span className="text-[10px] text-muted-foreground">
                    QA {batch.quality_score || 0} · {batch.status} · {when(batch.created_date)}
                  </span>
                </span>
                <span className="flex gap-2">
                  <Button size="sm" onClick={() => decideBatch(batch, "approved")} disabled={busy === batch.id}>
                    <Check /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decideBatch(batch, "rejected")} disabled={busy === batch.id}>
                    <X /> Reject
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <p className="x1-track text-xs font-bold text-muted-foreground">Clones awaiting human acceptance</p>
        {loading ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
        ) : clones.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No clone is waiting on acceptance.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {clones.map((clone) => (
              <li key={clone.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-foreground">{clone.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {clone.source_label || clone.source_url || clone.source_type} · {clone.status} · operational{" "}
                    {clone.operational_gate} · visual {clone.visual_gate}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{clone.visual_score || 0} visual</Badge>
                  <Button size="sm" onClick={() => acceptClone(clone, true)} disabled={busy === clone.id}>
                    <Check /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => acceptClone(clone, false)} disabled={busy === clone.id}>
                    <X /> Reject
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
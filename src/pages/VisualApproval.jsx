import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ShieldCheck, Columns2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import ApprovalQueue from "@/components/approval/ApprovalQueue";
import BatchPreviewPanel from "@/components/approval/BatchPreviewPanel";

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const FIELDS = [
  "sentence",
  "industry",
  "status",
  "quality_score",
  "spec_score",
  "visual_approval",
  "approval_notes",
  "created_date",
  "prompt_result",
];

export default function VisualApproval() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedIds, setSelectedIds] = useState([]);
  const [userEmail, setUserEmail] = useState("");

  const queryFor = (status) => {
    if (status === "all") return {};
    if (status === "pending") {
      return { $or: [{ visual_approval: "pending" }, { visual_approval: { $exists: false } }] };
    }
    return { visual_approval: status };
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { items } = await base44.entities.FactoryBatch.filter(queryFor(filter), {
          sort: "-created_date",
          limit: 50,
          fields: FIELDS,
        });
        setBatches(items);
      } catch {
        setBatches([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [filter]);

  useEffect(() => {
    base44.auth.me().then((u) => setUserEmail(u?.email || "")).catch(() => {});
  }, []);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const decide = async (batch, decision, notes) => {
    await base44.entities.FactoryBatch.update(batch.id, {
      visual_approval: decision,
      approval_notes: notes ?? batch.approval_notes ?? "",
      approved_at: new Date().toISOString(),
      approved_by: userEmail,
    });

    if (filter !== "all" && filter !== decision) {
      setBatches((prev) => prev.filter((b) => b.id !== batch.id));
      setSelectedIds((prev) => prev.filter((id) => id !== batch.id));
    } else {
      setBatches((prev) =>
        prev.map((b) => (b.id === batch.id ? { ...b, visual_approval: decision, approval_notes: notes ?? b.approval_notes } : b))
      );
    }
  };

  const selectedBatches = batches.filter((b) => selectedIds.includes(b.id));

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-semibold">Visual Approval Gate</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/variations" className="text-xs text-muted-foreground hover:text-foreground transition">
            Variation testing →
          </Link>
          <Link to="/factory" className="text-xs text-muted-foreground hover:text-foreground transition">
            Back to Factory →
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Columns2 className="w-3.5 h-3.5" />
            Select up to 4 runs to preview them side by side
          </span>
        </div>

        {selectedBatches.length > 0 && (
          <div className={`grid gap-4 ${selectedBatches.length > 1 ? "md:grid-cols-2" : ""}`}>
            {selectedBatches.map((batch) => (
              <BatchPreviewPanel key={batch.id} batch={batch} onDecide={decide} />
            ))}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Approval Queue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ApprovalQueue
              batches={batches}
              selectedIds={selectedIds}
              onToggle={toggle}
              onDecide={decide}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
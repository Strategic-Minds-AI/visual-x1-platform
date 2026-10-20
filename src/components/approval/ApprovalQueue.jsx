import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, CheckSquare, Square } from "lucide-react";

const approvalColors = {
  approved: "default",
  rejected: "destructive",
  pending: "secondary",
};

export default function ApprovalQueue({ batches, selectedIds, onToggle, onDecide, loading }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading production runs...</p>;
  }

  if (batches.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No production runs match this filter.</p>;
  }

  return (
    <div className="space-y-2">
      {batches.map((batch) => {
        const isSelected = selectedIds.includes(batch.id);
        const atLimit = !isSelected && selectedIds.length >= 2;
        return (
          <Card key={batch.id} className={isSelected ? "border-primary" : ""}>
            <CardContent className="py-3 flex items-start gap-3">
              <button
                type="button"
                onClick={() => !atLimit && onToggle(batch.id)}
                disabled={atLimit}
                className={`mt-0.5 shrink-0 ${atLimit ? "opacity-30" : "text-primary"}`}
                title={atLimit ? "Select up to 2 runs to compare" : "Select to compare side by side"}
              >
                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{batch.sentence}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{batch.industry || "—"}</Badge>
                  <Badge variant={approvalColors[batch.visual_approval || "pending"]} className="text-xs">
                    {batch.visual_approval || "pending"}
                  </Badge>
                  <span className={`text-xs font-bold ${batch.quality_score >= 95 ? "text-green-600" : batch.quality_score >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                    {batch.quality_score || 0}/100
                  </span>
                </div>
              </div>

              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600" title="Approve" onClick={() => onDecide(batch, "approved")}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600" title="Reject" onClick={() => onDecide(batch, "rejected")}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
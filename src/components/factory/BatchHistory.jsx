import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusColors = {
  ready: "default",
  needs_refinement: "secondary",
  generating: "outline",
  planning: "outline",
  failed: "destructive",
};

export default function BatchHistory({ refreshKey }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { items } = await base44.entities.FactoryBatch.filter(
          {},
          { sort: '-created_date', limit: 10, fields: ['sentence', 'industry', 'status', 'quality_score', 'current_step', 'created_date'] }
        );
        setBatches(items);
      } catch {
        setBatches([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" /> Production History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : batches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No production runs yet. Launch your first batch above.</p>
        ) : (
          <div className="space-y-2">
            {batches.map((batch) => (
              <div key={batch.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{batch.sentence}</p>
                  <p className="text-xs text-muted-foreground">
                    {batch.industry} — {batch.current_step}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {batch.quality_score > 0 && (
                    <span className={`text-sm font-bold ${batch.quality_score >= 95 ? "text-green-600" : batch.quality_score >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                      {batch.quality_score}
                    </span>
                  )}
                  <Badge variant={statusColors[batch.status] || "outline"} className="text-xs">
                    {batch.status}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
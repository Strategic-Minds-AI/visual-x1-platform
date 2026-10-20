import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BatchPreviewPanel({ batch, onDecide }) {
  const [html, setHtml] = useState("");
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState(batch.approval_notes || "");

  const renderPreview = async () => {
    setRendering(true);
    setError(null);
    try {
      let prompt = "";
      try {
        prompt = JSON.parse(batch.prompt_result || "{}").prompt || "";
      } catch {
        prompt = "";
      }
      if (!prompt) prompt = batch.sentence;
      const res = await base44.functions.invoke("renderPreview", { prompt });
      setHtml(res.data.html || "");
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Preview failed");
    } finally {
      setRendering(false);
    }
  };

  useEffect(() => {
    renderPreview();
  }, [batch.id]);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium truncate">{batch.sentence}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-xs">{batch.industry || "—"}</Badge>
              <span className={`text-xs font-bold ${batch.quality_score >= 95 ? "text-green-600" : batch.quality_score >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                {batch.quality_score || 0}/100
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={renderPreview} disabled={rendering} title="Re-render preview">
            <RefreshCw className={`w-4 h-4 ${rendering ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="h-80 bg-muted/30 border-y">
          {rendering ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-sm text-destructive p-4 text-center">{error}</div>
          ) : (
            <iframe srcDoc={html} className="w-full h-full border-0 bg-white" sandbox="allow-scripts" title={`Preview ${batch.id}`} />
          )}
        </div>

        <div className="p-3 space-y-2">
          <Input
            placeholder="Approval notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button className="flex-1" size="sm" onClick={() => onDecide(batch, "approved", notes)}>
              <Check className="w-4 h-4" /> Approve
            </Button>
            <Button className="flex-1" size="sm" variant="destructive" onClick={() => onDecide(batch, "rejected", notes)}>
              <X className="w-4 h-4" /> Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2 } from "lucide-react";

const SCORES = [
  { key: "seo_score", label: "SEO" },
  { key: "geo_score", label: "GEO" },
  { key: "aeo_score", label: "AEO" },
];

export default function ContentJudgePanel({ industry, targetKeyword, onApplyHook }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verdict, setVerdict] = useState(null);

  const run = async () => {
    if (content.trim().length < 120) {
      setError("Paste at least a paragraph or two of the page content.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("judgePageContent", {
        content,
        industry,
        target_keyword: targetKeyword,
      });
      setVerdict(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Judge failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="w-4 h-4" /> Content Judge — SEO / GEO / AEO
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Paste the page copy. It scores how answer engines and generative engines read it, then tests alternative hooks.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          className="min-h-[120px] text-sm"
          placeholder="Paste the page headline, sections and body copy..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1" onClick={run} disabled={loading}>
            <Sparkles className="w-3.5 h-3.5" /> {loading ? "Scoring..." : "Score content"}
          </Button>
          {error && <span className="text-[11px] text-destructive">{error}</span>}
        </div>

        {verdict && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-3 gap-3">
              {SCORES.map((s) => (
                <div key={s.key} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-semibold">{Math.round(verdict[s.key] || 0)}</span>
                  </div>
                  <Progress value={Math.round(verdict[s.key] || 0)} className="h-1.5 mt-1.5" />
                </div>
              ))}
            </div>

            {verdict.summary && <p className="text-xs text-muted-foreground">{verdict.summary}</p>}

            {(verdict.findings || []).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Findings & fixes</p>
                <div className="space-y-1.5">
                  {verdict.findings.map((f, i) => (
                    <div key={i} className="rounded-md border border-border p-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{f.area}</Badge>
                        <span className="text-[10px] text-muted-foreground">{f.severity}</span>
                      </div>
                      <p className="text-[11px] mt-1">{f.issue}</p>
                      <p className="text-[11px] text-muted-foreground">Fix: {f.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(verdict.hook_variants || []).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Hook + wording tests
                </p>
                <div className="space-y-1.5">
                  {verdict.hook_variants.map((h, i) => (
                    <div key={i} className="rounded-md border border-border p-2">
                      <p className="text-xs font-medium">{h.hook}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{h.rationale}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30 text-[10px]">SEO {h.seo_delta >= 0 ? "+" : ""}{h.seo_delta}</Badge>
                        <Badge className="bg-violet-500/15 text-violet-300 border-violet-500/30 text-[10px]">GEO {h.geo_delta >= 0 ? "+" : ""}{h.geo_delta}</Badge>
                        <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">AEO {h.aeo_delta >= 0 ? "+" : ""}{h.aeo_delta}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => onApplyHook(h.hook, h.engagement_delta)}
                        >
                          Apply + re-simulate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(verdict.quick_wins || []).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Quick wins</p>
                <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-1">
                  {verdict.quick_wins.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
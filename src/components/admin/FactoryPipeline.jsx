import React, { useEffect, useState } from "react";
import { Factory, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ArtifactFrame from "@/components/admin/ArtifactFrame";
import { pipelineError, readRecords, runPipeline, when } from "@/lib/adminPipelines";

// Technology 3 of 3: the website factory. One sentence becomes a production batch
// with a rendered artifact, its QA score and the release gates that follow.
export default function FactoryPipeline() {
  const [sentence, setSentence] = useState("");
  const [industry, setIndustry] = useState("");
  const [variants, setVariants] = useState(10);
  const [backlinks, setBacklinks] = useState(5);
  const [batches, setBatches] = useState(null);
  const [result, setResult] = useState(null);
  const [artifact, setArtifact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadBatches = async () => {
    try {
      setBatches(await readRecords("FactoryBatch", { limit: 10 }));
    } catch (e) {
      setError(pipelineError(e));
      setBatches([]);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const launch = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const data = await runPipeline("orchestrateFactory", {
        sentence,
        industry: industry || "General",
        target_variants: Number(variants) || 10,
        target_backlinks: Number(backlinks) || 5,
      });
      setResult(data);
      setArtifact(data.html || "");
      await loadBatches();
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-primary" />
          <span className="x1-track text-xs font-bold text-muted-foreground">Website Factory</span>
        </div>

        <Textarea
          className="mt-4"
          rows={3}
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="One sentence describing the business and what the site must achieve."
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry" />
          <Input
            type="number"
            min="1"
            value={variants}
            onChange={(e) => setVariants(e.target.value)}
            aria-label="SEO variants"
            placeholder="SEO variants"
          />
          <Input
            type="number"
            min="0"
            value={backlinks}
            onChange={(e) => setBacklinks(e.target.value)}
            aria-label="Backlink sites"
            placeholder="Backlink sites"
          />
        </div>

        <Button className="mt-4" onClick={launch} disabled={sentence.trim().length < 10 || busy}>
          <Factory /> {busy ? "Building batch…" : "Launch production batch"}
        </Button>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        {result && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border p-4 text-xs">
            <Badge>{result.batch_id ? "Batch created" : "No batch"}</Badge>
            {result.quality_score !== undefined && <Badge variant="outline">QA {result.quality_score}</Badge>}
            <span className="text-muted-foreground">
              {(artifact.length || 0).toLocaleString()} characters rendered
            </span>
          </div>
        )}
      </Card>

      <ArtifactFrame html={artifact} />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="x1-track text-xs font-bold text-muted-foreground">Live production batches</p>
          <Button variant="ghost" onClick={loadBatches}>
            <RefreshCw /> Refresh
          </Button>
        </div>
        {batches === null ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading batches…</p>
        ) : batches.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No production batches yet. Launch one above.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {batches.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-foreground">{batch.sentence}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {batch.industry || "General"} · QA {batch.quality_score || 0} · {when(batch.created_date)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{batch.status}</Badge>
                  <Badge variant={batch.visual_approval === "approved" ? "default" : "secondary"}>
                    {batch.visual_approval}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
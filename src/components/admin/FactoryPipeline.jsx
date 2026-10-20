import React, { useEffect, useState } from "react";
import { Factory, RefreshCw } from "lucide-react";
import ArtifactFrame from "@/components/admin/ArtifactFrame";
import { Panel, PrimaryButton, LinkButton, ErrorText, StatusPill } from "@/components/admin/adminUi";
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
    <div className="cp-admin-stack">
      <Panel kicker="WEBSITE FACTORY" title="One sentence into a production batch">
        <textarea
          className="cp-field"
          rows={3}
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="One sentence describing the business and what the site must achieve."
        />
        <div className="cp-admin-grid">
          <input
            className="cp-field"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Industry"
            aria-label="Industry"
          />
          <input
            className="cp-field"
            type="number"
            min="1"
            value={variants}
            onChange={(e) => setVariants(e.target.value)}
            aria-label="SEO variants"
            placeholder="SEO variants"
          />
          <input
            className="cp-field"
            type="number"
            min="0"
            value={backlinks}
            onChange={(e) => setBacklinks(e.target.value)}
            aria-label="Backlink sites"
            placeholder="Backlink sites"
          />
        </div>

        <div className="cp-admin-actions">
          <PrimaryButton onClick={launch} disabled={sentence.trim().length < 10 || busy}>
            <Factory size={14} /> {busy ? "Building batch…" : "Launch production batch"}
          </PrimaryButton>
        </div>

        <ErrorText>{error}</ErrorText>

        {result && (
          <div className="cp-panel-top mt-5">
            <p className="cp-kicker">BATCH RESULT</p>
            <div className="cp-admin-row-buttons">
              <StatusPill>{result.batch_id ? "BATCH CREATED" : "NO BATCH"}</StatusPill>
              {result.quality_score !== undefined && <StatusPill>QA {result.quality_score}</StatusPill>}
              <span className="cp-fine">{(artifact.length || 0).toLocaleString()} characters rendered</span>
            </div>
          </div>
        )}
      </Panel>

      <ArtifactFrame html={artifact} />

      <Panel
        kicker="LIVE PRODUCTION BATCHES"
        aside={<LinkButton onClick={loadBatches}><RefreshCw size={13} /> REFRESH</LinkButton>}
      >
        {batches === null ? (
          <p className="cp-empty">Loading batches…</p>
        ) : batches.length === 0 ? (
          <p className="cp-empty">No production batches yet. Launch one above.</p>
        ) : (
          <div className="cp-asset-list">
            {batches.map((batch) => (
              <div key={batch.id}>
                <span className="cp-lead-avatar">BATCH</span>
                <div>
                  <h3>{batch.sentence}</h3>
                  <p className="cp-fine">
                    {batch.industry || "General"} · QA {batch.quality_score || 0} · {batch.status}
                  </p>
                  <p className="cp-fine">{when(batch.created_date)}</p>
                </div>
                <StatusPill>{batch.visual_approval}</StatusPill>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
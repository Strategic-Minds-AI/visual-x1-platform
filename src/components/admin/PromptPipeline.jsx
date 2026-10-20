import React, { useEffect, useState } from "react";
import { Play, Sparkles } from "lucide-react";
import ArtifactFrame from "@/components/admin/ArtifactFrame";
import { Panel, PrimaryButton, OutlineButton, LinkButton, ErrorText, StatusPill } from "@/components/admin/adminUi";
import { pipelineError, readRecords, runPipeline, when } from "@/lib/adminPipelines";

const CATEGORIES = ["general", "technical", "content", "ecommerce", "local", "ai_native"];

// Technology 1 of 3: the prompt system. Request -> advanced prompt -> orchestrated
// chain with its own gates -> rendered artifact. Each button calls the real
// backend module; nothing here is simulated.
export default function PromptPipeline() {
  const [request, setRequest] = useState("");
  const [category, setCategory] = useState("general");
  const [prompt, setPrompt] = useState("");
  const [run, setRun] = useState(null);
  const [artifact, setArtifact] = useState("");
  const [runs, setRuns] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const loadRuns = async () => {
    try {
      setRuns(await readRecords("ChainRun", { limit: 6 }));
    } catch (e) {
      setError(pipelineError(e));
      setRuns([]);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const draft = async () => {
    setBusy("draft");
    setError("");
    try {
      const data = await runPipeline("convertPrompt", { sentence: request, category });
      setPrompt(data.advanced || "");
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  const execute = async () => {
    setBusy("run");
    setError("");
    setRun(null);
    try {
      const data = await runPipeline("runPromptChain", {
        mode: "run",
        request: (prompt || request).slice(0, 2000),
      });
      setRun(data);
      await loadRuns();
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  const render = async () => {
    setBusy("render");
    setError("");
    try {
      const context = run?.outputs?.implementation?.build_prompt || prompt || request;
      const data = await runPipeline("renderPreview", { prompt: context });
      setArtifact(data.html || "");
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="cp-admin-stack">
      <Panel
        kicker="PROMPT SYSTEM"
        title="Brief, chain, artifact"
        aside={
          <div className="cp-quote-fields cp-admin-inline-field">
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Prompt domain">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <textarea
          className="cp-field"
          rows={3}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="Describe what to build. Module A reads this as the mission brief."
        />

        <div className="cp-admin-actions">
          <OutlineButton onClick={draft} disabled={request.trim().length < 8 || Boolean(busy)}>
            <Sparkles size={14} /> {busy === "draft" ? "Drafting…" : "1 · Draft the prompt"}
          </OutlineButton>
          <PrimaryButton onClick={execute} disabled={(prompt || request).trim().length < 8 || Boolean(busy)}>
            <Play size={14} /> {busy === "run" ? "Running chain…" : "2 · Run the chain"}
          </PrimaryButton>
          <OutlineButton onClick={render} disabled={!(run || prompt) || Boolean(busy)}>
            {busy === "render" ? "Rendering…" : "3 · Render artifact"}
          </OutlineButton>
        </div>

        <ErrorText>{error}</ErrorText>

        {prompt && (
          <div className="mt-5">
            <p className="cp-kicker mb-2">ADVANCED PROMPT</p>
            <pre className="cp-admin-pre">{prompt}</pre>
          </div>
        )}

        {run?.run && (
          <div className="mt-5">
            <div className="cp-panel-top">
              <p className="cp-kicker">CHAIN RESULT</p>
              <StatusPill>{run.run.decision || run.run.status}</StatusPill>
            </div>
            {run.run.decision_reason && <p className="cp-fine">{run.run.decision_reason}</p>}
            <ul className="cp-admin-stat-row">
              <li>
                <span className="cp-kicker">MISSION</span>
                <span>{run.mission_id}</span>
              </li>
              <li>
                <span className="cp-kicker">STAGES</span>
                <span>
                  {run.run.completed_count || 0} of {run.run.stage_count || 0}
                </span>
              </li>
              <li>
                <span className="cp-kicker">REPAIR CYCLES USED</span>
                <span>{run.run.repair_cycles_used || 0}</span>
              </li>
              <li>
                <span className="cp-kicker">ARTIFACT</span>
                <span>
                  {run.artifact?.artifact_type || "none"} · {(run.artifact?.length || 0).toLocaleString()} characters
                </span>
              </li>
            </ul>
          </div>
        )}
      </Panel>

      <ArtifactFrame html={artifact} />

      <Panel
        kicker="RECENT CHAIN RUNS"
        aside={<LinkButton onClick={loadRuns}>REFRESH</LinkButton>}
      >
        {runs === null ? (
          <p className="cp-empty">Loading live runs…</p>
        ) : runs.length === 0 ? (
          <p className="cp-empty">No chain runs recorded for this account yet.</p>
        ) : (
          <div className="cp-asset-list">
            {runs.map((item) => (
              <div key={item.id}>
                <span className="cp-lead-avatar">RUN</span>
                <div>
                  <h3>{item.request}</h3>
                  <p className="cp-fine">{when(item.created_date)}</p>
                </div>
                <StatusPill>{item.decision || item.status}</StatusPill>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
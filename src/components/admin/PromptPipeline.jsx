import React, { useEffect, useState } from "react";
import { ArrowRight, FileCode2, Play, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ArtifactFrame from "@/components/admin/ArtifactFrame";
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
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="x1-track text-xs font-bold text-muted-foreground">Prompt System</span>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Prompt domain"
            className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-foreground"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <Textarea
          className="mt-4"
          rows={3}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="Describe what to build. Module A reads this as the mission brief."
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={draft} disabled={request.trim().length < 8 || Boolean(busy)}>
            {busy === "draft" ? "Drafting…" : "1 · Draft the prompt"}
          </Button>
          <Button variant="outline" onClick={execute} disabled={(prompt || request).trim().length < 8 || Boolean(busy)}>
            <Play /> {busy === "run" ? "Running chain…" : "2 · Run the chain"}
          </Button>
          <Button variant="outline" onClick={render} disabled={!(run || prompt) || Boolean(busy)}>
            <FileCode2 /> {busy === "render" ? "Rendering…" : "3 · Render artifact"}
          </Button>
        </div>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        {prompt && (
          <div className="mt-4">
            <p className="x1-track text-[10px] font-bold text-muted-foreground">Advanced prompt</p>
            <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary/70 p-4 text-xs leading-relaxed text-foreground">
              {prompt}
            </pre>
          </div>
        )}

        {run?.run && (
          <div className="mt-4 space-y-2 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{run.run.decision || run.run.status}</Badge>
              <span className="text-xs text-muted-foreground">
                {run.mission_id} · {run.run.completed_count || 0}/{run.run.stage_count || 0} stages · repairs{" "}
                {run.run.repair_cycles_used || 0}
              </span>
            </div>
            {run.run.decision_reason && <p className="text-xs text-muted-foreground">{run.run.decision_reason}</p>}
            <p className="text-xs text-muted-foreground">
              Artifact: {run.artifact?.artifact_type || "none"} · {(run.artifact?.length || 0).toLocaleString()} characters
            </p>
          </div>
        )}
      </Card>

      <ArtifactFrame html={artifact} />

      <Card className="p-5">
        <p className="x1-track text-xs font-bold text-muted-foreground">Recent chain runs</p>
        {runs === null ? (
          <p className="mt-3 text-xs text-muted-foreground">Loading live runs…</p>
        ) : runs.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No chain runs recorded for this account yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {runs.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{item.request}</span>
                <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Badge variant="outline">{item.decision || item.status}</Badge>
                  {when(item.created_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-3" onClick={loadRuns}>
          Refresh <ArrowRight />
        </Button>
      </Card>
    </div>
  );
}
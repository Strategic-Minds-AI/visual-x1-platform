import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PlatformNav from "@/components/PlatformNav";
import ChainRunner from "@/components/promptsystem/ChainRunner";
import StageTrace from "@/components/promptsystem/StageTrace";
import DecisionPanel from "@/components/promptsystem/DecisionPanel";
import ArtifactPreview from "@/components/promptsystem/ArtifactPreview";
import RunHistory from "@/components/promptsystem/RunHistory";
import ModuleCard from "@/components/promptsystem/ModuleCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function PromptSystem() {
  const [meta, setMeta] = useState(null);
  const [runs, setRuns] = useState([]);
  const [run, setRun] = useState(null);
  const [html, setHtml] = useState("");
  const [artifactType, setArtifactType] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const loadRuns = async () => {
    const { items } = await base44.entities.ChainRun.filter({}, { sort: "-created_date", limit: 10 });
    setRuns(items || []);
    return items || [];
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("runPromptChain", { mode: "describe" });
        setMeta(res?.data || null);
        await loadRuns();
      } catch (e) {
        setError(e.message || "Could not load the prompt system");
      }
    })();
  }, []);

  const handleResult = async (data) => {
    setError("");
    if (!data) return;
    if (data.refresh) {
      const latest = await loadRuns();
      if (latest[0]) setRun(latest[0]);
      return;
    }
    if (data.error && !data.outputs) {
      setError(data.error);
      if (data.run) setRun(data.run);
      return;
    }
    setRun(data.run);
    setHtml(data.artifact?.html || "");
    setArtifactType(data.artifact?.artifact_type || "");
    await loadRuns();
  };

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> Prompt System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Versioned modules bound by a mission contract, executed as a typed chain with independent validation and bounded repair.
            {meta?.revision ? ` Revision ${meta.revision}.` : ""}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-5 items-start">
          <div className="space-y-5">
            <ChainRunner
              onRun={handleResult}
              running={running}
              setRunning={setRunning}
              onStatus={setRun}
              error={error}
            />
            {run && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Execution trace {run.mission_id ? `— ${run.mission_id}` : ""}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {run.status} · stage {run.current_stage || "—"} · {run.completed_count || 0}/{run.stage_count || 0} stages complete
                  </p>
                </CardHeader>
                <CardContent>
                  <StageTrace nodes={meta?.nodes || []} run={run} />
                </CardContent>
              </Card>
            )}
            {html && <ArtifactPreview html={html} artifactType={artifactType} />}
            {run && <DecisionPanel run={run} />}
          </div>

          <div className="space-y-5">
            <RunHistory runs={runs} onSelect={(r) => { setRun(r); setHtml(""); setArtifactType(""); }} activeId={run?.id} />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Modules ({meta?.modules?.length || 0})</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Each module carries a stable id, version, typed inputs and output schema, constraints, authorization boundaries,
                  acceptance criteria, failure behaviour, evaluation cases, cost budget and a rollback pointer to its previous version.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {(meta?.modules || []).map((m) => <ModuleCard key={m.module_id} module={m} />)}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
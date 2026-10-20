import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Boxes, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const parse = (v, fallback) => {
  try {
    const p = JSON.parse(v || "");
    return p ?? fallback;
  } catch {
    return fallback;
  }
};

const STAGE_TONE = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  clean: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  gaps: "border-amber-200 bg-amber-50 text-amber-700",
  defects: "border-amber-200 bg-amber-50 text-amber-700",
  not_pass: "border-rose-200 bg-rose-50 text-rose-700"
};

const CLAIM_TONE = { PASS: "text-emerald-600", FAIL: "text-rose-600", "NOT RUN": "text-muted-foreground" };

export default function AgentPipelinePanel({ project, onUpdated }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const pipeline = parse(project?.pipeline_json, null);

  const run = async () => {
    if (!project) return;
    setRunning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("ingestionPipeline", { project_id: project.id, rounds: 3 });
      const data = res.data || {};
      if (!data.ok) setError(data.error || "The pipeline could not finish.");
      else if (data.project) onUpdated?.(data.project);
    } catch (e) {
      setError(e?.response?.data?.error || "The pipeline could not finish.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="w-4 h-4" /> Ingestion agent system
          {pipeline ? (
            <Badge
              variant="outline"
              className={cn("text-xs border ml-auto", pipeline.decision === "PASS" ? STAGE_TONE.pass : STAGE_TONE.not_pass)}
            >
              {pipeline.decision}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          The ingestor measures before it specifies, the architect designs the integration, QA hunts defects, the repair agent fixes
          within three bounded rounds, and an independent validator decides. A defect is only closed by the QA re-run that follows a
          repair, never by the repair's own claim — and this pipeline never opens the visual gate or records your acceptance.
        </p>

        <Button size="sm" onClick={run} disabled={running || !project}>
          {running ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-1" />}
          {pipeline ? "Run again" : "Run the agents"}
        </Button>
        {running && <p className="text-xs text-muted-foreground">Measuring, specifying, hunting defects and validating. This takes a minute.</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}

        {pipeline ? (
          <>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge variant="outline" className="text-xs">{pipeline.rounds_used} of {pipeline.max_rounds} repair rounds used</Badge>
              <Badge variant="outline" className="text-xs">{new Date(pipeline.ran_at).toISOString().slice(0, 16).replace("T", " ")} UTC</Badge>
            </div>
            <p className="text-xs">{pipeline.decision_reason}</p>

            <div className="space-y-1.5">
              {(pipeline.stages || []).map((s) => (
                <div key={s.id} className="rounded-lg border border-border p-2.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px] border", STAGE_TONE[s.status] || "")}>{s.status}</Badge>
                    <span className="text-xs font-medium">{s.agent}</span>
                    <span className="text-[10px] text-muted-foreground">{s.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.summary}</p>

                  {(s.findings || []).length > 0 && (
                    <div className="space-y-0.5 pt-0.5">
                      {s.findings.map((f) => (
                        <p key={f.id} className="text-xs">
                          <span className={f.ok ? "text-emerald-600" : "text-amber-600"}>{f.ok ? "✓" : "!"}</span>{" "}
                          <span className="text-muted-foreground">{f.label}: {f.found}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {(s.rounds || []).map((r) => (
                    <div key={r.round} className="text-xs pt-1 border-t border-border/60">
                      <p className="font-medium">Round {r.round}</p>
                      <p className="text-muted-foreground">{r.qa.verdict} · confidence {r.qa.confidence}</p>
                      {r.qa.defects.map((d) => (
                        <p key={d.id} className="text-muted-foreground">· [{d.severity}] {d.description}</p>
                      ))}
                      {r.repair ? (
                        <p className="text-muted-foreground">
                          Repair applied {r.repair.applied.length} change(s)
                          {r.repair.not_applicable.length ? `, ${r.repair.not_applicable.length} left for you` : ""}.
                        </p>
                      ) : null}
                    </div>
                  ))}

                  {(s.claims || []).length > 0 && (
                    <div className="space-y-0.5 pt-0.5">
                      {s.claims.map((c, i) => (
                        <p key={i} className="text-xs">
                          <span className={cn("font-medium", CLAIM_TONE[c.verdict])}>{c.verdict}</span>{" "}
                          <span className="text-muted-foreground">{c.claim}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {(s.could_not_verify || []).length > 0 && (
                    <div className="pt-0.5">
                      {s.could_not_verify.map((c, i) => (
                        <p key={i} className="text-xs text-amber-700">could not verify: {c}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(pipeline.supply || []).length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 space-y-1">
                <p className="text-xs font-medium text-amber-900 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5" /> {pipeline.supply.length} value(s) you must supply — the source does not show them
                </p>
                {pipeline.supply.map((s, i) => (
                  <p key={i} className="text-xs text-amber-900/90">
                    <span className="font-medium">[SUPPLY: {s.value}]</span> → {s.belongs_to}
                    {s.why ? <span className="opacity-80"> · {s.why}</span> : null}
                  </p>
                ))}
              </div>
            )}

            {(pipeline.open_defects || []).length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 space-y-1">
                <p className="text-xs font-medium text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {pipeline.open_defects.length} open defect(s) blocking the spec gate
                </p>
                {pipeline.open_defects.map((d) => (
                  <p key={d.id} className="text-xs text-rose-900/90">[{d.severity}] {d.description} → {d.fix}</p>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">{pipeline.method}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No run recorded for this project yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
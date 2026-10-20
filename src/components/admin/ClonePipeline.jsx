import React, { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Download, FileCode2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ArtifactFrame from "@/components/admin/ArtifactFrame";
import { pipelineError, readRecords, runPipeline, when } from "@/lib/adminPipelines";

// Technology 2 of 3: clone and ingest. A live captured project is measured, run
// through the five-role agent pipeline, rendered from its own build prompt and
// then held against the operational checks. The visual gate stays closed until
// images are captured, which this console does not fake.
export default function ClonePipeline() {
  const [projects, setProjects] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [artifact, setArtifact] = useState("");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      const rows = await readRecords("CloneProject", { limit: 40 });
      setProjects(rows);
      setSelectedId((current) => current || rows[0]?.id || "");
    } catch (e) {
      setError(pipelineError(e));
      setProjects([]);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const selected = useMemo(
    () => (projects || []).find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const ingest = async () => {
    setBusy("ingest");
    setError("");
    setReport(null);
    try {
      const data = await runPipeline("ingestionPipeline", { project_id: selected.id, rounds: 3 });
      setReport(data);
      await loadProjects();
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
      const data = await runPipeline("renderPreview", { prompt: selected.build_prompt || selected.name });
      setArtifact(data.html || "");
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  const verify = async () => {
    setBusy("verify");
    setError("");
    setReport(null);
    try {
      const data = await runPipeline("verifyClone", { project_id: selected.id, clone_html: artifact });
      setReport(data);
      await loadProjects();
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
            <Download className="h-4 w-4 text-primary" />
            <span className="x1-track text-xs font-bold text-muted-foreground">Clone &amp; Ingest</span>
          </div>
          <Button variant="ghost" onClick={loadProjects}>
            <RefreshCw /> Refresh
          </Button>
        </div>

        {projects === null ? (
          <p className="mt-4 text-xs text-muted-foreground">Loading captured projects…</p>
        ) : projects.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            No captured sources yet. Capture one in the Clone &amp; Ingest workspace and it appears here.
          </p>
        ) : (
          <>
            <select
              aria-label="Captured project"
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setArtifact(""); setReport(null); }}
              className="mt-4 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.source_type} · {p.status}
                </option>
              ))}
            </select>

            {selected && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Status", selected.status],
                  ["Operational gate", selected.operational_gate],
                  ["Operational score", `${selected.operational_score || 0}%`],
                  ["Visual gate", selected.visual_gate],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border p-3">
                    <p className="x1-track text-[10px] font-bold text-muted-foreground">{label}</p>
                    <p className="mt-1 truncate text-sm text-foreground">{value || "—"}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={ingest} disabled={!selected || Boolean(busy)}>
                <Download /> {busy === "ingest" ? "Running agents…" : "Run agent pipeline"}
              </Button>
              <Button variant="outline" onClick={render} disabled={!selected || Boolean(busy)}>
                <FileCode2 /> {busy === "render" ? "Rendering…" : "Render build prompt"}
              </Button>
              <Button variant="outline" onClick={verify} disabled={!selected || !artifact || Boolean(busy)}>
                <BadgeCheck /> {busy === "verify" ? "Checking…" : "Run operational checks"}
              </Button>
            </div>
            {!artifact && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Operational checks compare the rendered artifact against the capture, so render first.
              </p>
            )}
          </>
        )}

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        {report && (
          <div className="mt-4 rounded-xl border border-border p-4">
            <p className="x1-track text-[10px] font-bold text-muted-foreground">Pipeline result</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {report.decision && <Badge>{report.decision}</Badge>}
              {report.ok === false && <Badge variant="destructive">Failed</Badge>}
              {report.summary?.operational_gate && (
                <Badge variant="outline">Operational {report.summary.operational_gate}</Badge>
              )}
              {report.summary?.visual_gate && <Badge variant="outline">Visual {report.summary.visual_gate}</Badge>}
            </div>
            {report.summary && (
              <p className="mt-2 text-xs text-muted-foreground">
                Operational {report.summary.operational_score ?? 0}% · overall {report.summary.overall_score ?? 0} ·{" "}
                {report.summary.passed ?? 0} passed · {report.summary.failed ?? 0} failed
              </p>
            )}
            {report.pipeline && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {Object.entries(report.pipeline).slice(0, 6).map(([key, value]) => (
                  <li key={key}>
                    <span className="x1-track text-[10px] font-bold">{key.replace(/_/g, " ")}</span>{" "}
                    {Array.isArray(value)
                      ? `${value.length} item${value.length === 1 ? "" : "s"}`
                      : value && typeof value === "object"
                      ? `${Object.keys(value).length} fields`
                      : String(value ?? "—")}
                  </li>
                ))}
              </ul>
            )}
            {report.error && <p className="mt-2 text-xs text-destructive">{report.error}</p>}
            {(report.blockers || report.open_defects || []).slice?.(0, 5).map?.((item, i) => (
              <p key={i} className="mt-1 text-xs text-muted-foreground">• {typeof item === "string" ? item : item.label || item.id}</p>
            ))}
          </div>
        )}
      </Card>

      <ArtifactFrame html={artifact} />

      <Card className="p-5">
        <p className="x1-track text-xs font-bold text-muted-foreground">Captured sources</p>
        {projects !== null && projects.length > 0 && (
          <ul className="mt-3 divide-y divide-border">
            {projects.slice(0, 8).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {p.name} <span className="text-muted-foreground">· {p.source_label || p.source_url || p.source_type}</span>
                </span>
                <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Badge variant="outline">{p.status}</Badge>
                  {when(p.created_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
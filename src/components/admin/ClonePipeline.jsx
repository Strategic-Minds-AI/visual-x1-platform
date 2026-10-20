import React, { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Download, FileCode2, RefreshCw } from "lucide-react";
import ArtifactFrame from "@/components/admin/ArtifactFrame";
import { Panel, Metric, PrimaryButton, OutlineButton, LinkButton, ErrorText, StatusPill } from "@/components/admin/adminUi";
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
    <div className="cp-admin-stack">
      <Panel
        kicker="CLONE & INGEST"
        title="Captured source, measured against itself"
        aside={<LinkButton onClick={loadProjects}><RefreshCw size={13} /> REFRESH</LinkButton>}
      >
        {projects === null ? (
          <p className="cp-empty">Loading captured projects…</p>
        ) : projects.length === 0 ? (
          <p className="cp-empty">
            No captured sources yet. Capture one in the Clone &amp; Ingest workspace and it appears here.
          </p>
        ) : (
          <>
            <div className="cp-quote-fields">
              <label htmlFor="clone-project">Captured project</label>
              <select
                id="clone-project"
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setArtifact("");
                  setReport(null);
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.source_type} · {p.status}
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <div className="cp-metrics">
                <Metric label="Status" value={selected.status} foot="Recorded state" />
                <Metric label="Operational Gate" value={selected.operational_gate} foot="Required checks" accent />
                <Metric label="Operational Score" value={`${selected.operational_score || 0}%`} foot="Checks passed" />
                <Metric label="Visual Gate" value={selected.visual_gate} foot="Image comparison" />
              </div>
            )}

            <div className="cp-admin-actions">
              <PrimaryButton onClick={ingest} disabled={!selected || Boolean(busy)}>
                <Download size={14} /> {busy === "ingest" ? "Running agents…" : "Run agent pipeline"}
              </PrimaryButton>
              <OutlineButton onClick={render} disabled={!selected || Boolean(busy)}>
                <FileCode2 size={14} /> {busy === "render" ? "Rendering…" : "Render build prompt"}
              </OutlineButton>
              <OutlineButton onClick={verify} disabled={!selected || !artifact || Boolean(busy)}>
                <BadgeCheck size={14} /> {busy === "verify" ? "Checking…" : "Run operational checks"}
              </OutlineButton>
            </div>
            {!artifact && (
              <p className="cp-panel-note mt-4">
                Operational checks compare the rendered artifact against the capture, so render first.
              </p>
            )}
          </>
        )}

        <ErrorText>{error}</ErrorText>

        {report && (
          <div className="mt-5">
            <div className="cp-panel-top">
              <p className="cp-kicker">PIPELINE RESULT</p>
              <div className="cp-admin-row-buttons">
                {report.decision && <StatusPill>{report.decision}</StatusPill>}
                {report.ok === false && <StatusPill>FAILED</StatusPill>}
                {report.summary?.operational_gate && <StatusPill>OPERATIONAL {report.summary.operational_gate}</StatusPill>}
                {report.summary?.visual_gate && <StatusPill>VISUAL {report.summary.visual_gate}</StatusPill>}
              </div>
            </div>
            {report.summary && (
              <p className="cp-fine">
                Operational {report.summary.operational_score ?? 0}% · overall {report.summary.overall_score ?? 0} ·{" "}
                {report.summary.passed ?? 0} passed · {report.summary.failed ?? 0} failed
              </p>
            )}
            {report.pipeline && (
              <ul className="cp-admin-stat-row">
                {Object.entries(report.pipeline)
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <li key={key}>
                      <span className="cp-kicker">{key.replace(/_/g, " ")}</span>
                      <span>
                        {Array.isArray(value)
                          ? `${value.length} item${value.length === 1 ? "" : "s"}`
                          : value && typeof value === "object"
                          ? `${Object.keys(value).length} fields`
                          : String(value ?? "—")}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
            {report.error && <p className="cp-admin-error">{report.error}</p>}
          </div>
        )}
      </Panel>

      <ArtifactFrame html={artifact} />

      <Panel kicker="CAPTURED SOURCES">
        {projects !== null && projects.length > 0 ? (
          <div className="cp-asset-list">
            {projects.slice(0, 8).map((p) => (
              <div key={p.id}>
                <span className="cp-lead-avatar">{String(p.source_type || "site").slice(0, 3).toUpperCase()}</span>
                <div>
                  <h3>{p.name}</h3>
                  <p className="cp-fine">{p.source_label || p.source_url || p.source_type}</p>
                  <p className="cp-fine">{when(p.created_date)}</p>
                </div>
                <StatusPill>{p.status}</StatusPill>
              </div>
            ))}
          </div>
        ) : (
          <p className="cp-empty">Nothing captured yet.</p>
        )}
      </Panel>
    </div>
  );
}
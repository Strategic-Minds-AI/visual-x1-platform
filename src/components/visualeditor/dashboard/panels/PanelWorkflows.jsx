import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge, Failure, Loading, MetricGrid, Note, Row, RowList, Section, useLoad, when } from "../dashboardUi";

/**
 * Every chain run this system has recorded, and the way back into building the next one:
 * the chain view is part of the editor's own canvas, so the panel hands the operator to
 * it rather than duplicating the builder here. Any of the runs listed can be deleted —
 * with the selection made explicit, because a run deletes on purpose and only on purpose.
 */
export default function PanelWorkflows({ ctx }) {
  const { projectName, openChain } = ctx;
  const [picked, setPicked] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const { data, error, loading, reload } = useLoad(async () => {
    const [recent, mine, running] = await Promise.all([
      base44.entities.ChainRun.list({ sort: "-created_date", limit: 12 }),
      base44.entities.ChainRun.count({ project_name: projectName }),
      base44.entities.ChainRun.count({ status: "running" }),
    ]);
    return { recent: recent.items || [], mine, running };
  }, [projectName]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const remove = async () => {
    if (!picked.length) return;
    const label = `${picked.length} chain run record${picked.length === 1 ? "" : "s"}`;
    if (!window.confirm(`Delete ${label}? The project, its artifact and any deployment are not changed.`)) return;
    setDeleting(true);
    try {
      await base44.entities.ChainRun.deleteMany({ id: { $in: picked } });
      setPicked([]);
      await reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Section
      title="Workflows"
      note={`${projectName} · multi-step runs, their stage decisions, and the way into the chain builder.`}
      actions={
        <>
          <button type="button" className="ve-pop-action" onClick={openChain}>
            BUILD A CHAIN
          </button>
          <button type="button" className="ve-pop-action" onClick={remove} disabled={!picked.length || deleting}>
            {deleting ? "DELETING…" : `DELETE SELECTED${picked.length ? ` (${picked.length})` : ""}`}
          </button>
          <button type="button" className="ve-pop-action" onClick={reload}>
            REFRESH
          </button>
        </>
      }
    >
      <MetricGrid
        items={[
          { label: "RUNS THIS PROJECT", value: data ? data.mine : "…", note: "recorded under this project's name" },
          { label: "RUNNING NOW", value: data ? data.running : "…", note: "started and not yet decided" },
          { label: "RECENT RUNS", value: data ? data.recent.length : "…", note: "listed below" },
        ]}
      />

      {loading && <Loading what="the chain runs" />}
      {error && <Failure error={error} />}

      {data && (
        <RowList>
          {data.recent.map((r) => (
            <Row
              key={r.id}
              name={r.request || r.project_name || r.mission_id}
              detail={`${r.current_stage || "no stage reported"} · ${r.completed_count ?? 0}/${r.stage_count ?? 0} stages · ${r.repair_cycles_used ?? 0} repair cycle(s)`}
              meta={when(r.created_date)}
            >
              <label className="ve-pop-check" title="Select this run for deletion">
                <input type="checkbox" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} />
              </label>
              <Badge tone={String(r.decision || "").toUpperCase() === "PASS" ? "" : "warn"}>
                {String(r.decision || r.status || "running").toUpperCase()}
              </Badge>
            </Row>
          ))}
          {data.recent.length === 0 && (
            <Row name="No chain run recorded yet" detail="Build a chain and run it to record the first one." />
          )}
        </RowList>
      )}

      <Note>
        A chain run is one pass of the editor's own steps — convert, simulate, render — against this project; the run
        writes its stage trace and its decision as a record, and nothing else depends on it. Deleting the runs you
        select removes those records only: the project, its artifact and any deployment are untouched. Scheduled,
        trigger-driven automations for the app are on the app dashboard, under Workflows; this panel is the project's
        own run history.
      </Note>
    </Section>
  );
}
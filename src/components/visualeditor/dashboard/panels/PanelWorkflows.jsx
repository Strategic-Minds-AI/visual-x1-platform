import React from "react";
import { base44 } from "@/api/base44Client";
import { Badge, Failure, Loading, MetricGrid, Note, Row, RowList, Section, useLoad, when } from "../dashboardUi";

/**
 * Every chain run this system has recorded, and the way back into building the next one:
 * the chain view is part of the editor's own canvas, so the panel hands the operator to
 * it rather than duplicating the builder here.
 */
export default function PanelWorkflows({ ctx }) {
  const { projectName, openChain } = ctx;
  const { data, error, loading, reload } = useLoad(async () => {
    const [recent, mine, running] = await Promise.all([
      base44.entities.ChainRun.list({ sort: "-created_date", limit: 12 }),
      base44.entities.ChainRun.count({ project_name: projectName }),
      base44.entities.ChainRun.count({ status: "running" }),
    ]);
    return { recent: recent.items || [], mine, running };
  }, [projectName]);

  return (
    <Section
      title="Workflows"
      note={`${projectName} · multi-step runs, their stage decisions, and the way into the chain builder.`}
      actions={
        <>
          <button type="button" className="ve-pop-action" onClick={openChain}>
            BUILD A CHAIN
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
        A chain runs the editor's own steps — convert, simulate, render — against this project, and the run writes its
        stage trace and its decision as a record. Scheduled, trigger-driven automations for the app are on the app
        dashboard, under Workflows; this panel is the project's own run history.
      </Note>
    </Section>
  );
}
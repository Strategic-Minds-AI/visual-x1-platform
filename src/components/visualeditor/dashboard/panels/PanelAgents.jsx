import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Action, Failure, Loading, MetricGrid, Note, Row, RowList, Section, useLoad, when } from "../dashboardUi";

/**
 * The workforce and the work it is holding. A brief is written into the editor's own
 * composer, because that is where this project's requests start from.
 */
export default function PanelAgents({ ctx }) {
  const { engine } = ctx;
  const { data, error, loading, reload } = useLoad(async () => {
    const [roster, open, assigned, inProgress] = await Promise.all([
      base44.entities.Agent.list({ sort: "-created_date", limit: 30 }),
      base44.entities.Job.count({ status: "open" }),
      base44.entities.Job.count({ status: "assigned" }),
      base44.entities.Job.count({ status: "in_progress" }),
    ]);
    return { roster: roster.items || [], open, assigned, inProgress };
  }, []);

  const brief = (agent) => engine.setInput(`Brief for ${agent.name} (${agent.role || "agent"}): `);

  return (
    <Section
      title="Agents"
      note="The agents this system runs, and the state of the job board behind them."
      actions={
        <>
          <Link className="ve-linkout" to="/agent-activity">
            ACTIVITY
          </Link>
          <button type="button" className="ve-pop-action" onClick={reload}>
            REFRESH
          </button>
        </>
      }
    >
      <MetricGrid
        items={[
          { label: "AGENTS", value: data ? data.roster.length : "…", note: "in the roster" },
          { label: "JOBS OPEN", value: data ? data.open : "…", note: "waiting for an agent" },
          { label: "ASSIGNED", value: data ? data.assigned : "…", note: "picked up, not started" },
          { label: "IN PROGRESS", value: data ? data.inProgress : "…", note: "being worked on" },
        ]}
      />

      {loading && <Loading what="the roster" />}
      {error && <Failure error={error} />}

      {data && (
        <RowList>
          {data.roster.map((a) => (
            <Row key={a.id} name={a.name} detail={`${a.role || "agent"} · ${a.specialization || "general"}`} meta={`${a.status || "idle"} · added ${when(a.created_date)}`}>
              <Action label="BRIEF" onClick={() => brief(a)} />
            </Row>
          ))}
          {data.roster.length === 0 && (
            <Row name="No agents in the roster yet" detail="The system's agents are created by the orchestration pipeline." />
          )}
        </RowList>
      )}

      <Note>
        Brief writes the opening line into this editor's composer. Sending it goes to the app's autonomy agent, which is the
        one that can read records and call the pipeline functions; a roster entry cannot be invoked directly from a panel.
      </Note>
    </Section>
  );
}
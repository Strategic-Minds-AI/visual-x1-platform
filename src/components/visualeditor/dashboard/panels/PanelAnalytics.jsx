import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Failure, Loading, MetricGrid, Note, Row, RowList, Section, useLoad, when } from "../dashboardUi";

/**
 * What this project has actually produced over its runs: how many checks and releases it
 * has, and the pass rate of its newest test runs. Traffic and sales are the app's own
 * analytics, which the Analytics workspace reads from the connected account.
 */
export default function PanelAnalytics({ ctx }) {
  const { projectName } = ctx;
  const { data, error, loading } = useLoad(async () => {
    const [tests, runs, releases, recent] = await Promise.all([
      base44.entities.TestResult.count({ project_id: projectName }),
      base44.entities.ChainRun.count({ project_name: projectName }),
      base44.entities.Deployment.count({ project_id: projectName }),
      base44.entities.TestResult.filter({ project_id: projectName }, { sort: "-created_date", limit: 12 }),
    ]);
    return { tests, runs, releases, recent: recent.items || [] };
  }, [projectName]);

  return (
    <Section title="Analytics" note={`${projectName} · measured from this project's own runs, not estimated.`}>
      <MetricGrid
        items={[
          { label: "TEST RUNS", value: data ? data.tests : "…", note: "checks recorded for this project" },
          { label: "CHAIN RUNS", value: data ? data.runs : "…", note: "whole runs under this project's name" },
          { label: "RELEASES", value: data ? data.releases : "…", note: "artifacts published" },
          {
            label: "LATEST PASS RATE",
            value: data && data.recent.length ? `${rate(data.recent[0])}%` : "—",
            note: "of the newest check's probes",
          },
        ]}
      />

      {loading && <Loading what="this project's runs" />}
      {error && <Failure error={error} />}

      {data && (
        <RowList>
          {data.recent.map((t) => (
            <Row key={t.id} name={t.test_type || "artifact check"} meta={when(t.created_date)}>
              <span className="ve-meter">
                <span className="ve-meter-track">
                  <i style={{ width: `${rate(t)}%` }} />
                </span>
                {rate(t)}%
              </span>
            </Row>
          ))}
          {data.recent.length === 0 && (
            <Row name="No checks recorded yet" detail="Run the test agent from the toolbar to record the first one." />
          )}
        </RowList>
      )}

      <RowList>
        <Row name="Traffic and sales" detail="Read from the app's connected analytics account, in the Analytics workspace.">
          <Link className="ve-linkout" to="/analytics">
            OPEN ANALYTICS
          </Link>
        </Row>
        <Row name="Rank and backlinks" detail="The app's own variation and backlink tracking.">
          <Link className="ve-linkout" to="/variations">
            OPEN TRACKING
          </Link>
        </Row>
      </RowList>

      <Note>
        A pass rate is that run's own passes over its own passes and failures — a run that could not execute a probe
        reports it as not run, and it is counted in neither.
      </Note>
    </Section>
  );
}

const rate = (t) => {
  const passed = Number(t?.pass_count || 0);
  const failed = Number(t?.fail_count || 0);
  const total = passed + failed;
  return total ? Math.round((passed / total) * 100) : 0;
};
import React from "react";
import { base44 } from "@/api/base44Client";
import { Failure, Loading, MetricGrid, Note, Row, RowList, Section, useLoad, when } from "../dashboardUi";

/**
 * What this project is right now: the artifact on the canvas and the runs recorded
 * against it. Every figure is read from a record or measured from the document itself,
 * so an empty one means nothing was recorded — not that something passed.
 */
export default function PanelOverview({ ctx }) {
  const { projectName, engine, tools } = ctx;
  const { data, error, loading, reload } = useLoad(async () => {
    const [tests, releases, testCount, releaseCount] = await Promise.all([
      base44.entities.TestResult.filter({ project_id: projectName }, { sort: "-created_date", limit: 1 }),
      base44.entities.Deployment.filter({ project_id: projectName }, { sort: "-created_date", limit: 1 }),
      base44.entities.TestResult.count({ project_id: projectName }),
      base44.entities.Deployment.count({ project_id: projectName }),
    ]);
    return {
      test: (tests.items || [])[0] || null,
      release: (releases.items || [])[0] || null,
      testCount,
      releaseCount,
    };
  }, [projectName]);

  const html = engine.previewHtml || "";

  return (
    <Section
      title="Overview"
      note={`${projectName} · the artifact on the canvas and the runs carrying this project's name.`}
      actions={
        <>
          <button className="ve-pop-action" onClick={() => tools.generate()} disabled={!engine.input.trim()}>
            GENERATE
          </button>
          <button className="ve-pop-action" onClick={tools.runTest} disabled={!html}>
            TEST AGENT
          </button>
          <button className="ve-pop-action" onClick={reload}>
            REFRESH
          </button>
        </>
      }
    >
      <MetricGrid
        items={[
          {
            label: "ARTIFACT",
            value: html ? html.length.toLocaleString() : "—",
            note: html ? "characters on the canvas" : "nothing rendered yet",
          },
          { label: "TEST RUNS", value: data ? data.testCount : "…", note: "recorded for this project" },
          { label: "RELEASES", value: data ? data.releaseCount : "…", note: "published from this project" },
          {
            label: "LAST BRIEF",
            value: tools.lastPrompt ? "held" : "—",
            note: tools.lastPrompt ? "regenerate is available" : "nothing generated yet",
          },
        ]}
      />

      {loading && <Loading what="this project's records" />}
      {error && <Failure error={error} />}

      {data && (
        <RowList>
          <Row
            name="Latest test run"
            detail={
              data.test
                ? `${data.test.pass_count ?? 0} passed · ${data.test.fail_count ?? 0} failed · ${data.test.test_type || "probes"}`
                : "No test run recorded for this project yet."
            }
            meta={data.test ? when(data.test.created_date) : ""}
          />
          <Row
            name="Latest release"
            detail={data.release ? data.release.url : "Nothing published from this project yet."}
            meta={data.release ? when(data.release.deployed_at) : ""}
          />
          <Row name="Last brief" detail={tools.lastPrompt || "—"} meta={tools.hasArtifact ? "artifact on canvas" : ""} />
        </RowList>
      )}

      <Note>
        The Overview reads this project only. Traffic and sales for the whole app live under Analytics; the runs recorded
        here are the artifact's own builds, checks and releases.
      </Note>
    </Section>
  );
}
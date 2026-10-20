import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Action, Failure, Loading, MetricGrid, Note, Row, RowList, Section, useLoad, when } from "../dashboardUi";

/**
 * This artifact's own copy is what a search engine reads, so the panel leads with a
 * content pass over the document on the canvas, then the app's campaign records and the
 * workspaces that run them.
 */
export default function PanelMarketing({ ctx }) {
  const { engine, tools } = ctx;
  const { data, error, loading } = useLoad(async () => {
    const [staged, posted, strategies, variants] = await Promise.all([
      base44.entities.SocialPost.count({ status: "staged" }),
      base44.entities.SocialPost.count({ status: "posted" }),
      base44.entities.StrategyPlaybook.count({ is_active: true }),
      base44.entities.SEOVariant.count({}),
    ]);
    return { staged, posted, strategies, variants };
  }, []);

  return (
    <Section
      title="Marketing"
      note="The artifact's own searchable copy first; the app's campaigns and strategies below it."
      actions={
        <Action label="SCORE THIS ARTIFACT'S COPY" onClick={tools.runQA} disabled={!engine.previewHtml} busy={tools.busy === "qa"} />
      }
    >
      <MetricGrid
        items={[
          { label: "POSTS STAGED", value: data ? data.staged : "…", note: "drafted and waiting" },
          { label: "POSTS PUBLISHED", value: data ? data.posted : "…", note: "moved on by the operator" },
          { label: "STRATEGIES ON", value: data ? data.strategies : "…", note: "active playbooks behind the app" },
          { label: "SEO VARIANTS", value: data ? data.variants : "…", note: "generated page variants" },
        ]}
      />

      {loading && <Loading what="the campaign records" />}
      {error && <Failure error={error} />}
      {tools.report && tools.report.title === "CONTENT QA" && (
        <RowList>
          <Row name="Last content pass" detail={tools.report.verdict} meta={tools.report.stats?.map((s) => `${s.label} ${s.value}`).join(" · ")} />
        </RowList>
      )}

      <RowList>
        <Row name="Content and campaign studio" detail="Draft the 30-day schedule, pick tools and stage posts.">
          <Link className="ve-linkout" to="/social-studio">
            OPEN SOCIAL STUDIO
          </Link>
        </Row>
        <Row name="SEO simulator" detail="Model strategies against the site's own profile.">
          <Link className="ve-linkout" to="/seo-simulator">
            OPEN SIMULATOR
          </Link>
        </Row>
        <Row name="Lead opportunities" detail="The service verticals ranked for monetisation.">
          <Link className="ve-linkout" to="/opportunities">
            OPEN MATRIX
          </Link>
        </Row>
      </RowList>

      <Note>
        Scoring this artifact's copy runs the same content pass as the QA button on the toolbar, over the visible words of
        the document on the canvas. Nothing here reports a ranking: a score is a reading of the copy, not of a search
        result.
      </Note>
    </Section>
  );
}
import React from "react";
import { base44 } from "@/api/base44Client";
import { Badge, Copy, Failure, Loading, Note, Row, RowList, Section, useLoad, when } from "../dashboardUi";

/**
 * Where this project is actually live: the artifacts it has published, their public
 * URLs, and the domains on the Vercel project the editor is pointed at. Custom domains
 * for the app itself are managed on the app dashboard, outside this project.
 */
export default function PanelDomains({ ctx }) {
  const { projectName, vercel } = ctx;
  const here = typeof window === "undefined" ? "" : window.location.origin;

  const { data, error, loading, reload } = useLoad(async () => {
    const page = await base44.entities.Deployment.filter({ project_id: projectName }, { sort: "-created_date", limit: 8 });
    return page.items || [];
  }, [projectName]);

  const target = vercel?.selected?.id || vercel?.selected?.name || "";
  const domains = useLoad(async () => {
    if (!target) return null;
    const res = await base44.functions.invoke("vercelConsole", { action: "domains", project_id: target });
    const answer = res.data || {};
    if (answer.error) throw new Error(answer.error);
    return answer;
  }, [target]);

  return (
    <Section
      title="Domains"
      note={`${projectName} · the addresses this project's artifacts answer on.`}
      actions={
        <>
          <Copy text={here} label="COPY APP ADDRESS" />
          <button type="button" className="ve-pop-action" onClick={reload}>
            REFRESH
          </button>
        </>
      }
    >
      <RowList>
        <Row name="This app" detail={here} meta="the console and this editor" />
        <Row
          name="Vercel project"
          detail={target ? `Reading the domains on ${vercel?.selected?.name || target}.` : "No Vercel project is selected in the editor yet."}
          meta={target ? "" : "pick one in the VERCEL menu"}
        />
      </RowList>

      {loading && <Loading what="this project's releases" />}
      {error && <Failure error={error} />}
      {data && (
        <RowList>
          {data.map((d) => (
            <Row key={d.id} name={d.url || "release without a URL"} detail={`${d.environment || "production"} · ${d.provider || "publisher"}`} meta={when(d.deployed_at)}>
              {d.url && (
                <a className="ve-linkout" href={d.url} target="_blank" rel="noopener noreferrer">
                  OPEN
                </a>
              )}
            </Row>
          ))}
          {data.length === 0 && (
            <Row name="Nothing published from this project yet" detail="Publishing an artifact from the toolbar writes its first release here." />
          )}
        </RowList>
      )}

      {target && (
        <>
          {domains.loading && <Loading what="the Vercel domains" />}
          {domains.error && <Failure error={domains.error} />}
          {domains.data && (
            <RowList>
              {(domains.data.domains || []).map((d) => (
                <Row key={d.name} name={d.name} detail={d.redirect ? `redirects to ${d.redirect}` : d.git_branch ? `serves branch ${d.git_branch}` : "serves the project's production build"} meta={when(d.created_at)}>
                  <Badge tone={d.verified ? "" : "warn"}>{d.verified ? "VERIFIED" : "NOT VERIFIED"}</Badge>
                </Row>
              ))}
              {(domains.data.domains || []).length === 0 && <Row name="No domains on that Vercel project" detail="Add one in Vercel, then read it again here." />}
            </RowList>
          )}
        </>
      )}

      <Note>
        Domains on the Vercel project are read straight from Vercel. Custom domains for the app itself are connected on the
        app dashboard, which this project cannot reach — this panel reports what exists, and where the artifacts answer.
      </Note>
    </Section>
  );
}
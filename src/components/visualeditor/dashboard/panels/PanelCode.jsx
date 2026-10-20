import React from "react";
import { base44 } from "@/api/base44Client";
import { Action, Copy, Failure, Loading, MetricGrid, Note, Row, RowList, Section, useAction, useLoad, when } from "../dashboardUi";

/**
 * The artifact's own source, as it stands on the canvas, and the repositories on the
 * connected GitHub account. Importing a repository runs the editor's own capture
 * pipeline, so the source is measured and specified before it is rendered — nothing is
 * claimed about a repository that has not been read.
 */
export default function PanelCode({ ctx }) {
  const { engine, tools } = ctx;
  const html = engine.previewHtml || "";

  const { data, error, loading, reload } = useLoad(async () => {
    const res = await base44.functions.invoke("githubRepo", { action: "list_repos" });
    const answer = res.data || {};
    if (answer.error) throw new Error(answer.error);
    return answer;
  }, []);

  const pulling = useAction();
  const pull = (repo) =>
    pulling.run(async () => {
      const name = repo.full_name || repo.name;
      await tools.openSource({ url: repo.html_url || repo.url, name, sourceType: "repo", label: name });
      return `${name} was captured into this project.`;
    });

  return (
    <Section
      title="Code"
      note="The document on the canvas, and the repositories the connected account can see."
      actions={
        <>
          <Copy text={html} label="COPY THE SOURCE" />
          <button type="button" className="ve-pop-action" onClick={reload}>
            REFRESH
          </button>
        </>
      }
    >
      <MetricGrid
        items={[
          { label: "ARTIFACT", value: html ? html.length.toLocaleString() : "—", note: "characters of source on the canvas" },
          { label: "REPOSITORIES", value: data ? data.count ?? (data.repos || []).length : "…", note: "visible to the connected account" },
          { label: "LAST BRIEF", value: tools.lastPrompt ? "held" : "—", note: "the request behind the artifact" },
        ]}
      />

      {html ? (
        <>
          <pre className="ve-code">{html.slice(0, 1600)}{html.length > 1600 ? "\n…" : ""}</pre>
          <Note>{html.length > 1600 ? `The first 1,600 characters of ${html.length.toLocaleString()} are shown here; COPY THE SOURCE takes all of it.` : "The whole document is on the canvas and in the copy button."}</Note>
        </>
      ) : (
        <Note>Nothing is on the canvas yet, so there is no artifact source to show. Generate one, or import a repository below.</Note>
      )}

      {loading && <Loading what="the repositories" />}
      {error && <Failure error={error} />}
      {pulling.error && <Failure error={pulling.error} />}
      {pulling.result && <Note>{pulling.result}</Note>}

      {data && (
        <RowList>
          {(data.repos || []).map((repo) => (
            <Row
              key={repo.id || repo.full_name || repo.name}
              name={repo.full_name || repo.name}
              detail={repo.description || (repo.private ? "private repository" : "public repository")}
              meta={repo.updated_at ? `updated ${when(repo.updated_at)}` : ""}
            >
              <Action label="IMPORT" onClick={() => pull(repo)} busy={pulling.running} />
              {repo.html_url && (
                <a className="ve-linkout" href={repo.html_url} target="_blank" rel="noopener noreferrer">
                  OPEN
                </a>
              )}
            </Row>
          ))}
          {(data.repos || []).length === 0 && (
            <Row name="No repositories on that account" detail="The connected account can see none, or the connection needs re-authorizing." />
          )}
        </RowList>
      )}

      <Note>
        Importing captures the repository with this project's own pipeline: it is read, measured and specified before an
        artifact is rendered from it. The app's own source code is edited on the app dashboard, not here.
      </Note>
    </Section>
  );
}
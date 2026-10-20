import React from "react";
import { ExternalLink, Loader2, RefreshCw, Rocket, Undo2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * The Vercel menu: the operator's own account read through the stored token, every
 * project on it with a search that asks Vercel itself, and the two actions that
 * belong here — take a project onto the canvas to edit it, or deploy it. The
 * selected project can be rolled back to the deployment before the current one.
 */
export default function EditorVercelMenu({ vercel }) {
  const { account, error, projects, search, setSearch, selected, pick, deployments, deploy, rollback, open, busy, load, loaded } = vercel;

  return (
    <Popover onOpenChange={(open_) => { if (open_ && !loaded) load(); }}>
      <PopoverTrigger asChild>
        <button type="button" className={"ve-pill" + (selected ? " selected" : "")} title="Your Vercel account, projects and deployments">
          <Rocket size={14} />
          <span className="ve-pill-label">VERCEL</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="ve-pop-panel">
        <div className="ve-pop-head">
          <span className="ve-pop-kicker">VERCEL</span>
          <button type="button" className="ve-pop-action" onClick={load} disabled={Boolean(busy)}>
            {busy === "account" ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {busy === "account" ? "READING" : "REFRESH"}
          </button>
        </div>

        {account ? (
          <p className="ve-pop-note">
            Connected as <strong>{account.name || account.username}</strong>
            {account.email ? ` · ${account.email}` : ""}
          </p>
        ) : error ? (
          <p className="ve-pop-error">{error}</p>
        ) : (
          <p className="ve-pop-note">
            <Loader2 size={11} className="animate-spin" /> Reading your Vercel account…
          </p>
        )}

        {account && (
          <>
            <input
              className="ve-pop-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your Vercel projects…"
              aria-label="Search Vercel projects"
            />

            <div className="ve-pop-list">
              {busy === "projects" && !projects.length ? (
                <p className="ve-pop-note">
                  <Loader2 size={11} className="animate-spin" /> Reading your projects…
                </p>
              ) : !projects.length ? (
                <p className="ve-pop-note">No project on this account matched.</p>
              ) : (
                projects.map((project) => (
                  <div key={project.id || project.name} className={"ve-pop-item" + (selected?.id === project.id ? " is-on" : "")}>
                    <span className="ve-pop-name">
                      {project.name}
                      <small>
                        {[project.framework, project.live?.state, project.git?.repo ? `${project.git.org}/${project.git.repo}` : ""]
                          .filter(Boolean)
                          .join(" · ") || "no deployment yet"}
                      </small>
                    </span>
                    <button
                      type="button"
                      className="ve-pop-action"
                      onClick={() => open(project)}
                      disabled={!project.url || busy === "capture"}
                      title={project.url ? `Capture ${project.url} onto the canvas` : "This project has no live URL to capture"}
                    >
                      <ExternalLink size={11} /> EDIT
                    </button>
                    <button type="button" className="ve-pop-action" onClick={() => deploy(project)} disabled={busy === "deploy"} title="Deploy this project">
                      <Rocket size={11} /> DEPLOY
                    </button>
                    <button type="button" className="ve-pop-action" onClick={() => pick(project)} title="Read this project's recent deployments">
                      ROWS
                    </button>
                  </div>
                ))
              )}
            </div>

            {selected && (
              <div className="ve-pop-foot">
                <p className="ve-pop-note">
                  Selected <strong>{selected.name}</strong>
                  {selected.url ? ` · ${selected.url}` : ""}
                </p>
                <p className="ve-pop-note">
                  {deployments.length} recent deployment{deployments.length === 1 ? "" : "s"}
                  {deployments[0] ? ` · latest ${deployments[0].state}` : ""}
                </p>
                <button
                  type="button"
                  className="ve-pop-action"
                  onClick={rollback}
                  disabled={busy === "rollback" || deployments.length < 2}
                  title="Roll this project back to the deployment before the current one"
                >
                  {busy === "rollback" ? <Loader2 size={11} className="animate-spin" /> : <Undo2 size={11} />}
                  ROLL BACK
                </button>
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
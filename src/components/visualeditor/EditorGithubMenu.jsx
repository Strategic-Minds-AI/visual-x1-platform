import React, { useState } from "react";
import { Github, Loader2, Plus, RefreshCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * The GitHub menu: the connected account, the repositories it can see, creating a
 * new repository, and opening one in the editor — which runs it through the app's
 * own capture pipeline, so the repository arrives as an editable project rather
 * than as a link.
 */
export default function EditorGithubMenu({ github }) {
  const { account, error, repos, count, search, setSearch, busy, load, loaded, create, open } = github;
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  return (
    <Popover onOpenChange={(open_) => { if (open_ && !loaded) load(); }}>
      <PopoverTrigger asChild>
        <button type="button" className="ve-pill" title="Your GitHub account and repositories">
          <Github size={14} />
          <span className="ve-pill-label">GITHUB</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="ve-pop-panel">
        <div className="ve-pop-head">
          <span className="ve-pop-kicker">GITHUB</span>
          <button type="button" className="ve-pop-action" onClick={load} disabled={Boolean(busy)}>
            {busy === "account" ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {busy === "account" ? "READING" : "REFRESH"}
          </button>
        </div>

        {account ? (
          <p className="ve-pop-note">
            Connected as <strong>{account.login}</strong> · {count} repositor{count === 1 ? "y" : "ies"} readable
          </p>
        ) : error ? (
          <p className="ve-pop-error">{error}</p>
        ) : (
          <p className="ve-pop-note">
            <Loader2 size={11} className="animate-spin" /> Reading your GitHub account…
          </p>
        )}

        {account && (
          <>
            <input
              className="ve-pop-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your repositories…"
              aria-label="Search repositories"
            />

            <div className="ve-pop-list">
              {busy === "repos" && !repos.length ? (
                <p className="ve-pop-note">
                  <Loader2 size={11} className="animate-spin" /> Reading your repositories…
                </p>
              ) : !repos.length ? (
                <p className="ve-pop-note">No repository matched.</p>
              ) : (
                repos.slice(0, 40).map((repo) => (
                  <div key={repo.id || repo.full_name} className="ve-pop-item">
                    <span className="ve-pop-name">
                      {repo.full_name}
                      <small>{[repo.private ? "private" : "public", repo.language, repo.branch].filter(Boolean).join(" · ")}</small>
                    </span>
                    <button
                      type="button"
                      className="ve-pop-action"
                      onClick={() => open(repo)}
                      disabled={busy === "capture"}
                      title="Capture this repository into the editor as a project you can edit"
                    >
                      EDIT
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="ve-pop-foot">
              <p className="ve-pop-kicker">CREATE A REPOSITORY</p>
              <input
                className="ve-pop-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new-repository-name"
                aria-label="New repository name"
              />
              <div className="ve-pop-inline">
                <label className="ve-pop-check">
                  <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> Private
                </label>
                <button
                  type="button"
                  className="ve-pop-action"
                  onClick={() => create(name, isPrivate).then(() => setName(""))}
                  disabled={!name.trim() || busy === "create"}
                  title="Create this repository on the connected account"
                >
                  {busy === "create" ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  CREATE
                </button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
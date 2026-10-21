import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Route, Trash2 } from "lucide-react";

const TARGETS = ["production", "preview", "development"];

const call = async (payload) => (await base44.functions.invoke("vercelConsole", payload)).data || {};

// Where this system deploys from and what each environment holds: the repository
// Vercel builds, the domains that answer for it, and the variables set for production,
// preview and development. Names and targets only — a value is never read back here.
export default function ProjectRouting({ project }) {
  const name = String(project.vercel_url || "").replace(/^https?:\/\//, "").split("/")[0].trim();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [routing, setRouting] = useState(null);
  const [repos, setRepos] = useState([]);
  const [chosen, setChosen] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [targets, setTargets] = useState(["production"]);

  const read = async () => {
    setBusy("read");
    setError("");
    const data = await call({ action: "routing", project: name });
    if (!data.ok) setError(data.error || "Vercel did not answer for this project.");
    else setRouting(data);
    setBusy("");
  };

  useEffect(() => {
    if (open && !routing && name) read();
  }, [open, name]);

  if (!name) return null;

  const link = routing?.project?.git || null;

  const loadRepos = async () => {
    setBusy("repos");
    setError("");
    const data = await call({ action: "routing", project: name });
    const res = await base44.functions.invoke("githubRepo", { action: "list_repos" });
    const gh = res.data || {};
    setRepos(gh.repos || []);
    if (!data.ok) setError(data.error || "Vercel did not answer for this project.");
    setBusy("");
  };

  const relink = async () => {
    if (!chosen) return;
    if (!window.confirm(`Point ${name} at ${chosen}? Vercel will build that repository for this project from now on.`)) return;
    setBusy("link");
    setError("");
    const data = await call({ action: "link_repo", project: name, repo: chosen });
    if (!data.ok) setError(data.error || "Vercel refused the link.");
    else {
      setChosen("");
      await read();
    }
    setBusy("");
  };

  const addVariable = async () => {
    setBusy("env");
    setError("");
    const data = await call({ action: "env_set", project: name, key: key.trim(), value, targets });
    if (!data.ok) setError(data.error || "Vercel refused the variable.");
    else {
      setKey("");
      setValue("");
      await read();
    }
    setBusy("");
  };

  const removeVariable = async (env) => {
    if (!window.confirm(`Remove ${env.key} from ${(env.target || []).join(", ") || "this project"}?`)) return;
    setBusy(`rm-${env.id}`);
    setError("");
    const data = await call({ action: "env_remove", project: name, env_id: env.id });
    if (!data.ok) setError(data.error || "Vercel refused the deletion.");
    else await read();
    setBusy("");
  };

  const toggleTarget = (t) =>
    setTargets((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
        <Route className="w-3.5 h-3.5 mr-1" /> {open ? "Hide routing" : "Deployment routing"}
      </Button>

      {open && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
          {busy === "read" && !routing ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading the project from Vercel…
            </p>
          ) : null}

          {error ? <p className="text-xs text-amber-200">{error}</p> : null}

          {routing ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="x1-track text-[9px] text-muted-foreground">builds from</span>
                <span className="truncate">{link ? `${link.org}/${link.repo}` : "no repository linked"}</span>
                {link?.branch ? <Badge variant="outline" className="text-[10px]">production: {link.branch}</Badge> : null}
                <Button size="sm" variant="ghost" onClick={read} disabled={busy === "read"}>
                  <RefreshCw className={`w-3.5 h-3.5 ${busy === "read" ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="space-y-1">
                <p className="x1-track text-[9px] text-muted-foreground">domains</p>
                {routing.domains?.length ? (
                  routing.domains.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="truncate">{d.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {d.verified ? "verified" : "not verified"}
                      </Badge>
                      {d.redirect ? <span className="text-muted-foreground truncate">redirects to {d.redirect}</span> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No domain is attached to this project yet.</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="x1-track text-[9px] text-muted-foreground">variables by environment</p>
                {routing.env_error ? (
                  <p className="text-xs text-amber-200">{routing.env_error}</p>
                ) : routing.envs?.length ? (
                  routing.envs.map((env) => (
                    <div key={env.id} className="flex items-center gap-2 text-xs">
                      <span className="truncate font-mono">{env.key}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {(env.target || []).join(", ") || "no target"}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => removeVariable(env)} disabled={busy === `rm-${env.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No variables are set on this project.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="VARIABLE_NAME"
                  className="h-8 text-xs max-w-[13rem] font-mono"
                />
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="value"
                  type="password"
                  className="h-8 text-xs max-w-[13rem]"
                />
                <div className="flex items-center gap-1">
                  {TARGETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTarget(t)}
                      className={
                        "px-2 py-1 rounded-full border text-[10px] x1-track " +
                        (targets.includes(t)
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border text-muted-foreground")
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={addVariable} disabled={busy === "env" || !key.trim() || !value || !targets.length}>
                  {busy === "env" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Set"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                <Button size="sm" variant="ghost" onClick={loadRepos} disabled={busy === "repos"}>
                  {busy === "repos" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                  Choose another repository
                </Button>
                {repos.length ? (
                  <>
                    <select
                      value={chosen}
                      onChange={(e) => setChosen(e.target.value)}
                      className="h-8 text-xs rounded-md bg-card border border-border px-2 max-w-[18rem]"
                    >
                      <option value="">Pick a repository</option>
                      {repos.map((r) => (
                        <option key={r.full_name} value={r.full_name}>
                          {r.full_name}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={relink} disabled={!chosen || busy === "link"}>
                      {busy === "link" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                      Relink
                    </Button>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Rocket, GitBranch, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const STATE_STYLES = {
  READY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ERROR: "bg-rose-100 text-rose-700 border-rose-200",
  CANCELED: "bg-slate-100 text-slate-600 border-slate-200",
  BUILDING: "bg-amber-100 text-amber-700 border-amber-200",
  QUEUED: "bg-amber-100 text-amber-700 border-amber-200",
  INITIALIZING: "bg-amber-100 text-amber-700 border-amber-200"
};

const when = (iso) => (iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—");

export default function ProjectDetail({ project, deployments, live, deploying, onDeploy, onRefresh }) {
  const [branch, setBranch] = useState("");

  if (!project) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Pick a project to see its branch, its commits and its deployments.
        </CardContent>
      </Card>
    );
  }

  const linkedBranch = project.git?.branch || "";
  const ref = branch || linkedBranch;
  const liveId = live?.id;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {project.name}
            {project.live?.state ? <Badge variant="outline" className="text-xs">{project.live.state}</Badge> : null}
            <Button size="sm" variant="ghost" className="ml-auto" onClick={onRefresh}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {project.url ? (
              <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
                {project.url.replace(/^https?:\/\//, "")} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-muted-foreground">no production domain yet</span>
            )}
            {project.framework ? <span className="text-muted-foreground">· {project.framework}</span> : null}
          </div>

          <div className="rounded-lg border border-border p-3 space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" /> Repository link
            </p>
            {project.git ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {project.git.org ? `${project.git.org}/${project.git.repo}` : project.git.repo}
                  {linkedBranch ? ` · production branch ${linkedBranch}` : ""}
                </p>
                {project.live?.commit ? (
                  <p className="text-xs">
                    <span className="font-mono">{project.live.commit.sha}</span>{" "}
                    <span className="text-muted-foreground">
                      {project.live.commit.ref ? `on ${project.live.commit.ref} · ` : ""}
                      {project.live.commit.message || "no commit message"}
                      {project.live.commit.author ? ` · ${project.live.commit.author}` : ""}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No commit metadata is attached to the latest deployment.</p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                This project is not linked to a repository, so it can only be redeployed from its last build. Connect the repository in
                Vercel to deploy a branch from here.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{project.git ? "Branch to deploy" : "Branch (needs a repository link)"}</p>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder={linkedBranch || "main"}
                className="h-9 w-44 text-sm"
              />
            </div>
            <Button size="sm" onClick={() => onDeploy(ref)} disabled={deploying}>
              {deploying ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Rocket className="w-3.5 h-3.5 mr-1" />}
              {project.git ? "Deploy branch" : "Redeploy latest build"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {live ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Deployment in view</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("text-xs border", STATE_STYLES[live.state] || STATE_STYLES.QUEUED)}>{live.state}</Badge>
              <span className="text-xs text-muted-foreground">{live.target} · {when(live.created)}</span>
              {live.url ? (
                <a href={live.url} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-4">
                  open
                </a>
              ) : null}
              {live.inspector ? (
                <a href={live.inspector} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-4">
                  build log
                </a>
              ) : null}
              {!["READY", "ERROR", "CANCELED"].includes(live.state) ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> polling Vercel every few seconds
                </span>
              ) : null}
            </div>
            {live.commit ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{live.commit.sha}</span> {live.commit.ref ? `on ${live.commit.ref} · ` : ""}
                {live.commit.message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent deployments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {!deployments.length && <p className="text-xs text-muted-foreground">This project has never been deployed.</p>}
          {deployments.map((d) => (
            <div
              key={d.id}
              className={cn(
                "flex flex-wrap items-center gap-2 py-1.5 border-b border-border last:border-0",
                d.id === liveId && "bg-muted/50 rounded px-2"
              )}
            >
              <Badge variant="outline" className={cn("text-xs border shrink-0", STATE_STYLES[d.state] || STATE_STYLES.QUEUED)}>{d.state}</Badge>
              <span className="text-xs text-muted-foreground shrink-0">{d.target}</span>
              <span className="text-xs text-muted-foreground shrink-0">{when(d.created)}</span>
              {d.commit ? (
                <span className="text-xs text-muted-foreground truncate">
                  <span className="font-mono">{d.commit.sha}</span> {d.commit.ref ? `· ${d.commit.ref}` : ""} · {d.commit.message}
                </span>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
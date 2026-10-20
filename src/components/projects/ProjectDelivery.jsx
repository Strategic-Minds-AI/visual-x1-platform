import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Rocket, RefreshCw } from "lucide-react";

const call = async (payload) => {
  const res = await base44.functions.invoke("vercelConsole", payload);
  return res.data || {};
};

// Publishing and domains for one system, read from Vercel: the deployment it holds,
// the branch it is asked to build, and the domains attached to the project.
export default function ProjectDelivery({ project }) {
  const name = String(project.vercel_url || "").replace(/^https?:\/\//, "").split("/")[0].trim();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");
  const [deployment, setDeployment] = useState(null);
  const [domains, setDomains] = useState(null);

  if (!name) {
    return (
      <p className="text-xs text-muted-foreground">
        No Vercel project is set on this system, so it cannot be published from here yet.
      </p>
    );
  }

  const loadDomains = async () => {
    setBusy("domains");
    setError("");
    const data = await call({ action: "domains", project: name });
    if (!data.ok) setError(data.error || "Vercel did not return the domains.");
    else setDomains(data.domains || []);
    setBusy("");
  };

  const deploy = async () => {
    setBusy("deploy");
    setError("");
    const data = await call({ action: "deploy", project: name, ref: ref.trim() });
    if (!data.ok) setError(data.error || "The deployment was refused.");
    else setDeployment(data.deployment || null);
    setBusy("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setOpen((v) => !v);
            if (!open && domains === null) loadDomains();
          }}
        >
          <Globe className="w-3.5 h-3.5 mr-1" /> {open ? "Hide delivery" : "Publishing & domains"}
        </Button>
        {deployment?.state ? (
          <Badge variant="outline" className="text-[10px]">
            {deployment.state}
            {deployment.target ? ` · ${deployment.target}` : ""}
          </Badge>
        ) : null}
      </div>

      {open && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="branch to build (optional)"
              className="h-8 text-xs max-w-[16rem]"
            />
            <Button size="sm" onClick={deploy} disabled={busy === "deploy"}>
              {busy === "deploy" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Rocket className="w-3.5 h-3.5 mr-1" />}
              Publish
            </Button>
            <Button size="sm" variant="ghost" onClick={loadDomains} disabled={busy === "domains"}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Recheck domains
            </Button>
          </div>

          {error ? <p className="text-xs text-amber-200">{error}</p> : null}

          {deployment?.url ? (
            <p className="text-xs text-muted-foreground">
              Vercel is building{" "}
              <a href={deployment.url} target="_blank" rel="noreferrer" className="underline">
                {deployment.url}
              </a>{" "}
              from {deployment.commit?.sha || "the latest source"}.
            </p>
          ) : null}

          {domains === null ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading the domains on this project…
            </p>
          ) : !domains.length ? (
            <p className="text-xs text-muted-foreground">Vercel holds no domain on this project yet.</p>
          ) : (
            <div className="space-y-1">
              {domains.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="truncate">{d.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {d.verified ? "verified" : "not verified"}
                  </Badge>
                  {d.redirect ? <span className="text-muted-foreground truncate">redirects to {d.redirect}</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Rocket, Loader2 } from "lucide-react";

// Loads a Vercel project's frame into the browser panel, so the page being worked on
// is the deployed one rather than a typed address.
export default function VercelProjectPicker({ onPick }) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || projects) return;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const res = await base44.functions.invoke("vercelConsole", { action: "list_projects" });
        const data = res.data || {};
        if (!data.ok) setError(data.error || "Could not reach Vercel.");
        else setProjects(data.projects || []);
      } catch {
        setError("Could not reach Vercel.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, projects]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" title="Load one of your Vercel projects into this panel">
          <Rocket className="w-3.5 h-3.5 mr-1" /> Vercel
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Your Vercel projects</div>
        {loading && (
          <div className="px-2 py-3 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading your projects…
          </div>
        )}
        {error && <p className="px-2 py-2 text-xs text-rose-600">{error}</p>}
        {projects && !projects.length && !error ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">No projects on this account.</p>
        ) : null}
        {(projects || []).map((p) => (
          <DropdownMenuItem
            key={p.id}
            disabled={!p.url}
            onSelect={() => p.url && onPick(p.url)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="truncate text-xs">{p.name}</span>
            <span className="ml-auto flex items-center gap-1 shrink-0">
              {p.live?.state ? <Badge variant="outline" className="text-[10px]">{p.live.state}</Badge> : null}
              {!p.url ? <span className="text-[10px] text-muted-foreground">no url</span> : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
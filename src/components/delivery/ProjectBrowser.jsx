import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectBrowser({ projects, loading, search, onSearch, selectedId, onSelect, onCreate, creating }) {
  const [name, setName] = useState("");

  const create = () => {
    const clean = name.trim();
    if (clean.length < 3) return;
    onCreate(clean);
    setName("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search projects" className="h-9 pl-8 text-sm" />
        </div>

        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="new-project-name"
            className="h-9 text-sm"
          />
          <Button size="sm" variant="outline" onClick={create} disabled={creating || name.trim().length < 3}>
            {creating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />} Create
          </Button>
        </div>

        <div className="max-h-[26rem] overflow-y-auto space-y-1.5 pr-1">
          {loading && (
            <p className="text-xs text-muted-foreground flex items-center gap-2 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading your projects…
            </p>
          )}
          {!loading && !projects.length && <p className="text-xs text-muted-foreground py-2">No projects match that search.</p>}
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={cn(
                "w-full text-left rounded-lg border p-2.5 electric-hover",
                selectedId === p.name ? "border-primary bg-muted" : "border-border hover:bg-muted/60"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{p.name}</span>
                {p.live?.state ? (
                  <Badge variant="outline" className="text-[10px] ml-auto shrink-0">{p.live.state}</Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {p.git ? (
                  <span className="flex items-center gap-1 truncate">
                    <GitBranch className="w-3 h-3 shrink-0" /> {p.git.repo || p.git.org}
                  </span>
                ) : (
                  <span>not linked to a repository</span>
                )}
                {p.framework ? <span className="shrink-0">· {p.framework}</span> : null}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ModuleCard({ module }) {
  const [open, setOpen] = useState(false);
  const inputs = (() => { try { return JSON.parse(module.inputs_json || "[]"); } catch { return []; } })();
  const evals = (() => { try { return JSON.parse(module.eval_cases_json || "[]"); } catch { return []; } })();

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold font-mono break-all">{module.module_id}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{module.purpose}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className="text-[10px]">v{module.version}</Badge>
            <Badge variant="secondary" className="text-[10px]">{module.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>in: {inputs.join(", ") || "none"}</span>
          <span>budget: {module.cost_budget}</span>
          <span>timeout: {module.latency_budget_ms}ms</span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpen(!open)}>
          {open ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
          {open ? "Hide module contract" : "Show module contract"}
        </Button>
        {open && (
          <div className="space-y-2 text-xs border-t border-border pt-2">
            <p><span className="font-semibold">Constraints:</span> {module.constraints}</p>
            <p><span className="font-semibold">Acceptance:</span> {module.acceptance_criteria}</p>
            <p><span className="font-semibold">Failure behaviour:</span> {module.failure_behavior}</p>
            <p><span className="font-semibold">Authorization boundaries:</span> {module.authorization_boundaries}</p>
            <p><span className="font-semibold">Tools:</span> {module.tool_requirements}</p>
            {evals.length > 0 && (
              <div>
                <p className="font-semibold">Evaluation cases</p>
                {evals.map((e) => <p key={e.id} className="text-muted-foreground">• {e.id}: {e.case} → {e.expected}</p>)}
              </div>
            )}
            <p className="text-muted-foreground"><span className="font-semibold">Provenance:</span> {module.provenance} · {module.changelog}</p>
            <div className="rounded-md border border-border bg-muted/30 p-2 max-h-56 overflow-y-auto">
              <pre className="text-[11px] whitespace-pre-wrap font-body">{module.prompt_text}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
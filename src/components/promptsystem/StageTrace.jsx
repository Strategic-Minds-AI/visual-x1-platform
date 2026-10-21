import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2, MinusCircle, XCircle } from "lucide-react";

const STATUS = {
  passed: { tone: "text-emerald-600", icon: CheckCircle2, label: "PASS" },
  running: { tone: "text-sky-600", icon: Loader2, label: "RUNNING" },
  failed: { tone: "text-rose-600", icon: XCircle, label: "FAIL" },
  not_run: { tone: "text-amber-600", icon: MinusCircle, label: "NOT RUN" },
  pending: { tone: "text-muted-foreground", icon: Circle, label: "NOT RUN" },
};

const parse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value || "");
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

// Merges the declared node contracts with what the run actually executed, so a
// stage that never ran is shown as NOT RUN rather than quietly missing.
export default function StageTrace({ nodes = [], run }) {
  const states = parse(run?.node_states_json, []);
  const byId = {};
  for (const state of states) byId[state.id] = state;

  return (
    <div className="space-y-1.5">
      {nodes.map((node) => {
        const state = byId[node.id];
        const status = state?.status || "pending";
        const meta = STATUS[status] || STATUS.pending;
        const Icon = meta.icon;
        return (
          <div key={node.id} className="border border-border rounded-lg px-3 py-2 bg-card">
            <div className="flex items-start gap-2">
              <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", meta.tone, status === "running" && "animate-spin")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{node.label}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{node.type}</Badge>
                  {node.module_id && <Badge variant="secondary" className="text-[10px]">{node.module_id}</Badge>}
                  <span className={cn("text-[10px] font-mono font-semibold ml-auto", meta.tone)}>{meta.label}</span>
                  {state?.duration_ms ? <span className="text-[10px] text-muted-foreground font-mono">{state.duration_ms}ms</span> : null}
                </div>
                {state?.evidence && <p className="text-xs text-muted-foreground mt-1">{state.evidence}</p>}
                {state?.limitation && <p className="text-xs text-amber-300 mt-1">Limitation: {state.limitation}</p>}
                {state?.error && <p className="text-xs text-rose-600 mt-1">{state.error}</p>}
                <p className="text-[10px] text-muted-foreground/80 mt-1">
                  in: {(node.inputs || []).join(", ")} → out: {(node.outputs || []).join(", ")}
                  {node.retry_policy ? ` · retry: ${node.retry_policy}` : ""}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
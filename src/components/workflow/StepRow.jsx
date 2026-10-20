import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Flag, Check, Play, Ban, Paperclip } from "lucide-react";

const STATUS_TONE = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  blocked: "bg-destructive/15 text-destructive",
  ready_for_gate: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const nextStatus = (step) => {
  if (step.status === "not_started" || step.status === "blocked") return "in_progress";
  if (step.status === "in_progress") return step.is_gate ? "ready_for_gate" : "approved";
  if (step.status === "ready_for_gate") return "approved";
  return "in_progress";
};

const labelFor = (step) => {
  if (step.status === "blocked") return "Resume";
  if (step.status === "not_started") return "Start";
  if (step.status === "in_progress") return step.is_gate ? "Send to gate" : "Mark complete";
  if (step.status === "ready_for_gate") return "Approve gate";
  return "Reopen";
};

// One measured step: owner, evidence required, status, and the evidence attached when it closed.
export default function StepRow({ step, index, onAdvance, onBlock, onSaveEvidence, busy }) {
  const [open, setOpen] = useState(false);
  const [evidence, setEvidence] = useState(step.evidence || "");

  return (
    <div className={cn("rounded-lg border bg-card p-3", step.is_gate ? "border-primary/40" : "border-border")}>
      <div className="flex items-start gap-3">
        <span className="w-6 h-6 shrink-0 rounded-full bg-muted text-[11px] font-semibold flex items-center justify-center">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs font-medium leading-snug">{step.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(step.owner_agent || step.owner) && (
                <Badge variant="outline" className="text-[10px]">{step.owner_agent || step.owner}</Badge>
              )}
              {step.is_gate && (
                <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                  <Flag className="w-3 h-3" /> {step.gate_type} gate
                </Badge>
              )}
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full capitalize", STATUS_TONE[step.status])}>
                {step.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {step.evidence_required && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              <span className="uppercase tracking-wide">Evidence needed:</span> {step.evidence_required}
            </p>
          )}
          {step.evidence && !open && (
            <p className="text-[11px] mt-1.5 bg-muted/50 rounded p-2">✓ {step.evidence}</p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={busy} onClick={() => onAdvance(step, nextStatus(step))}>
              <Play className="w-3 h-3 mr-1" /> {labelFor(step)}
            </Button>
            {step.is_gate && step.status === "ready_for_gate" && (
              <Button size="sm" className="h-7 text-[11px]" disabled={busy} onClick={() => onAdvance(step, "approved")}>
                <Check className="w-3 h-3 mr-1" /> Approve now
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" disabled={busy} onClick={() => onBlock(step, step.status === "blocked" ? "not_started" : "blocked")}>
              <Ban className="w-3 h-3 mr-1" /> {step.status === "blocked" ? "Unblock" : "Block"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setOpen((v) => !v)}>
              <Paperclip className="w-3 h-3 mr-1" /> {open ? "Close" : step.evidence ? "Edit evidence" : "Attach evidence"}
            </Button>
          </div>

          {open && (
            <div className="mt-2 space-y-2">
              <Textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={2} placeholder={step.evidence_required || "What proves this step is done."} />
              <Button size="sm" className="h-7 text-[11px]" disabled={busy} onClick={() => { onSaveEvidence(step, evidence); setOpen(false); }}>
                Save evidence
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
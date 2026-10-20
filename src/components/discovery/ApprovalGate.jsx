import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X, ShieldCheck, AlertCircle } from "lucide-react";

// The gate. Nothing moves to build until a named person decides here, with a reason recorded.
export default function ApprovalGate({ report, onApprove, onReject, busy }) {
  const [notes, setNotes] = useState(report?.approval_notes || "");
  if (!report) return null;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-3.5 border-b border-border flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Approval gate
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            The discovery package and the chosen option are locked in here before any build work starts.
          </p>
        </div>
        <Badge
          variant={report.status === "approved" ? "default" : report.status === "rejected" ? "destructive" : "secondary"}
          className="text-[11px] capitalize"
        >
          {report.status}
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {report.status === "generated" ? (
          <>
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Reviewer notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What was agreed, what changes, what is deferred."
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" disabled={busy} onClick={() => onApprove(notes)}>
                <Check className="w-4 h-4 mr-1.5" /> Approve and move to build
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onReject(notes)}>
                <X className="w-4 h-4 mr-1.5" /> Send back for rework
              </Button>
              <span className="text-[11px] text-muted-foreground">
                Approving records who decided and when, for the project audit trail.
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-xs flex items-center gap-2">
              {report.status === "approved"
                ? <><Check className="w-4 h-4 text-emerald-600" /> Approved by {report.approved_by || "the reviewer"}{report.approved_at ? ` on ${new Date(report.approved_at).toLocaleString()}` : ""}.</>
                : <><AlertCircle className="w-4 h-4 text-destructive" /> Sent back for rework{report.approved_by ? ` by ${report.approved_by}` : ""}.</>}
            </p>
            {report.approval_notes && <p className="text-xs text-muted-foreground whitespace-pre-line">{report.approval_notes}</p>}
            {report.status === "rejected" && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onApprove(notes)}>
                <Check className="w-4 h-4 mr-1.5" /> Approve instead
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
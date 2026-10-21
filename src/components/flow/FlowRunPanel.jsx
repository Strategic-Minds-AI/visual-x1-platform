import React from "react";
import { Check, Play, X } from "lucide-react";
import { Panel, PrimaryButton, StatusPill, Empty, ErrorText } from "@/components/admin/adminUi";

// What the last run actually did, step by step. The log is the record: a step that
// failed shows failed with the error the tool returned, and a run that stopped
// early shows where it stopped.
export default function FlowRunPanel({ flow, log, busy, onRun, error, held }) {
  const failed = (log || []).filter((l) => !l.ok);

  return (
    <Panel
      kicker="RUN"
      title={flow ? flow.name : "No flow selected"}
      aside={
        <PrimaryButton disabled={busy || !flow} onClick={onRun}>
          <Play size={13} /> {flow?.requires_approval ? "APPROVE AND RUN" : "RUN THIS FLOW"}
        </PrimaryButton>
      }
    >
      <ErrorText>{error}</ErrorText>

      {held && <p className="cp-fine">Held: {held}</p>}

      {flow?.last_run_at && (
        <p className="cp-fine">
          Last run {new Date(flow.last_run_at).toLocaleString()} · {flow.last_run_status} · {flow.run_count || 0} run(s) total
        </p>
      )}

      {!log?.length ? (
        <Empty>A run records one line per step, in order — including the ones that failed.</Empty>
      ) : (
        <div className="cp-admin-stack" style={{ marginTop: 10 }}>
          <div className="cp-admin-inline-field">
            <StatusPill>{log.length} step(s)</StatusPill>
            {failed.length > 0 && <StatusPill>{failed.length} failed</StatusPill>}
          </div>
          {log.map((line, index) => (
            <div key={index} className="cp-admin-inline-field" style={{ alignItems: "flex-start" }}>
              {line.ok ? <Check size={13} className="text-primary" /> : <X size={13} className="text-destructive" />}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13 }}>{index + 1}. {line.label || line.type}</span>
                <p className="cp-fine">{line.observation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
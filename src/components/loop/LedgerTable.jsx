import React, { useState } from "react";
import { RefreshCw, RotateCcw, ShieldCheck } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton, StatusPill, Empty, ErrorText } from "@/components/admin/adminUi";

// The change ledger as a working surface. Every row shows what was predicted, which
// gates passed, how it is undone and what it actually did — and the three buttons
// that move a row through the loop are the real functions, not summaries of them.
const VERDICT_STYLE = {
  worked: "text-primary",
  harmed: "text-destructive",
  no_effect: "text-muted-foreground",
  insufficient_evidence: "text-muted-foreground",
  pending: "text-muted-foreground",
};

export default function LedgerTable({ rows, busy, onApply, onOutcome, onRevert, onSync, onAudit, error }) {
  const [note, setNote] = useState("");

  return (
    <Panel
      kicker="CHANGE LEDGER"
      title="Every change, its evidence and its verdict"
      aside={
        <div className="cp-admin-actions">
          <PrimaryButton onClick={onSync} disabled={busy}>
            <RefreshCw size={13} /> CLOSE OUTCOMES
          </PrimaryButton>
          <OutlineButton onClick={onAudit} disabled={busy}>
            <ShieldCheck size={13} /> AUDIT THE LOOP
          </OutlineButton>
        </div>
      }
    >
      <ErrorText>{error}</ErrorText>
      {rows.length === 0 ? (
        <Empty>
          No changes recorded yet. The first one is opened for you when you run a change from the Website Self-Edit
          studio, or raised by the proposer below.
        </Empty>
      ) : (
        <div className="cp-admin-stack">
          {rows.map((row) => (
            <div key={row.id} style={{ borderTop: "1px solid hsl(var(--border) / 0.5)", paddingTop: 12 }}>
              <div className="cp-admin-inline-field">
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{row.change_key}</h3>
                  <p className="cp-fine">{row.objective}</p>
                  <p className="cp-fine">
                    {(row.routes || []).join(", ") || "no routes named"} · predicted {row.predicted_metric || "—"}{" "}
                    {row.predicted_delta ? `(${row.predicted_delta > 0 ? "+" : ""}${row.predicted_delta})` : ""} ·{" "}
                    confidence {row.prediction_confidence ?? 0}%
                  </p>
                  <p className="cp-fine">
                    validation {row.validation_score ?? 0} ({row.validation_decision || "not run"}) · qa{" "}
                    {row.qa_score ?? 0} · content {row.content_score ?? 0} · regression{" "}
                    {row.regression_pass === true ? "pass" : row.regression_pass === false ? "FAIL" : "not run"}
                  </p>
                  {row.metric_delta !== undefined && row.metric_delta !== null && (
                    <p className="cp-fine">
                      measured {row.metric_before} → {row.metric_after} (delta {Number(row.metric_delta).toFixed(3)})
                      {row.confounders ? ` · confounders: ${row.confounders}` : ""}
                    </p>
                  )}
                  {row.lesson && <p className="cp-fine">Lesson · {row.lesson}</p>}
                </div>
                <div className="cp-admin-row-buttons">
                  <StatusPill>{row.status}</StatusPill>
                  <span className={VERDICT_STYLE[row.verdict] || "text-muted-foreground"}>
                    <StatusPill>{row.verdict || "pending"}</StatusPill>
                  </span>
                </div>
              </div>

              <div className="cp-admin-inline-field" style={{ marginTop: 8 }}>
                <input
                  className="cp-field"
                  style={{ flex: 1 }}
                  placeholder="Confounder, or the reason for reverting…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="cp-admin-row-buttons">
                  {row.status === "proposed" || row.status === "validated" ? (
                    <OutlineButton
                      disabled={busy}
                      onClick={() =>
                        onApply(row, {
                          snapshot_ref: `snapshot-${row.change_key}-${Date.now()}`,
                          rollback_plan:
                            row.rollback_plan ||
                            `Revert ${row.change_key}: restore ${(row.routes || []).join(", ") || "the affected routes"} from the snapshot taken before this change.`,
                        })
                      }
                    >
                      APPLY WITH ROLLBACK
                    </OutlineButton>
                  ) : null}
                  {row.status === "applied" && (
                    <>
                      <OutlineButton disabled={busy} onClick={() => onOutcome(row, { confounders: note })}>
                        RECORD OUTCOME
                      </OutlineButton>
                      <OutlineButton disabled={busy} onClick={() => onRevert(row, note || "reverted from the console")}>
                        <RotateCcw size={12} /> REVERT
                      </OutlineButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
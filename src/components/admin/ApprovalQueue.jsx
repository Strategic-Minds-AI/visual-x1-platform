import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Panel, PrimaryButton, OutlineButton, ErrorText, StatusPill } from "@/components/admin/adminUi";
import { pipelineError, readRecords, when } from "@/lib/adminPipelines";

// Live release gates. Factory batches awaiting a visual decision and verified
// clones awaiting human acceptance, decided against real records.
export default function ApprovalQueue() {
  const [batches, setBatches] = useState(null);
  const [clones, setClones] = useState(null);
  const [operator, setOperator] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [batchRows, cloneRows] = await Promise.all([
        readRecords("FactoryBatch", { query: { visual_approval: "pending" }, limit: 25 }),
        readRecords("CloneProject", { query: { human_approved: false }, limit: 25 }),
      ]);
      setBatches(batchRows);
      setClones(cloneRows);
    } catch (e) {
      setError(pipelineError(e));
      setBatches([]);
      setClones([]);
    }
  };

  useEffect(() => {
    load();
    base44.auth
      .me()
      .then((me) => setOperator(me?.email || ""))
      .catch(() => setOperator(""));
  }, []);

  const decideBatch = async (batch, decision) => {
    setBusy(batch.id);
    setError("");
    try {
      await base44.entities.FactoryBatch.update(batch.id, {
        visual_approval: decision,
        approved_at: new Date().toISOString(),
        approved_by: operator,
      });
      await load();
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  const acceptClone = async (clone, accepted) => {
    setBusy(clone.id);
    setError("");
    try {
      await base44.entities.CloneProject.update(clone.id, {
        human_approved: accepted,
        approved_by: operator,
        approved_at: new Date().toISOString(),
        status: accepted ? "verified" : "rejected",
      });
      await load();
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  const loading = batches === null || clones === null;

  return (
    <div className="cp-admin-stack">
      <Panel kicker="RELEASE GATES" title="Nothing ships without this decision">
        <p className="cp-panel-note">
          A high score never substitutes for the gate. The operator named on this account is recorded against every
          decision.
        </p>
        <ErrorText>{error}</ErrorText>
      </Panel>

      <Panel kicker="FACTORY BATCHES AWAITING VISUAL APPROVAL">
        {loading ? (
          <p className="cp-empty">Loading…</p>
        ) : batches.length === 0 ? (
          <p className="cp-empty">No batch is waiting on a visual decision.</p>
        ) : (
          <div className="cp-asset-list">
            {batches.map((batch) => (
              <div key={batch.id}>
                <span className="cp-lead-avatar">BATCH</span>
                <div>
                  <h3>{batch.sentence}</h3>
                  <p className="cp-fine">
                    QA {batch.quality_score || 0} · {batch.status} · {when(batch.created_date)}
                  </p>
                </div>
                <div className="cp-admin-row-buttons">
                  <PrimaryButton onClick={() => decideBatch(batch, "approved")} disabled={busy === batch.id}>
                    <Check size={13} /> Approve
                  </PrimaryButton>
                  <OutlineButton onClick={() => decideBatch(batch, "rejected")} disabled={busy === batch.id}>
                    <X size={13} /> Reject
                  </OutlineButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel kicker="CLONES AWAITING HUMAN ACCEPTANCE">
        {loading ? (
          <p className="cp-empty">Loading…</p>
        ) : clones.length === 0 ? (
          <p className="cp-empty">No clone is waiting on acceptance.</p>
        ) : (
          <div className="cp-asset-list">
            {clones.map((clone) => (
              <div key={clone.id}>
                <span className="cp-lead-avatar">{String(clone.source_type || "src").slice(0, 3).toUpperCase()}</span>
                <div>
                  <h3>{clone.name}</h3>
                  <p className="cp-fine">
                    {clone.source_label || clone.source_url || clone.source_type} · {clone.status} · operational{" "}
                    {clone.operational_gate} · visual {clone.visual_gate}
                  </p>
                  <p className="cp-fine">
                    operational {clone.operational_score || 0}% · visual {clone.visual_score || 0}
                  </p>
                </div>
                <div className="cp-admin-row-buttons">
                  <StatusPill>HUMAN GATE</StatusPill>
                  <PrimaryButton onClick={() => acceptClone(clone, true)} disabled={busy === clone.id}>
                    <Check size={13} /> Accept
                  </PrimaryButton>
                  <OutlineButton onClick={() => acceptClone(clone, false)} disabled={busy === clone.id}>
                    <X size={13} /> Reject
                  </OutlineButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
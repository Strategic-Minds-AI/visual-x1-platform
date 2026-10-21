import React, { useCallback, useEffect, useState } from "react";
import { Play, Target } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton, Metric, StatusPill, ErrorText } from "@/components/admin/adminUi";
import ArchitectureChecklist from "@/components/loop/ArchitectureChecklist";
import PromptFoundationPanel from "@/components/loop/PromptFoundationPanel";
import LedgerTable from "@/components/loop/LedgerTable";
import PolicyPanel from "@/components/loop/PolicyPanel";
import RegressionGuards from "@/components/loop/RegressionGuards";
import { LOOP_BLUEPRINT } from "@/data/loopBlueprint";
import {
  applyChange,
  openChange,
  proposeNextChanges,
  readOne,
  readRecords,
  recordOutcome,
  revertChange,
  runLoopAudit,
  syncOutcomes,
} from "@/lib/loopApi";
import { base44 } from "@/api/base44Client";

// The system architecture page: the loop's foundation as a living checklist, the
// prompts those items assemble into, and the ledger that proves the loop closes.
export default function LoopWorkspace() {
  const [policy, setPolicy] = useState(null);
  const [items, setItems] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [guards, setGuards] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [audit, setAudit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [policyRow, itemRows, ledgerRows, guardRows] = await Promise.all([
        readOne("AutonomyPolicy", { is_active: true }),
        readRecords("ArchitectureItem", { limit: 80, sort: "display_order" }),
        readRecords("ChangeLedger", { limit: 40, sort: "-updated_date" }),
        readRecords("RegressionGuard", { limit: 80 }),
      ]);
      setPolicy(policyRow);
      setItems(itemRows);
      setLedger(ledgerRows);
      setGuards(guardRows);
    } catch (e) {
      setError(e?.message || "Could not read the loop's records.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (label, fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(`${label} failed: ${e?.message || "unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  const seedChecklist = () =>
    run("Seeding", async () => {
      const existing = new Set(items.map((i) => i.key));
      const missing = LOOP_BLUEPRINT.filter((b) => !existing.has(b.key));
      await base44.entities.ArchitectureItem.bulkCreate(
        missing.map((b) => ({
          key: b.key,
          title: b.title,
          layer: b.layer,
          requirement: b.requirement,
          prompt_block: b.prompt_block,
          command_prompt: b.command_prompt,
          owner_agent: b.owner_agent,
          dependencies: b.dependencies,
          display_order: b.display_order,
          status: "planned",
        }))
      );
    });

  const updateItem = (item, patch) =>
    run("Updating the item", () => base44.entities.ArchitectureItem.update(item.id, patch));

  const savePolicy = (payload) =>
    run("Saving the policy", () =>
      policy?.id ? base44.entities.AutonomyPolicy.update(policy.id, payload) : base44.entities.AutonomyPolicy.create(payload)
    );

  const liveItems = items.filter((i) => ["live", "verified"].includes(i.status)).length;
  const applied = ledger.filter((l) => l.status === "applied");
  const closed = ledger.filter((l) => l.verdict && l.verdict !== "pending");

  return (
    <div className="cp-admin-stack">
      <div className="cp-metrics">
        <Metric label="Loop items live" value={`${liveItems}/${LOOP_BLUEPRINT.length}`} foot="Foundation in place" accent />
        <Metric label="Changes applied" value={String(applied.length)} foot={`${closed.length} with a verdict`} />
        <Metric label="Guards armed" value={String(guards.filter((g) => g.status === "armed").length)} foot="Regression corpus" />
        <Metric
          label="Autonomy"
          value={(policy?.autonomy_level || "L1_stage").replace("_", " ")}
          foot={policy?.kill_switch ? "Kill switch ON" : `Budget ${policy?.daily_change_budget ?? 5}/day`}
        />
      </div>

      <ErrorText>{error}</ErrorText>

      <Panel
        kicker="THE LOOP ITSELF"
        title="Close it, then let it run"
        aside={
          <div className="cp-admin-actions">
            <PrimaryButton disabled={busy} onClick={() => run("The proposer", proposeNextChanges)}>
              <Target size={13} /> PROPOSE NEXT CHANGES
            </PrimaryButton>
            <OutlineButton disabled={busy} onClick={() => run("The loop audit", async () => setAudit(await runLoopAudit()))}>
              <Play size={13} /> RUN THE LOOP AUDIT
            </OutlineButton>
          </div>
        }
      >
        <p className="cp-fine">
          The proposer reads the policy's targets against the measured metrics and writes the backlog. The audit checks
          the loop is actually closed — outcomes recorded, gates fired, guards run, budget honoured.
        </p>

        {audit && (
          <div className="cp-admin-stack" style={{ marginTop: 12 }}>
            <div className="cp-admin-inline-field">
              <StatusPill>{audit.overall_score}/100</StatusPill>
              <p className="cp-fine" style={{ flex: 1 }}>{audit.verdict}</p>
            </div>
            {audit.checks?.map((check) => (
              <div key={check.id} className="cp-admin-inline-field">
                <StatusPill>{check.result}</StatusPill>
                <p className="cp-fine" style={{ flex: 1 }}>
                  {check.label} — expected {check.expected}, found {check.found}
                  {check.evidence ? ` (${check.evidence})` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <ArchitectureChecklist items={items} onSeed={seedChecklist} onUpdate={updateItem} error={error} />

      <PromptFoundationPanel
        policy={policy}
        metrics={metrics}
        ledger={ledger}
        guards={guards}
        change={{ change_key: "the change you are describing", routes: [], capability_ids: [] }}
        items={items}
      />

      <LedgerTable
        rows={ledger}
        busy={busy}
        error={error}
        onSync={() => run("Closing outcomes", async () => setMetrics((await syncOutcomes())?.measured || []))}
        onAudit={() => run("The loop audit", async () => setAudit(await runLoopAudit()))}
        onApply={(row, payload) => run("Applying", () => applyChange(row.id, payload))}
        onOutcome={(row, payload) =>
          run("Recording the outcome", () =>
            recordOutcome(row.id, {
              metric: row.predicted_metric,
              metric_before: row.metric_before,
              metric_after: row.metric_after ?? row.metric_before,
              confounders: payload.confounders,
            })
          )
        }
        onRevert={(row, reason) => run("Reverting", () => revertChange(row.id, reason))}
      />

      <RegressionGuards
        guards={guards}
        busy={busy}
        error={error}
        onAdd={(guard) => run("Arming the guard", () => base44.entities.RegressionGuard.create(guard))}
        onRetire={(guard) => run("Retiring the guard", () => base44.entities.RegressionGuard.update(guard.id, { status: "retired" }))}
      />

      <PolicyPanel policy={policy} busy={busy} onSave={savePolicy} error={error} />
    </div>
  );
}
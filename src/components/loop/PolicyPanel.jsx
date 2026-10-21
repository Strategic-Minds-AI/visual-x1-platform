import React, { useState } from "react";
import { Save, Zap } from "lucide-react";
import { Panel, PrimaryButton, Empty, ErrorText } from "@/components/admin/adminUi";
import { Switch } from "@/components/ui/switch";

// The governance surface. Autonomy level, blast radius, budgets, targets, the kill
// switch and the operator's phone channel all live on one policy record that the
// loop reads before it acts — so what the system may do is a setting, not a guess.
const LEVELS = [
  ["L0_propose", "L0 — propose only"],
  ["L1_stage", "L1 — edit a staged copy"],
  ["L2_apply_with_rollback", "L2 — apply with rollback armed"],
  ["L3_autonomous", "L3 — autonomous inside the budget"],
];

export default function PolicyPanel({ policy, busy, onSave, error }) {
  const [form, setForm] = useState(policy || null);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  if (!form) {
    return (
      <Panel kicker="GOVERNANCE" title="Operating policy">
        <Empty>
          No policy set, so the loop is running on conservative defaults: propose-only, five changes a day, no targets.
          Create the policy to decide what it may actually do.
        </Empty>
        <PrimaryButton
          style={{ marginTop: 12 }}
          disabled={busy}
          onClick={() =>
            onSave({
              name: "Visual X operating policy",
              is_active: true,
              objective_kind: "balanced",
              autonomy_level: "L1_stage",
              daily_change_budget: 5,
              max_routes_per_change: 3,
              budget_credits_per_cycle: 250,
              anomaly_pause: true,
              kill_switch: false,
              forbidden_paths: [],
              metric_targets_json: '[\n  {"metric":"conversion_rate","comparator":"gte","target":2.5,"window_days":28}\n]',
              non_negotiables: "Never break a working flow.\nNever fabricate proof.\nNever publish a failing validation.",
            })
          }
        >
          <Zap size={13} /> CREATE THE POLICY
        </PrimaryButton>
      </Panel>
    );
  }

  return (
    <Panel
      kicker="GOVERNANCE"
      title="Operating policy"
      aside={
        <PrimaryButton disabled={busy} onClick={() => onSave(form)}>
          <Save size={13} /> SAVE POLICY
        </PrimaryButton>
      }
    >
      <div className="cp-admin-grid">
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Objective</span>
          <select className="cp-field" value={form.objective_kind || "balanced"} onChange={(e) => set("objective_kind", e.target.value)}>
            {["leads", "revenue", "traffic", "authority", "automation", "balanced"].map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Autonomy level</span>
          <select className="cp-field" value={form.autonomy_level || "L1_stage"} onChange={(e) => set("autonomy_level", e.target.value)}>
            {LEVELS.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Changes per day</span>
          <input type="number" className="cp-field" value={form.daily_change_budget ?? 5} onChange={(e) => set("daily_change_budget", Number(e.target.value))} />
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Max routes per change</span>
          <input type="number" className="cp-field" value={form.max_routes_per_change ?? 3} onChange={(e) => set("max_routes_per_change", Number(e.target.value))} />
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Credits per cycle</span>
          <input type="number" className="cp-field" value={form.budget_credits_per_cycle ?? 250} onChange={(e) => set("budget_credits_per_cycle", Number(e.target.value))} />
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Forbidden paths</span>
          <input
            className="cp-field"
            placeholder="/checkout, /account, /legal"
            value={(form.forbidden_paths || []).join(", ")}
            onChange={(e) => set("forbidden_paths", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          />
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Mobile number</span>
          <input className="cp-field" placeholder="+1…" value={form.mobile_number || ""} onChange={(e) => set("mobile_number", e.target.value)} />
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Phone channel</span>
          <select className="cp-field" value={form.channel || "none"} onChange={(e) => set("channel", e.target.value)}>
            {["none", "whatsapp", "telegram", "sms"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Kill switch</span>
          <Switch checked={form.kill_switch === true} onCheckedChange={(v) => set("kill_switch", v)} />
        </label>

        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 150 }}>Anomaly pause</span>
          <Switch checked={form.anomaly_pause !== false} onCheckedChange={(v) => set("anomaly_pause", v)} />
        </label>
      </div>

      <ErrorText>{error}</ErrorText>

      <label className="cp-fine" style={{ display: "block", marginTop: 12 }}>Metric targets (JSON)</label>
      <textarea
        className="cp-field"
        rows={5}
        style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11 }}
        value={form.metric_targets_json || ""}
        onChange={(e) => set("metric_targets_json", e.target.value)}
      />

      <label className="cp-fine" style={{ display: "block", marginTop: 12 }}>Non-negotiables, one per line</label>
      <textarea className="cp-field" rows={4} style={{ width: "100%" }} value={form.non_negotiables || ""} onChange={(e) => set("non_negotiables", e.target.value)} />

      <label className="cp-fine" style={{ display: "block", marginTop: 12 }}>Stop conditions, one per line</label>
      <textarea className="cp-field" rows={3} style={{ width: "100%" }} value={form.stop_conditions || ""} onChange={(e) => set("stop_conditions", e.target.value)} />
    </Panel>
  );
}
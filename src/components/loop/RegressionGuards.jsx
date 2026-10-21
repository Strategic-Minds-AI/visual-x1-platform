import React, { useState } from "react";
import { Plus, ShieldAlert } from "lucide-react";
import { Panel, PrimaryButton, StatusPill, Empty, ErrorText } from "@/components/admin/adminUi";

// The regression corpus: what must never break again. A guard is raised from a
// defect and stays armed, so a later change cannot quietly reintroduce it.
export default function RegressionGuards({ guards, busy, onAdd, onRetire, error }) {
  const [form, setForm] = useState({ guard_key: "", title: "", check_spec: "", severity: "high", routes: "" });

  const submit = () => {
    if (!form.guard_key || !form.title) return;
    onAdd({
      guard_key: form.guard_key.trim(),
      title: form.title.trim(),
      detail: form.check_spec.trim(),
      check_kind: "assertion",
      check_spec: form.check_spec.trim(),
      severity: form.severity,
      routes: form.routes.split(",").map((s) => s.trim()).filter(Boolean),
      status: "armed",
      last_result: "not_run",
      owner_agent: "Self-Healing Engineer",
    });
    setForm({ guard_key: "", title: "", check_spec: "", severity: "high", routes: "" });
  };

  const armed = guards.filter((g) => g.status === "armed");

  return (
    <Panel
      kicker="REGRESSION CORPUS"
      title="What must never break again"
      aside={
        <span className="cp-fine">
          {armed.length} armed · {armed.filter((g) => g.severity === "blocking").length} blocking
        </span>
      }
    >
      <ErrorText>{error}</ErrorText>

      <div className="cp-admin-inline-field">
        <input className="cp-field" placeholder="guard-key" value={form.guard_key} onChange={(e) => setForm({ ...form, guard_key: e.target.value })} />
        <input className="cp-field" style={{ flex: 1 }} placeholder="What must never break" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="cp-field" style={{ flex: 1 }} placeholder="The check: what is measured, against what" value={form.check_spec} onChange={(e) => setForm({ ...form, check_spec: e.target.value })} />
        <select className="cp-field" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
          {["blocking", "high", "medium", "low"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input className="cp-field" placeholder="routes (comma separated, blank = all)" value={form.routes} onChange={(e) => setForm({ ...form, routes: e.target.value })} />
        <PrimaryButton disabled={busy} onClick={submit}>
          <Plus size={13} /> ARM A GUARD
        </PrimaryButton>
      </div>

      {guards.length === 0 ? (
        <Empty>
          No guards yet. Each defect the system repairs should leave one behind — that is what stops the same break
          coming back through a later change.
        </Empty>
      ) : (
        <div className="cp-admin-stack" style={{ marginTop: 14 }}>
          {guards.map((guard) => (
            <div key={guard.id} className="cp-admin-inline-field">
              <ShieldAlert size={14} className={guard.severity === "blocking" ? "text-destructive" : "text-muted-foreground"} />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>{guard.title}</h3>
                <p className="cp-fine">
                  {guard.guard_key} · {guard.check_kind} · {(guard.routes || []).join(", ") || "all routes"} · last{" "}
                  {guard.last_result || "not run"}
                  {guard.last_checked_at ? ` (${new Date(guard.last_checked_at).toLocaleDateString()})` : ""}
                </p>
                {guard.check_spec && <p className="cp-fine">{guard.check_spec}</p>}
              </div>
              <div className="cp-admin-row-buttons">
                <StatusPill>{guard.severity}</StatusPill>
                <StatusPill>{guard.status}</StatusPill>
                {guard.status === "armed" && (
                  <button className="cp-text-link" disabled={busy} onClick={() => onRetire(guard)}>
                    RETIRE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
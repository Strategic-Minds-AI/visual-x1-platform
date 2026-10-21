import React, { useState } from "react";
import { Send } from "lucide-react";
import { Panel, PrimaryButton, StatusPill, ErrorText } from "@/components/admin/adminUi";
import { assignTask } from "@/lib/loopApi";

// The assignment system. One form creates the work, mirrors it to the todo board and
// pushes it to the operator's own systems — and it reports which pushes actually
// landed, with a hint when a connector simply is not consented yet.
const WORK_TYPES = ["audit", "repair", "build", "content", "social", "funnel", "research", "monitor"];
const CHANNELS = ["tasks", "calendar", "gmail"];

export default function TaskAssignForm({ agents, busy, setBusy }) {
  const [form, setForm] = useState({
    title: "",
    detail: "",
    work_type: "build",
    assigned_agent: agents[0]?.name || "X1 Orchestrator",
    priority: "medium",
    due_hours: 48,
    channels: ["tasks"],
    drive_ref: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await assignTask({ ...form, due_hours: Number(form.due_hours) }));
    } catch (e) {
      setError(e?.message || "The assignment could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const toggleChannel = (channel) =>
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(channel) ? f.channels.filter((c) => c !== channel) : [...f.channels, channel],
    }));

  return (
    <Panel
      kicker="ASSIGNMENT"
      title="Hand work to an agent"
      aside={<PrimaryButton disabled={busy || !form.title.trim()} onClick={submit}><Send size={13} /> ASSIGN</PrimaryButton>}
    >
      <ErrorText>{error}</ErrorText>

      <div className="cp-admin-grid">
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 110 }}>Title</span>
          <input className="cp-field" style={{ flex: 1 }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 110 }}>Work type</span>
          <select className="cp-field" value={form.work_type} onChange={(e) => setForm({ ...form, work_type: e.target.value })}>
            {WORK_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 110 }}>Agent</span>
          <select className="cp-field" value={form.assigned_agent} onChange={(e) => setForm({ ...form, assigned_agent: e.target.value })}>
            {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            <option value="X1 Orchestrator">X1 Orchestrator</option>
          </select>
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 110 }}>Priority</span>
          <select className="cp-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {["critical", "high", "medium", "low"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 110 }}>Due in (hours)</span>
          <input type="number" className="cp-field" value={form.due_hours} onChange={(e) => setForm({ ...form, due_hours: e.target.value })} />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 110 }}>Drive reference</span>
          <input
            className="cp-field"
            style={{ flex: 1 }}
            placeholder="link to the brief in Drive (read-only access is what this app holds)"
            value={form.drive_ref}
            onChange={(e) => setForm({ ...form, drive_ref: e.target.value })}
          />
        </label>
      </div>

      <div className="cp-admin-inline-field" style={{ marginTop: 8 }}>
        <span className="cp-fine" style={{ minWidth: 110 }}>Push to</span>
        {CHANNELS.map((c) => (
          <button key={c} type="button" onClick={() => toggleChannel(c)} className={`ve-pill ${form.channels.includes(c) ? "selected" : ""}`}>
            {c === "tasks" ? "Google Tasks" : c === "calendar" ? "Google Calendar" : "Email"}
          </button>
        ))}
      </div>

      <label className="cp-fine" style={{ display: "block", marginTop: 10 }}>Detail</label>
      <textarea className="cp-field" rows={3} style={{ width: "100%" }} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />

      {result && (
        <div className="cp-admin-stack" style={{ marginTop: 12 }}>
          <div className="cp-admin-inline-field">
            <StatusPill>{result.assignment_id ? "created" : "not created"}</StatusPill>
            <p className="cp-fine" style={{ flex: 1 }}>
              Pushed to {result.channels?.length ? result.channels.join(", ") : "no external system"}
            </p>
          </div>
          {Object.entries(result.external || {}).map(([channel, outcome]) => (
            <div key={channel} className="cp-admin-inline-field">
              <StatusPill>{outcome.ok ? "pushed" : "failed"}</StatusPill>
              <p className="cp-fine" style={{ flex: 1 }}>
                {channel}: {outcome.ok ? outcome.id || "ok" : outcome.error}
                {outcome.hint ? ` — ${outcome.hint}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="cp-fine" style={{ marginTop: 10 }}>
        Google Drive is connected read-only, so this system can read a brief you point it at but cannot create files
        there.
      </p>
    </Panel>
  );
}
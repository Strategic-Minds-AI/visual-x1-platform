import React, { useState } from "react";
import { Save, UserPlus } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton, ErrorText } from "@/components/admin/adminUi";
import { Switch } from "@/components/ui/switch";
import { ACCESS_LEVELS, AUTONOMY_LEVELS } from "@/data/agentCatalog";

// The agent builder. It writes a registry row — the agent's identity, skills, jobs,
// access level, autonomy, tools, connectors, memory scope and channel — which is
// what the dispatcher and the flow designer read when they hand work out.
const blank = () => ({
  name: "",
  role: "specialist",
  specialization: "",
  access_level: "read",
  autonomy_level: "L0_propose",
  skills: [],
  jobs_owned: [],
  tools: [],
  connectors: [],
  vault_access: false,
  memory_scope: [],
  channel: "console",
  model: "automatic",
  reports_to: "X1 Orchestrator",
  system_prompt: "",
  avatar_color: "#66ff9c",
});

const list = (value) => String(value || "").split(",").map((s) => s.trim()).filter(Boolean);

export default function AgentBuilderForm({ editing, busy, onSave, onCancel, error }) {
  const [form, setForm] = useState(editing ? { ...editing, skills: editing.skills || [], tools: editing.tools || [] } : blank());
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Panel
      kicker={editing ? "EDIT AGENT" : "AGENT BUILDER"}
      title={editing ? editing.name : "Register a new agent"}
      aside={
        <div className="cp-admin-actions">
          {editing && <OutlineButton onClick={onCancel}>CANCEL</OutlineButton>}
          <PrimaryButton disabled={busy || !form.name} onClick={() => onSave(form)}>
            <Save size={13} /> {editing ? "SAVE AGENT" : "REGISTER AGENT"}
          </PrimaryButton>
        </div>
      }
    >
      <ErrorText>{error}</ErrorText>

      <div className="cp-admin-grid">
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Name</span>
          <input className="cp-field" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Role</span>
          <select className="cp-field" value={form.role} onChange={(e) => set("role", e.target.value)}>
            {["coordinator", "executor", "reviewer", "researcher", "planner", "memory_keeper", "specialist", "guardian"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Specialization</span>
          <input className="cp-field" value={form.specialization} onChange={(e) => set("specialization", e.target.value)} />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Access level</span>
          <select className="cp-field" value={form.access_level} onChange={(e) => set("access_level", e.target.value)}>
            {ACCESS_LEVELS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Autonomy</span>
          <select className="cp-field" value={form.autonomy_level} onChange={(e) => set("autonomy_level", e.target.value)}>
            {AUTONOMY_LEVELS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Jobs owned</span>
          <input
            className="cp-field"
            placeholder="build, content, monitor"
            value={(form.jobs_owned || []).join(", ")}
            onChange={(e) => set("jobs_owned", list(e.target.value))}
          />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Skills</span>
          <input className="cp-field" value={(form.skills || []).join(", ")} onChange={(e) => set("skills", list(e.target.value))} />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Tools</span>
          <input
            className="cp-field"
            placeholder="backend function names"
            value={(form.tools || []).join(", ")}
            onChange={(e) => set("tools", list(e.target.value))}
          />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Connectors</span>
          <input
            className="cp-field"
            placeholder="github, supabase, googlecalendar"
            value={(form.connectors || []).join(", ")}
            onChange={(e) => set("connectors", list(e.target.value))}
          />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Memory scope</span>
          <input
            className="cp-field"
            placeholder="ChangeLedger, Memory, Knowledge"
            value={(form.memory_scope || []).join(", ")}
            onChange={(e) => set("memory_scope", list(e.target.value))}
          />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Reports to</span>
          <input className="cp-field" value={form.reports_to || ""} onChange={(e) => set("reports_to", e.target.value)} />
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Channel</span>
          <select className="cp-field" value={form.channel || "console"} onChange={(e) => set("channel", e.target.value)}>
            {["console", "whatsapp", "telegram", "line", "none"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
          <span className="cp-fine" style={{ minWidth: 130 }}>Vault access</span>
          <Switch checked={form.vault_access === true} onCheckedChange={(v) => set("vault_access", v)} />
        </label>
      </div>

      <label className="cp-fine" style={{ display: "block", marginTop: 12 }}>Standing instructions</label>
      <textarea
        className="cp-field"
        rows={4}
        style={{ width: "100%" }}
        value={form.system_prompt || ""}
        onChange={(e) => set("system_prompt", e.target.value)}
      />
      <p className="cp-fine">
        <UserPlus size={12} className="inline" /> The registry row records the agent's identity and scope. The in-app
        agent that actually works is configured in the platform's agent file, and this row is what the dispatcher reads.
      </p>
    </Panel>
  );
}
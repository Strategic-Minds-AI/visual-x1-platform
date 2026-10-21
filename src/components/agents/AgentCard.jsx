import React from "react";
import { ShieldCheck } from "lucide-react";
import { StatusPill } from "@/components/admin/adminUi";

// One agent's registry row: what it is called, what it can do, what it owns, how far
// it may act, which systems it reaches, and who it answers to. Access level and
// autonomy are shown together because either one alone is misleading.
export default function AgentCard({ agent, onEdit }) {
  return (
    <div className="cp-admin-inline-field" style={{ alignItems: "flex-start" }}>
      <span
        className="cp-lead-avatar"
        style={{ background: agent.avatar_color || "#6366f1", color: "#02050d" }}
      >
        {(agent.name || "A").slice(0, 2).toUpperCase()}
      </span>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0 }}>
          {agent.name} {agent.veto_power && <ShieldCheck size={12} className="inline text-primary" />}
        </h3>
        <p className="cp-fine">{agent.specialization}</p>
        <p className="cp-fine">
          Skills · {(agent.skills || []).join(", ") || "none recorded"}
        </p>
        <p className="cp-fine">
          Owns · {(agent.jobs_owned || []).join(", ") || "nothing yet"} ·{" "}
          {agent.reports_to ? `reports to ${agent.reports_to}` : "reports to the operator"}
        </p>
        <p className="cp-fine">
          Tools · {(agent.tools || []).slice(0, 6).join(", ") || "none"}
          {(agent.tools || []).length > 6 ? ` +${agent.tools.length - 6}` : ""}
        </p>
        <p className="cp-fine">
          Reaches · {(agent.connectors || []).join(", ") || "no connectors"}
          {agent.vault_access ? " · vault access" : ""}
          {agent.channel ? ` · ${agent.channel}` : ""}
        </p>
      </div>
      <div className="cp-admin-row-buttons">
        <StatusPill>{agent.access_level || "read"}</StatusPill>
        <StatusPill>{(agent.autonomy_level || "L0_propose").replace("L", "L ")}</StatusPill>
        <StatusPill>{agent.status || "idle"}</StatusPill>
        {onEdit && <button className="cp-text-link" onClick={() => onEdit(agent)}>EDIT</button>}
      </div>
    </div>
  );
}
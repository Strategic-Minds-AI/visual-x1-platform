import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { DASHBOARD_SECTIONS } from "./dashboardNav";
import "@/styles/x1-dashboard.css";
import PanelOverview from "./panels/PanelOverview";
import PanelUsers from "./panels/PanelUsers";
import PanelData from "./panels/PanelData";
import PanelAnalytics from "./panels/PanelAnalytics";
import PanelMarketing from "./panels/PanelMarketing";
import PanelDomains from "./panels/PanelDomains";
import PanelIntegrations from "./panels/PanelIntegrations";
import PanelSecurity from "./panels/PanelSecurity";
import PanelCode from "./panels/PanelCode";
import PanelAgents from "./panels/PanelAgents";
import PanelWorkflows from "./panels/PanelWorkflows";
import PanelEmails from "./panels/PanelEmails";
import PanelLogs from "./panels/PanelLogs";
import PanelApi from "./panels/PanelApi";
import PanelSettings from "./panels/PanelSettings";
import PanelMcp from "./panels/PanelMcp";
import PanelSecrets from "./panels/PanelSecrets";

const PANELS = {
  overview: PanelOverview,
  users: PanelUsers,
  data: PanelData,
  analytics: PanelAnalytics,
  marketing: PanelMarketing,
  domains: PanelDomains,
  integrations: PanelIntegrations,
  security: PanelSecurity,
  code: PanelCode,
  agents: PanelAgents,
  workflows: PanelWorkflows,
  emails: PanelEmails,
  logs: PanelLogs,
  api: PanelApi,
  settings: PanelSettings,
  mcp: PanelMcp,
  secrets: PanelSecrets,
};

/**
 * This project's dashboard, opened from the editor's own bar: its menu down the left
 * and the selected section's page beside it. The scope is the project being worked on
 * in the editor — the artifact on the canvas and the records carrying its name — not
 * the operator console's sections. Selecting a section swaps the page beside the menu;
 * the chat panel and this project stay exactly where they were.
 */
export default function ProjectDashboard({ ctx, section, onSection, onClose }) {
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? DASHBOARD_SECTIONS.filter((s) => s.label.toLowerCase().includes(q)) : DASHBOARD_SECTIONS;
  }, [query]);

  const Panel = PANELS[section] || PanelOverview;
  const current = DASHBOARD_SECTIONS.find((s) => s.id === section);

  return (
    <div className="ve-dash">
      <aside className="ve-dash-nav" aria-label="Project dashboard">
        <div className="ve-dash-brand">
          <span className="ve-dash-title">PROJECT DASHBOARD</span>
          <button className="ve-icon-btn" onClick={onClose} title="Close the dashboard" aria-label="Close the dashboard">
            <X size={14} />
          </button>
        </div>

        <label className="ve-dash-search">
          <Search size={13} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search the dashboard"
          />
        </label>

        <nav className="ve-dash-list">
          {items.map(({ id, label, Icon, isNew, blurb }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSection(id)}
              className={`ve-dash-item${section === id ? " is-active" : ""}`}
              aria-current={section === id ? "page" : undefined}
              title={blurb}
            >
              <Icon size={15} />
              <span>{label}</span>
              {isNew && <em>New</em>}
            </button>
          ))}
          {items.length === 0 && <p className="ve-dash-none">Nothing matches “{query}”.</p>}
        </nav>

        <p className="ve-dash-scope">{current ? current.blurb : "This project only"}</p>
      </aside>

      <div className="ve-dash-body">
        <Panel ctx={ctx} onSection={onSection} />
      </div>
    </div>
  );
}
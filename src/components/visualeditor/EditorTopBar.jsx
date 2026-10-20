import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, LayoutDashboard, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import ModuleHub from "@/components/admin/ModuleHub";

// The package's builder header: the Dashboard button, the project and the composer
// panel toggle on the left, the module launcher on the right — in console pill
// styling. Every control here does something: Dashboard returns to the console's
// command deck and MODULES opens every Visual X module. The canvas tools — the view
// switch, the device frames, refresh — sit in the editor's own bottom bar, which is
// where the Windows-style taskbar of the workspace belongs.
export default function EditorTopBar({ projectName, panelCollapsed, onTogglePanel }) {
  const [hubOpen, setHubOpen] = useState(false);

  return (
    <>
      <header className="ve-topbar">
        <div className="ve-topbar-left">
          <Link className="ve-pill ve-dash" to="/admin?section=overview" title="Dashboard — the console command deck">
            <LayoutDashboard size={13} />
            <span className="ve-pill-label">DASHBOARD</span>
          </Link>
          <span className="ve-mark" aria-hidden="true">V</span>
          <span className="ve-project" title={projectName}>{projectName}</span>
          <button
            className="ve-icon-btn"
            onClick={onTogglePanel}
            title={panelCollapsed ? "Show the composer panel" : "Hide the composer panel"}
            aria-pressed={!panelCollapsed}
          >
            {panelCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        <div className="ve-topbar-right">
          <button className="ve-pill ve-dash" type="button" onClick={() => setHubOpen(true)} title="Every Visual X module">
            <Boxes size={13} />
            <span className="ve-pill-label">MODULES</span>
          </button>
        </div>
      </header>

      <ModuleHub open={hubOpen} onOpenChange={setHubOpen} />
    </>
  );
}
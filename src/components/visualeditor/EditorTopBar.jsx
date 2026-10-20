import React, { useState } from "react";
import { Boxes, LayoutDashboard, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import ModuleHub from "@/components/admin/ModuleHub";
import { CANVAS_VIEWS } from "@/components/visualeditor/editorNav";

// The package's builder header: the project's own mark and name and the composer
// panel toggle on the left; the canvas views, this project's dashboard and the module
// launcher on the right. The dashboard button sits immediately right of the views, as
// the reference layout places it, and is deliberately the largest control on the bar —
// it is the way into everything the project can be managed by.
export default function EditorTopBar({
  projectName,
  panelCollapsed,
  onTogglePanel,
  canvasView,
  onCanvas,
  dashboardOpen,
  onToggleDashboard,
}) {
  const [hubOpen, setHubOpen] = useState(false);

  return (
    <>
      <header className="ve-topbar">
        <div className="ve-topbar-left">
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
          <div className="ve-pill-group" role="group" aria-label="Canvas view">
            {CANVAS_VIEWS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onCanvas(id)}
                className={`ve-pill${!dashboardOpen && canvasView === id ? " selected" : ""}`}
                aria-pressed={!dashboardOpen && canvasView === id}
                title={label}
              >
                <Icon size={14} />
                <span className="ve-pill-label">{label.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`ve-dash-btn${dashboardOpen ? " is-open" : ""}`}
            onClick={onToggleDashboard}
            aria-pressed={dashboardOpen}
            title="This project's dashboard — data, code, agents, logs and the rest"
          >
            <LayoutDashboard size={15} />
            <span>DASHBOARD</span>
          </button>

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
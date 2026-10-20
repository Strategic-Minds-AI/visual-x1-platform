import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, LayoutDashboard, Monitor, PanelLeftClose, PanelLeftOpen, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { CANVAS_VIEWS } from "@/components/visualeditor/editorNav";
import ModuleHub from "@/components/admin/ModuleHub";

const DEVICES = [
  { id: "desktop", label: "Desktop preview", Icon: Monitor },
  { id: "tablet", label: "Tablet preview", Icon: Tablet },
  { id: "mobile", label: "Phone preview", Icon: Smartphone },
];

// The package's builder header: the Dashboard button and the project on the left,
// the canvas view switch in the middle, the module launcher, refresh and the device
// frames on the right — in console pill styling. Every control here does something:
// Dashboard returns to the console's command deck, MODULES opens every Visual X
// module, and the rest drive the canvas.
export default function EditorTopBar({ projectName, canvasView, device, panelCollapsed, onCanvas, onDevice, onRefresh, onTogglePanel }) {
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

        <div className="ve-topbar-center">
          <div className="ve-pill-group" role="group" aria-label="Canvas view">
            {CANVAS_VIEWS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onCanvas(id)}
                className={`ve-pill${canvasView === id ? " selected" : ""}`}
                aria-pressed={canvasView === id}
              >
                <Icon size={13} />
                <span className="ve-pill-label">{label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ve-topbar-right">
          <button className="ve-pill ve-dash" type="button" onClick={() => setHubOpen(true)} title="Every Visual X module">
            <Boxes size={13} />
            <span className="ve-pill-label">MODULES</span>
          </button>
          <button className="ve-icon-btn" onClick={onRefresh} title="Refresh the canvas">
            <RefreshCw size={15} />
          </button>
          <div className="ve-devices" role="group" aria-label="Preview device">
            {DEVICES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onDevice(id)}
                title={label}
                aria-label={label}
                aria-pressed={device === id}
                className={device === id ? "selected" : ""}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </header>

      <ModuleHub open={hubOpen} onOpenChange={setHubOpen} />
    </>
  );
}
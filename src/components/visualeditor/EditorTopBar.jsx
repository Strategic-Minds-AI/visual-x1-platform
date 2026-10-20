import React, { useState } from "react";
import { Boxes, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import ModuleHub from "@/components/admin/ModuleHub";

// The package's builder header: the project's own mark and name and the composer
// panel toggle on the left, the module launcher on the right — in console pill
// styling. The way back to the console's command deck sits at the top right of the
// chat panel, with the rest of the chat's own controls; the editor's tools sit in
// the toolbar directly over the editor screen, and the canvas views in the bottom bar.
export default function EditorTopBar({ projectName, panelCollapsed, onTogglePanel }) {
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
import React, { useState } from "react";
import { ExternalLink, Eye } from "lucide-react";

const FRAME_CLASS = {
  desktop: "ve-frame",
  tablet: "ve-frame ve-frame-tablet",
  mobile: "ve-frame ve-frame-mobile",
};

// The package's preview frame: a state strip (project, PREVIEW/BUILDING, open) over
// the rendered artifact, sized to the chosen device. Keyed on refresh so a rebuild
// re-mounts the document.
export default function EditorCanvas({ device, previewHtml, projectName, isRunning, refreshTick = 0 }) {
  const [shotKey, setShotKey] = useState(0);

  const open = () => {
    const url = URL.createObjectURL(new Blob([previewHtml], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const state = !previewHtml ? "NO ARTIFACT" : isRunning ? "BUILDING" : "PREVIEW";

  return (
    <div className="ve-frame-area">
      <div className="ve-frame-bar">
        <span className="ve-frame-project">{projectName}</span>
        <span className={`ve-status${isRunning && previewHtml ? " is-busy" : ""}`}>
          <i />
          {state}
        </span>
        <button className="cp-outline" type="button" onClick={open} disabled={!previewHtml}>
          <ExternalLink size={12} />
          OPEN
        </button>
      </div>

      <div className="ve-frame-body">
        {previewHtml ? (
          <div className={FRAME_CLASS[device] || "ve-frame"}>
            <iframe
              key={`${refreshTick}-${shotKey}`}
              srcDoc={previewHtml}
              title="Rendered artifact"
              sandbox="allow-scripts"
            />
          </div>
        ) : (
          <div className="ve-empty">
            <Eye size={26} />
            <p>Describe what to build and press Build in the chat panel, or tap a suggestion. The rendered artifact appears here in the device frame you choose.</p>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Eye, X } from "lucide-react";

const FRAME_CLASS = {
  desktop: "ve-frame",
  tablet: "ve-frame ve-frame-tablet",
  mobile: "ve-frame ve-frame-mobile",
};

// Every generated HTML artifact is untrusted. Both inline and expanded previews
// must run as opaque-origin sandboxed documents, never as same-origin Blob tabs.
export default function EditorCanvas({ device, previewHtml, projectName, isRunning, refreshTick = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded && previewHtml && !dialog.open) dialog.showModal();
    if ((!expanded || !previewHtml) && dialog.open) dialog.close();
  }, [expanded, previewHtml]);

  const state = !previewHtml ? "NO ARTIFACT" : isRunning ? "BUILDING" : "PREVIEW";

  return (
    <div className="ve-frame-area">
      <div className="ve-frame-bar">
        <span className="ve-frame-project">{projectName}</span>
        <span className={`ve-status${isRunning && previewHtml ? " is-busy" : ""}`}>
          <i />
          {state}
        </span>
        <button className="cp-outline" type="button" onClick={() => setExpanded(true)} disabled={!previewHtml} aria-label="Expand sandboxed preview">
          <ExternalLink size={12} />
          OPEN
        </button>
      </div>

      <div className="ve-frame-body">
        {previewHtml ? (
          <div className={FRAME_CLASS[device] || "ve-frame"}>
            <iframe
              key={refreshTick}
              srcDoc={previewHtml}
              title="Rendered artifact sandbox"
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="ve-empty">
            <Eye size={26} />
            <p>Describe what to build and press Build in the chat panel, or tap a suggestion. The rendered artifact appears here in the device frame you choose.</p>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setExpanded(false)}
        aria-label="Expanded sandboxed preview"
        style={{
          width: "min(96vw, 1600px)",
          height: "min(94vh, 1000px)",
          padding: 0,
          border: "1px solid #334155",
          borderRadius: 10,
          background: "#0b1220",
          color: "#f8fafc",
          maxWidth: "none",
          maxHeight: "none",
        }}
      >
        <div style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", height: "100%" }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 16px" }}>
            <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{projectName} — isolated preview</strong>
            <button type="button" className="cp-outline" onClick={() => setExpanded(false)} aria-label="Close expanded preview">
              <X size={15} /> CLOSE
            </button>
          </header>
          {previewHtml && (
            <iframe
              key={`expanded-${refreshTick}`}
              srcDoc={previewHtml}
              title="Expanded rendered artifact sandbox"
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              style={{ width: "100%", height: "100%", border: 0, background: "white" }}
            />
          )}
        </div>
      </dialog>
    </div>
  );
}

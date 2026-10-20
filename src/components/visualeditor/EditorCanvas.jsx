import React, { useState } from "react";
import { ExternalLink, Eye, RefreshCw } from "lucide-react";

const FRAME_CLASS = {
  desktop: "ve-frame",
  tablet: "ve-frame ve-frame-tablet",
  mobile: "ve-frame ve-frame-mobile",
};

// The package's preview frame: the rendered artifact inside a device-sized frame,
// with its own refresh and open-in-a-tab actions.
export default function EditorCanvas({ device, previewHtml }) {
  const [shotKey, setShotKey] = useState(0);

  const open = () => {
    const url = URL.createObjectURL(new Blob([previewHtml], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <>
      <div className="ve-panel-head">
        <div>
          <p className="cp-kicker">ARTIFACT CANVAS</p>
          <p className="ve-name">
            {previewHtml ? `${previewHtml.length.toLocaleString()} characters · ${device}` : "nothing rendered yet"}
          </p>
        </div>
        <div className="ve-actions">
          <button className="cp-outline" type="button" onClick={() => setShotKey((k) => k + 1)} disabled={!previewHtml}>
            <RefreshCw size={13} />
            REFRESH
          </button>
          <button className="cp-outline" type="button" onClick={open} disabled={!previewHtml}>
            <ExternalLink size={13} />
            OPEN
          </button>
        </div>
      </div>

      <div className="ve-canvas">
        {previewHtml ? (
          <div className={FRAME_CLASS[device] || "ve-frame"}>
            <iframe key={shotKey} srcDoc={previewHtml} title="Rendered artifact" sandbox="allow-scripts" />
          </div>
        ) : (
          <div className="ve-empty">
            <Eye size={26} />
            <p>Describe what to build, then press BUILD. The rendered artifact appears here in the device frame you choose.</p>
          </div>
        )}
      </div>
    </>
  );
}
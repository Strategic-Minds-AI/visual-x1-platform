import React, { useEffect, useRef } from "react";
import { Eye } from "lucide-react";
import { withPicker } from "@/components/visualeditor/editorPicker";

const FRAME_CLASS = {
  desktop: "ve-frame",
  tablet: "ve-frame ve-frame-tablet",
  mobile: "ve-frame ve-frame-mobile",
};

/**
 * The editor screen: the artifact, rendered in the device frame the bar chose. The
 * canvas tools live in the toolbar directly above this, so what is left here is the
 * document itself — plus, when the point tool is armed, the picker's report of
 * whichever element was clicked, which turns into a targeted edit.
 */
export default function EditorCanvas({ device, previewHtml, refreshTick = 0, pickMode = false, onPick }) {
  const frameRef = useRef(null);

  useEffect(() => {
    const report = (event) => {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const data = event.data;
      if (!data || data.source !== "visual-x-picker" || !data.element) return;
      onPick?.(data.element);
    };
    window.addEventListener("message", report);
    return () => window.removeEventListener("message", report);
  }, [onPick]);

  return (
    <div className="ve-frame-area">
      <div className="ve-frame-body">
        {previewHtml ? (
          <div className={FRAME_CLASS[device] || "ve-frame"}>
            <iframe
              ref={frameRef}
              key={`${refreshTick}-${pickMode ? "pick" : "preview"}`}
              srcDoc={pickMode ? withPicker(previewHtml) : previewHtml}
              title="Rendered artifact"
              sandbox="allow-scripts"
            />
          </div>
        ) : (
          <div className="ve-empty">
            <Eye size={26} />
            <p>
              Describe what to build and press Generate, or open a live project from the Vercel or GitHub menu. The artifact appears here in the device
              frame you choose, and the point tool turns it into something you can edit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
import React from "react";
import { Panel } from "@/components/admin/adminUi";

// Rendered pipeline output, held in a full-bleed portal panel. The frame is
// sandboxed without same-origin access, so a generated artifact can never reach
// into the operator console.
export default function ArtifactFrame({ html, height = 420 }) {
  if (!html) return null;
  return (
    <Panel
      kicker="RENDERED ARTIFACT"
      className="cp-full-project"
      aside={<span className="cp-fine">{html.length.toLocaleString()} characters</span>}
    >
      <iframe
        title="Rendered artifact preview"
        srcDoc={html}
        sandbox="allow-scripts"
        className="w-full bg-white"
        style={{ height }}
      />
    </Panel>
  );
}
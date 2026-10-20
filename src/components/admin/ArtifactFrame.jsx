import React from "react";
import { Card } from "@/components/ui/card";

// Rendered pipeline output. Sandboxed without same-origin access, so a generated
// artifact can never reach into the operator console.
export default function ArtifactFrame({ html, height = 420 }) {
  if (!html) return null;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="x1-track text-xs font-bold text-muted-foreground">Rendered artifact</span>
        <span className="text-[10px] text-muted-foreground">{html.length.toLocaleString()} characters</span>
      </div>
      <iframe
        title="Rendered artifact preview"
        srcDoc={html}
        sandbox="allow-scripts"
        className="w-full bg-white"
        style={{ height }}
      />
    </Card>
  );
}
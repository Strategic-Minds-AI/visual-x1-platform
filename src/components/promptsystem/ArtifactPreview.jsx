import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone, Tablet, Laptop } from "lucide-react";

const VIEWPORTS = [
  { id: "mobile", label: "390", width: 390, icon: Smartphone },
  { id: "tablet", label: "768", width: 768, icon: Tablet },
  { id: "laptop", label: "1024", width: 1024, icon: Laptop },
  { id: "desktop", label: "1440", width: 1440, icon: Monitor },
];

// The rendered artifact is model-generated HTML, so it is served in an opaque-origin
// sandbox: scripts may run, but it cannot reach the app's origin, storage or session.
export default function ArtifactPreview({ html, artifactType }) {
  const [viewport, setViewport] = useState("laptop");

  if (!html) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Rendered artifact</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No rendered HTML in this view. The artifact itself is never stored on the run record — its build prompt and length are.
            Re-run, or open the newest run, to render it again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const width = VIEWPORTS.find((v) => v.id === viewport)?.width || 1024;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Rendered artifact</CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[10px]">{artifactType || "artifact"}</Badge>
            {VIEWPORTS.map((v) => {
              const Icon = v.icon;
              return (
                <Button
                  key={v.id}
                  size="sm"
                  variant={viewport === v.id ? "default" : "outline"}
                  className="h-7 px-2 gap-1"
                  onClick={() => setViewport(v.id)}
                >
                  <Icon className="w-3.5 h-3.5" /> <span className="text-[11px] font-mono">{v.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Sandboxed preview at {width}px. Frame switching is a sizing check, not browser test evidence — no browser execution was performed.
        </p>
      </CardHeader>
      <CardContent>
        <div className={cn("border border-border rounded-lg overflow-auto bg-muted/20 p-2")}>
          <iframe
            title="Rendered artifact preview"
            srcDoc={html}
            sandbox="allow-scripts"
            className="bg-white rounded-md mx-auto block"
            style={{ width, height: 640, border: "0" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
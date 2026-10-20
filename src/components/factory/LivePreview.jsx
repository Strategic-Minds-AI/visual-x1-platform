import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, RefreshCw, Download } from "lucide-react";

const VIEWPORTS = {
  desktop: { width: "100%", label: "Desktop", icon: Monitor },
  tablet: { width: "768px", label: "Tablet", icon: Tablet },
  mobile: { width: "390px", label: "Mobile", icon: Smartphone },
};

export default function LivePreview({ html, isRendering }) {
  const [viewport, setViewport] = useState("desktop");

  if (!html && !isRendering) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-8">
        <Monitor className="w-12 h-12 opacity-20" />
        <p className="text-sm text-center max-w-xs">
          Enter a one-sentence brief and launch the autonomous pipeline. The rendered website will appear here with live preview at desktop, tablet, and mobile viewport widths.
        </p>
      </div>
    );
  }

  if (isRendering && !html) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Rendering production-quality HTML...</p>
      </div>
    );
  }

  const vp = VIEWPORTS[viewport];

  return (
    <div className="flex flex-col h-full">
      {/* Viewport controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card shrink-0">
        <div className="flex gap-1">
          {Object.entries(VIEWPORTS).map(([key, val]) => {
            const Icon = val.icon;
            return (
              <Button
                key={key}
                size="sm"
                variant={viewport === key ? "default" : "ghost"}
                onClick={() => setViewport(key)}
                className="h-8"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">{val.label}</span>
              </Button>
            );
          })}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              const blob = new Blob([html], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "visual-x-website.html";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4 flex justify-center">
        <div
          className="bg-white rounded-lg shadow-lg transition-all duration-300 overflow-hidden"
          style={{ width: vp.width, maxWidth: "100%", height: "100%" }}
        >
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            title="Website Preview"
          />
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Globe, Loader2, RotateCw } from "lucide-react";

// A route's own label: the last segment of its path, in the console's tracked capitals.
const label = (path) => {
  if (path === "/" || path === "") return "HOME";
  const last = path.replace(/\/$/, "").split("/").filter(Boolean).pop() || "HOME";
  return last.replace(/\.html?$/i, "").replace(/[-_]+/g, " ").toUpperCase().slice(0, 22);
};

/**
 * The page navigator, directly above the canvas: the site's route map, read from the
 * artifact, with the page on screen marked. Selecting a route loads that page onto the
 * canvas; back and forward walk the pages already visited, and reload takes the current
 * one again from its source. The URL the project is being read from sits at the right.
 */
export default function RouteNavigator({
  routes = [],
  origin = "",
  current = "/",
  busy = false,
  canBack = false,
  canForward = false,
  onOpen,
  onBack,
  onForward,
  onReload,
}) {
  if (routes.length === 0) return null;

  const currentUrl = origin ? `${origin}${current}` : current;

  return (
    <div className="ve-routes">
      <div className="ve-routes-nav">
        <button type="button" className="ve-icon-btn" onClick={onBack} disabled={!canBack} title="Back to the previous page" aria-label="Back">
          <ArrowLeft size={14} />
        </button>
        <button type="button" className="ve-icon-btn" onClick={onForward} disabled={!canForward} title="Forward to the next page" aria-label="Forward">
          <ArrowRight size={14} />
        </button>
        <button type="button" className="ve-icon-btn" onClick={onReload} disabled={busy} title="Load this page again" aria-label="Reload">
          <RotateCw size={14} className={busy ? "animate-spin" : undefined} />
        </button>
      </div>

      <div className="ve-routes-track" role="tablist" aria-label="Pages of this site">
        {busy && <Loader2 size={13} className="animate-spin ve-route-busy" />}
        {routes.map((route) => (
          <button
            key={route.path}
            type="button"
            role="tab"
            aria-selected={route.path === current}
            className={`ve-route${route.path === current ? " selected" : ""}`}
            onClick={() => onOpen(route.path)}
            disabled={busy}
            title={route.url || route.path}
          >
            {label(route.path)}
          </button>
        ))}
      </div>

      <span className="ve-route-url" title={currentUrl}>
        <Globe size={12} />
        {currentUrl.replace(/^https?:\/\//, "")}
      </span>

      <button
        type="button"
        className="ve-icon-btn"
        onClick={() => window.open(currentUrl.startsWith("http") ? currentUrl : `https://${currentUrl}`, "_blank", "noopener")}
        title="Open this page in a new tab"
        aria-label="Open this page in a new tab"
      >
        <ExternalLink size={14} />
      </button>
    </div>
  );
}
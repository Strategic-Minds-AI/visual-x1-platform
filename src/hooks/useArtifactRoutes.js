import { useMemo } from "react";

const ASSET = /\.(png|jpe?g|svg|webp|gif|css|js|mjs|json|pdf|xml|ico|woff2?|ttf|mp4|webm|zip)$/i;

/**
 * The route map of the site on the canvas, read from the artifact itself.
 *
 * Every same-origin link in the rendered document becomes a page in the navigator, and
 * the origin those links share becomes the base each page is loaded from — so the map is
 * the site's own, not a list kept in the editor. A document with no links has one route:
 * the page on screen.
 */
export default function useArtifactRoutes(html, current = "/") {
  return useMemo(() => {
    const source = String(html || "");
    if (!source) return { origin: "", routes: [] };

    const hrefs = [...source.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1].trim());

    // The origin the document's own absolute links share is where its pages live.
    let origin = "";
    for (const href of hrefs) {
      if (!/^https?:\/\//i.test(href)) continue;
      try {
        origin = new URL(href).origin;
        break;
      } catch {
        // not a usable absolute url
      }
    }

    const paths = new Set(["/"]);
    for (const href of hrefs) {
      if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
      let path;
      try {
        const url = new URL(href, origin || "https://localhost.invalid");
        if (origin && url.origin !== origin) continue;
        path = url.pathname || "/";
      } catch {
        continue;
      }
      if (ASSET.test(path)) continue;
      paths.add((path.replace(/\/index\.html?$/i, "/") || "/").slice(0, 180));
    }

    const routes = [...paths]
      .sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)))
      .map((path) => ({
        path,
        url: origin ? `${origin}${path}` : "",
        current: path === current,
      }));

    return { origin, routes };
  }, [html, current]);
}
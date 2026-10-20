import { useEffect, useState } from "react";

// This module is designed to be mounted by the X1 admin in an iframe. X1 is the
// host: it owns the shell, the navigation and the operator identity. Visual X
// owns the engines inside the frame.
//
// X1 -> module:  x1:context  { context: { tenant_id, tenant_name, operator_name, operator_email } }
//                x1:surface  { surface }
// module -> X1:  visualx:ready    { module, surfaces }
//                visualx:navigate { surface }
//
// X1's admin is served from the production domain and from Vercel preview URLs
// during releases; nothing else may drive this frame.
const ALLOWED_HOST = /^https:\/\/([a-z0-9-]+\.)*(strategicmindsai\.com|vercel\.app)$/;

function post(message) {
  if (window.parent === window) return;
  window.parent.postMessage(message, "*");
}

// Tells the host that the operator moved inside the module, so X1 can keep its
// own navigation and URL in step.
export function notifyHostSurface(surface) {
  post({ type: "visualx:navigate", surface });
}

export default function useX1ModuleBridge({ surfaces, onSurface }) {
  const [hostContext, setHostContext] = useState(null);

  useEffect(() => {
    post({ type: "visualx:ready", module: "visual-x", surfaces });
  }, [surfaces]);

  useEffect(() => {
    function onMessage(event) {
      if (!ALLOWED_HOST.test(event.origin)) return;
      const data = event.data || {};
      if (data.type === "x1:context") {
        setHostContext(data.context || {});
      } else if (data.type === "x1:surface" && surfaces.includes(data.surface)) {
        onSurface(data.surface);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [surfaces, onSurface]);

  return hostContext;
}
import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import X1HostPicker from "@/components/x1/X1HostPicker";

// X1's nine screens, read from its own route table. These are the real X1 pages.
const SCREENS = [
  { label: "Marketing", path: "/v2/b" },
  { label: "Pricing", path: "/pricing" },
  { label: "Client portal", path: "/portal" },
  { label: "Launch Studio", path: "/admin/launch-studio" },
  { label: "Visual Studio", path: "/admin/visual-editor" },
  { label: "Agent Console", path: "/admin/agent" },
  { label: "Prompt Lab", path: "/admin/prompt-lab" },
  { label: "Coding Kanban", path: "/admin/coding-kanban" },
  { label: "Intelligence", path: "/admin/intelligence" },
];

export default function X1ExperienceConsole() {
  const [hosts, setHosts] = useState([]);
  const [host, setHost] = useState("");
  const [path, setPath] = useState("/v2/b");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("x1FramableHosts", {});
      const data = res.data || {};
      if (data.error) setError(data.error);
      const list = data.hosts || [];
      setHosts(list);
      setHost((current) =>
        list.some((h) => h.host === current) ? current : (list.find((h) => h.frames_visualx) || list[0] || {}).host || ""
      );
    } catch (e) {
      setError(e.message || "The X1 host check did not answer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = hosts.find((h) => h.host === host) || null;
  const target = selected ? `https://${selected.host}${path}` : "";
  const framable = hosts.find((h) => h.frames_visualx);
  const gated = /^\/(admin|portal)/.test(path);

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <h1 className="font-heading text-base font-semibold">X1 Live App</h1>
          <Badge variant="outline" className="text-[10px]">
            X1's real interface, not a replica
          </Badge>
          <div className="ml-auto flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={load} disabled={loading} title="Re-check X1's hosts">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
            {target ? (
              <a
                href={target}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs underline"
              >
                Open directly <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="px-4 pb-2.5 space-y-2">
          <X1HostPicker hosts={hosts} value={host} onChange={setHost} />
          <div className="flex flex-wrap gap-1.5">
            {SCREENS.map((s) => (
              <button
                key={s.path}
                onClick={() => setPath(s.path)}
                className={cn(
                  "px-2.5 py-1 rounded-md border text-xs whitespace-nowrap electric-hover",
                  path === s.path
                    ? "border-primary bg-muted text-foreground font-medium"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 bg-slate-950">
        {error ? (
          <div className="h-full flex items-center justify-center px-6 text-center text-sm text-muted-foreground">{error}</div>
        ) : selected && selected.frames_visualx ? (
          <iframe
            key={target}
            title={`X1 ${path}`}
            src={target}
            className="w-full h-full border-0"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <p className="text-sm text-muted-foreground max-w-xl">
              {selected ? selected.framing_reason : "No X1 host answered the check."}
            </p>
            {framable && selected && selected.host !== framable.host ? (
              <Button size="sm" variant="outline" onClick={() => setHost(framable.host)}>
                Use the build that permits framing
              </Button>
            ) : null}
            {target ? (
              <a href={target} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                Open this screen in X1
              </a>
            ) : null}
          </div>
        )}
      </div>

      <p className="shrink-0 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        {gated
          ? "X1's admin and portal screens ask for X1's own sign-in, and browsers restrict third-party sign-in inside a frame. Sign in there with Open directly, then reload the frame."
          : "Every host is read for its real framing headers before it is framed, so a host that refuses is reported here instead of shown as a browser error page."}
      </p>
    </div>
  );
}
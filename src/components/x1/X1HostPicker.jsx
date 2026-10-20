import React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// One button per X1 host, with the measured framing verdict on each. A build that
// refuses framing is still listed, so the reason is visible instead of hidden.
function label(host) {
  if (!host.sha) return host.host.replace(/^www\./, "");
  return `${host.sha} · ${String(host.ref || "build").replace(/^feature\//, "")}`;
}

export default function X1HostPicker({ hosts, value, onChange }) {
  if (!hosts.length) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {hosts.map((h) => (
        <button
          key={h.host}
          onClick={() => onChange(h.host)}
          title={`${h.host} — ${h.framing_reason}`}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs whitespace-nowrap electric-hover",
            value === h.host
              ? "border-primary bg-muted text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {h.frames_visualx ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="truncate max-w-[200px]">{label(h)}</span>
        </button>
      ))}
    </div>
  );
}
import React from "react";
import { AlertTriangle, CheckCircle2, CircleSlash, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

// One chip per service, stating what that service answered for this system.
const STATES = {
  live: { Icon: CheckCircle2, cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
  wired: { Icon: Link2, cls: "border-sky-400/40 bg-sky-400/10 text-sky-200" },
  attention: { Icon: AlertTriangle, cls: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  unwired: { Icon: CircleSlash, cls: "border-border bg-muted/40 text-muted-foreground" }
};

export default function ProjectIndicators({ indicators }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
      {(indicators || []).map((item) => {
        const { Icon, cls } = STATES[item.state] || STATES.unwired;
        const body = (
          <>
            <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="min-w-0">
              <span className="x1-track block text-[9px] text-muted-foreground">{item.label}</span>
              <span className="block text-[11px] leading-snug">{item.detail}</span>
            </span>
          </>
        );

        return item.href ? (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className={cn("flex items-start gap-2 rounded-xl border px-2.5 py-2 electric-hover", cls)}
          >
            {body}
          </a>
        ) : (
          <div key={item.key} className={cn("flex items-start gap-2 rounded-xl border px-2.5 py-2", cls)}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
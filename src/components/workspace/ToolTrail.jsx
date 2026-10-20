import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, X } from "lucide-react";

export default function ToolTrail({ trail }) {
  const [open, setOpen] = useState(false);
  if (!trail?.length) return null;

  return (
    <div className="mt-2 text-xs border border-border rounded-md overflow-hidden bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted transition text-left">
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span className="font-medium">{trail.length} action{trail.length === 1 ? "" : "s"} taken</span>
        <span className="text-muted-foreground truncate">{trail.map((s) => s.tool).join(" → ")}</span>
      </button>
      {open && (
        <div className="divide-y divide-border">
          {trail.map((s, i) => (
            <div key={i} className="px-2.5 py-2 space-y-1">
              <div className="flex items-center gap-2">
                {s.ok ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-600" />}
                <span className="font-medium">{s.tool}</span>
              </div>
              {s.reasoning && <p className="text-muted-foreground">{s.reasoning}</p>}
              <p className="text-muted-foreground font-mono break-all">{JSON.stringify(s.arguments)}</p>
              <pre className="whitespace-pre-wrap text-muted-foreground max-h-40 overflow-y-auto">{s.observation}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
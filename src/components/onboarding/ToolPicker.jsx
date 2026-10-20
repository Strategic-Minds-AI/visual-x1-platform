import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TOOL_GROUPS } from "@/data/intakeCatalog";
import { Sparkles } from "lucide-react";

// Every option is grouped by the manual process it replaces, with a write-in for anything the
// client does by hand that is not on the list.
export default function ToolPicker({ selected, onToggle, customTools, onCustomChange, recommended }) {
  const rec = new Set(recommended || []);
  return (
    <div className="space-y-5">
      {TOOL_GROUPS.map((group) => (
        <div key={group.id} className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-heading text-sm font-semibold">{group.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Replaces: {group.replaces}</p>
          </div>
          <div className="p-4 grid gap-2 sm:grid-cols-2">
            {group.tools.map((tool) => {
              const on = selected.includes(tool.id);
              return (
                <label
                  key={tool.id}
                  className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/40 transition"
                >
                  <Checkbox checked={on} onCheckedChange={() => onToggle(tool.id)} className="mt-0.5" />
                  <span className="text-xs leading-snug">
                    {tool.label}
                    {rec.has(tool.id) && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-primary">
                        <Sparkles className="w-3 h-3" /> suggested
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <Label className="text-xs">Anything else still done by hand</Label>
        <p className="text-[11px] text-muted-foreground">
          Write it however you would say it out loud. One per line. These get scoped into the automation plan.
        </p>
        <Textarea
          value={customTools || ""}
          onChange={(e) => onCustomChange(e.target.value)}
          rows={4}
          placeholder={"Quoting by phone and email\nChasing unpaid invoices\nPosting to Facebook whenever I remember"}
        />
      </div>
    </div>
  );
}
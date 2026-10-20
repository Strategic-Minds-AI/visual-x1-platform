import React from "react";
import { Badge } from "@/components/ui/badge";
import { ALL_TOOLS, BUSINESS_STAGES, GOAL_KINDS, GOAL_HORIZONS } from "@/data/intakeCatalog";

const label = (list, id) => list.find((x) => x.id === id)?.label || id || "—";

// Last look before research starts: everything the discovery engine will use.
export default function ReviewSummary({ form, vision, selectedTools, customTools }) {
  const tools = ALL_TOOLS.filter((t) => selectedTools.includes(t.id));
  const rows = [
    ["Client", `${form.full_name} · ${form.email}${form.phone ? ` · ${form.phone}` : ""}`],
    ["Address", [form.address, form.city, form.state, form.postal_code].filter(Boolean).join(", ")],
    ["Business", form.company_name],
    ["Industry", form.industry],
    ["Stage", label(BUSINESS_STAGES, form.business_stage)],
    ["Website", form.website_url || "None provided — the frontend audit will be skipped"],
    ["Services sold", form.primary_services || "Not stated"],
    ["Service area", form.service_area || "Not stated"],
    ["Goal", `${label(GOAL_KINDS, form.goal_kind)} of ${form.goal_value || "—"} by ${label(GOAL_HORIZONS, form.goal_horizon)}`],
    ["Monthly budget", form.monthly_budget ? `$${form.monthly_budget}` : "Not stated"],
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-heading text-sm font-semibold">What gets researched</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            The engine runs three web-grounded research passes and scores every competitor on a fixed rubric.
            Anything it cannot verify comes back empty rather than guessed.
          </p>
        </div>
        <div className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="px-4 py-2.5 grid gap-1 sm:grid-cols-[160px_1fr]">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</span>
              <span className="text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {vision?.vision_statement && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Vision statement</p>
          <p className="text-sm">{vision.vision_statement}</p>
          {vision.success_definition && (
            <p className="text-xs text-muted-foreground">Winning looks like: {vision.success_definition}</p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Automations requested</p>
          <Badge variant="secondary" className="text-[11px]">{tools.length} selected</Badge>
        </div>
        {tools.length === 0 ? (
          <p className="text-xs text-muted-foreground">None selected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tools.map((t) => (
              <Badge key={t.id} variant="outline" className="text-[11px]">{t.label}</Badge>
            ))}
          </div>
        )}
        {customTools && (
          <div className="pt-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Written in</p>
            <p className="text-xs whitespace-pre-line mt-1">{customTools}</p>
          </div>
        )}
      </div>

      {(form.pain_points || form.desired_outcomes) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {form.pain_points && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">What is not working</p>
              <p className="text-xs mt-1 whitespace-pre-line">{form.pain_points}</p>
            </div>
          )}
          {form.desired_outcomes && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">What they want more of</p>
              <p className="text-xs mt-1 whitespace-pre-line">{form.desired_outcomes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Flag, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const money = (n) => (n ? `$${Number(n).toLocaleString()}` : "—");

function OptionCard({ option, recommended, onChoose, chosen }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3",
        recommended ? "border-primary/50" : "border-border",
        chosen && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-semibold">{option.label}</h3>
            <Badge variant="outline" className="text-[11px] capitalize">{option.horizon} horizon</Badge>
          </div>
          {recommended && (
            <p className="text-[11px] text-primary flex items-center gap-1 mt-1">
              <Lightbulb className="w-3 h-3" /> The system recommends this one
            </p>
          )}
        </div>
        {option.budget && (
          <div className="text-right whitespace-nowrap">
            <p className="text-xs font-semibold">{money(option.budget.monthly_low)}–{money(option.budget.monthly_high)}</p>
            <p className="text-[11px] text-muted-foreground">per month</p>
          </div>
        )}
      </div>

      {option.summary && <p className="text-xs text-muted-foreground">{option.summary}</p>}

      <dl className="space-y-2">
        {[
          ["Positioning", option.positioning],
          ["Naming and URL", [option.naming_strategy, option.url_strategy].filter(Boolean).join(" · ")],
          ["NearMe / NearYou", option.nearme_nearyou_strategy],
          ["SEO · AEO · GEO", option.seo_aeo_geo_strategy],
          ["Frontend", option.visual_frontend_strategy],
          ["Backend and automation", option.backend_strategy],
          ["Agents", option.agent_strategy],
          ["Pricing model", option.pricing_model],
          ["Content plan", option.content_plan],
        ].filter(([, v]) => Boolean(v)).map(([k, v]) => (
          <div key={k} className="grid gap-0.5 sm:grid-cols-[130px_1fr]">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="text-xs">{v}</dd>
          </div>
        ))}
      </dl>

      {option.budget?.allocation?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {option.budget.allocation.map((a) => <Badge key={a} variant="secondary" className="text-[11px]">{a}</Badge>)}
        </div>
      )}

      {option.website_capabilities?.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Capabilities required</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {option.website_capabilities.map((c) => <Badge key={c} variant="outline" className="text-[11px]">{c}</Badge>)}
          </div>
        </div>
      )}

      {option.ideal_client && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ideal client to aim at</p>
          <p className="text-xs">{option.ideal_client.demographics}</p>
          <p className="text-[11px] text-muted-foreground">
            {[option.ideal_client.typical_income, option.ideal_client.buying_power, option.ideal_client.buying_habits].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}

      {(option.launch_moves?.length > 0 || option.risks?.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {option.launch_moves?.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Flag className="w-3 h-3" /> Launch moves</p>
              <ol className="mt-1 space-y-0.5">
                {option.launch_moves.map((m, i) => <li key={m} className="text-xs text-muted-foreground">{i + 1}. {m}</li>)}
              </ol>
            </div>
          )}
          {option.risks?.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">What would make it fail</p>
              <ul className="mt-1 space-y-0.5">
                {option.risks.map((r) => <li key={r} className="text-xs text-muted-foreground">· {r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {onChoose && (
        <button
          type="button"
          onClick={() => onChoose(option)}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-xs font-medium transition",
            chosen ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
          )}
        >
          {chosen ? <span className="flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" /> Selected for approval</span> : "Choose this option"}
        </button>
      )}
    </div>
  );
}

// The multi-option proposal: short, mid and long horizons at once, plus the variants to run
// side by side.
export default function ProposalOptions({ proposal, chosenOptionId, onChoose }) {
  if (!proposal?.options?.length) return null;
  const recId = proposal.recommended_option_id || proposal.recommendation?.option_id;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        {proposal.options.map((o) => (
          <OptionCard
            key={o.id || o.label}
            option={o}
            recommended={o.id && o.id === recId}
            chosen={chosenOptionId === o.id}
            onChoose={onChoose}
          />
        ))}
      </div>

      {proposal.launch_variants?.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-heading text-sm font-semibold">Launch variants to run at once</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each one tests a different positioning, so the market picks the winner instead of us.
            </p>
          </div>
          <div className="divide-y divide-border">
            {proposal.launch_variants.map((v) => (
              <div key={v.label} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[11px]">{v.label}</Badge>
                  <p className="text-xs font-medium">{v.tests}</p>
                </div>
                {v.positioning && <p className="text-xs text-muted-foreground mt-1">{v.positioning}</p>}
                {v.why_it_might_win && <p className="text-[11px] text-muted-foreground mt-0.5">{v.why_it_might_win}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {proposal.keyword_strategy && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-heading text-sm font-semibold">Keyword, phrase and question strategy</h3>
          {[
            ["Primary", proposal.keyword_strategy.primary],
            ["Secondary", proposal.keyword_strategy.secondary],
            ["Long-tail phrases", proposal.keyword_strategy.long_tail_phrases],
            ["Questions to answer (AEO)", proposal.keyword_strategy.aeo_questions],
            ["Geographic targets (GEO)", proposal.keyword_strategy.geo_targets],
          ].filter(([, v]) => v?.length).map(([label, list]) => (
            <div key={label}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {list.map((k) => <Badge key={k} variant="outline" className="text-[11px]">{k}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {proposal.content_system && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h3 className="font-heading text-sm font-semibold">Content system</h3>
          {proposal.content_system.cadence && <p className="text-xs">{proposal.content_system.cadence}</p>}
          <div className="flex flex-wrap gap-1.5">
            {(proposal.content_system.pillars || []).map((p) => <Badge key={p} variant="secondary" className="text-[11px]">{p}</Badge>)}
            {(proposal.content_system.formats || []).map((f) => <Badge key={f} variant="outline" className="text-[11px]">{f}</Badge>)}
          </div>
        </div>
      )}

      {proposal.data_requests?.length > 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Inputs that would sharpen this</p>
          <ul className="mt-1 space-y-0.5">
            {proposal.data_requests.map((d) => <li key={d} className="text-xs text-muted-foreground">· {d}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
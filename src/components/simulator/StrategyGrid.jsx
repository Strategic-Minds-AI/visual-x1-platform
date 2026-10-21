import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Plus } from "lucide-react";

const CATEGORY_LABELS = {
  technical: "Technical Foundation",
  content: "Content & On-Page",
  aeo: "Answer Engines (AEO)",
  geo: "Generative Engines (GEO)",
  local: "Local & NearMe",
  programmatic: "Programmatic Scale",
  authority: "Authority & Backlinks",
  paid: "Paid Amplification",
  social: "Social & Distribution",
  engagement: "Conversion & Engagement",
  offline: "Offline & Networking",
  measurement: "Measurement & Repair",
  ai_native: "AI-Native Methods",
};

const TIER_STYLES = {
  proven: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  advanced: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  ai_native: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

const TIER_LABELS = { proven: "Proven", advanced: "Advanced", ai_native: "AI-native" };

export default function StrategyGrid({ strategies, enabledIds, onToggle, onToggleAll, onAdd }) {
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", category: "content", impact: 6, tier: "advanced" });

  const grouped = useMemo(() => {
    const map = {};
    strategies.forEach((s) => {
      const key = s.category || "content";
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return Object.entries(map);
  }, [strategies]);

  const enabledCount = enabledIds.length;
  const allOn = strategies.length > 0 && enabledCount === strategies.length;

  const submit = () => {
    if (!draft.name.trim()) return;
    onAdd({ ...draft, name: draft.name.trim(), velocity: 6, engagement_lift: 5, authority_lift: 4 });
    setDraft({ name: "", category: "content", impact: 6, tier: "advanced" });
    setShowAdd(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4" /> Strategy Playbook
          </CardTitle>
          <Badge variant="secondary" className="text-[11px]">
            {enabledCount}/{strategies.length} on
          </Badge>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onToggleAll(!allOn)}>
            {allOn ? "Turn all off" : "Turn all on"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-3 h-3" /> Custom
          </Button>
        </div>
        {showAdd && (
          <div className="flex gap-2 pt-2">
            <Input
              className="h-8 text-xs"
              placeholder="Custom strategy name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Button size="sm" className="h-8 text-xs" onClick={submit}>Add</Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 max-h-[420px] overflow-y-auto pr-3">
        {grouped.map(([category, items]) => (
          <div key={category}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {CATEGORY_LABELS[category] || category} · {items.filter((i) => enabledIds.includes(i.id)).length}/{items.length}
            </p>
            <div className="space-y-1.5">
              {items.map((s) => {
                const on = enabledIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-2 rounded-md border p-2 transition ${on ? "border-primary/30 bg-primary/5" : "border-border"}`}
                  >
                    <Switch checked={on} onCheckedChange={() => onToggle(s.id)} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium">{s.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TIER_STYLES[s.tier] || TIER_STYLES.proven}`}>
                          {TIER_LABELS[s.tier] || "Proven"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{s.description}</p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">
                        impact {s.impact}/10 · velocity {s.velocity}d · engagement +{s.engagement_lift}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
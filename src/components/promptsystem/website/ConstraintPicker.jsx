import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel, LinkButton } from "@/components/admin/adminUi";
import { MANDATORIES, RESTRICTIONS } from "@/data/websiteEditCatalog";

// Two sets of multiple-choice rules: what a run must do, and what it must not.
const List = ({ kicker, title, items, selected, onToggle, onAll }) => (
  <Panel
    kicker={kicker}
    title={title}
    aside={<LinkButton onClick={onAll}>{selected.length === items.length ? "CLEAR ALL" : "SELECT ALL"}</LinkButton>}
  >
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {items.map(([id, label, line]) => (
        <label key={id} className="flex items-start gap-2 text-xs max-w-[16rem] cursor-pointer">
          <Checkbox checked={selected.includes(id)} onCheckedChange={() => onToggle(id)} className="mt-0.5" />
          <span>
            <span className="block text-foreground">{label}</span>
            <span className="block text-muted-foreground">{line}</span>
          </span>
        </label>
      ))}
    </div>
  </Panel>
);

export default function ConstraintPicker({ mandatories, restrictions, onChange }) {
  const toggle = (key, id) => {
    const current = key === "mandatories" ? mandatories : restrictions;
    onChange({
      [key]: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    });
  };

  return (
    <div className="cp-admin-stack">
      <List
        kicker="MANDATORIES"
        title="What this run must satisfy"
        items={MANDATORIES}
        selected={mandatories}
        onToggle={(id) => toggle("mandatories", id)}
        onAll={() => onChange({ mandatories: mandatories.length === MANDATORIES.length ? [] : MANDATORIES.map((m) => m[0]) })}
      />
      <List
        kicker="RESTRICTIONS"
        title="What this run must not do"
        items={RESTRICTIONS}
        selected={restrictions}
        onToggle={(id) => toggle("restrictions", id)}
        onAll={() => onChange({ restrictions: restrictions.length === RESTRICTIONS.length ? [] : RESTRICTIONS.map((r) => r[0]) })}
      />
    </div>
  );
}
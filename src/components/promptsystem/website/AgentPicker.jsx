import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel, LinkButton } from "@/components/admin/adminUi";
import { STUDIO_AGENTS } from "@/data/websiteEditCatalog";

// Which agents must sign this change off before it is accepted.
export default function AgentPicker({ selected, onToggle, onAll }) {
  return (
    <Panel
      kicker="AGENTS ON THIS RUN"
      title="Who has to pass it"
      aside={<LinkButton onClick={onAll}>{selected.length === STUDIO_AGENTS.length ? "CLEAR ALL" : "SELECT ALL"}</LinkButton>}
    >
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {STUDIO_AGENTS.map((agent) => (
          <label key={agent.id} className="flex items-start gap-2 text-xs max-w-[16rem] cursor-pointer">
            <Checkbox checked={selected.includes(agent.id)} onCheckedChange={() => onToggle(agent.id)} className="mt-0.5" />
            <span>
              <span className="block text-foreground">{agent.label}</span>
              <span className="block text-muted-foreground">{agent.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </Panel>
  );
}
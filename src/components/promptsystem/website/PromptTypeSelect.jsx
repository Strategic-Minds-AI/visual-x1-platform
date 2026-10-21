import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/admin/adminUi";
import { PROMPT_SYSTEM_TYPES } from "@/data/websiteEditCatalog";

// Every kind of prompt system this app runs, with its description, so the operator
// chooses what the brief is put through rather than assuming one.
export default function PromptTypeSelect({ value, onChange }) {
  const chosen = PROMPT_SYSTEM_TYPES.find((t) => t.id === value);

  return (
    <Panel
      kicker="PROMPT SYSTEM"
      title="What the brief runs through"
      aside={
        <div className="cp-quote-fields cp-admin-inline-field">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger aria-label="Prompt system">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROMPT_SYSTEM_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <p className="cp-fine">{chosen?.description}</p>
      <ul className="cp-admin-stat-row">
        {PROMPT_SYSTEM_TYPES.map((type) => (
          <li key={type.id} className={type.id === value ? "cp-state-pill" : ""}>
            <span className="cp-kicker">{type.label}</span>
            <span className="cp-fine">{type.description}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
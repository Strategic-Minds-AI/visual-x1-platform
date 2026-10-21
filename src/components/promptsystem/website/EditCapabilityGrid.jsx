import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { LinkButton } from "@/components/admin/adminUi";
import { WEBSITE_EDIT_GROUPS } from "@/data/websiteEditCatalog";

// Every website editing capability this system can be asked for, grouped, each one
// a tick that writes a line into the prompt. The whole group can be taken at once.
export default function EditCapabilityGrid({ selected, onToggle, onGroup }) {
  return (
    <div className="cp-admin-stack">
      {WEBSITE_EDIT_GROUPS.map((group) => {
        const ids = group.items.map((i) => i.id);
        const taken = ids.filter((id) => selected.includes(id)).length;
        return (
          <div key={group.name}>
            <div className="cp-panel-top">
              <div>
                <p className="cp-kicker">
                  {group.name} · {taken}/{ids.length}
                </p>
                <p className="cp-fine">{group.hint}</p>
              </div>
              <LinkButton onClick={() => onGroup(ids, taken === ids.length)}>
                {taken === ids.length ? "CLEAR GROUP" : "TAKE ALL"}
              </LinkButton>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
              {group.items.map((item) => (
                <label key={item.id} className="flex items-start gap-2 text-xs max-w-[15rem] cursor-pointer">
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={() => onToggle(item.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-foreground">{item.label}</span>
                    <span className="block text-muted-foreground">{item.line}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
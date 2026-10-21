import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/admin/adminUi";
import { COLOR_EFFECTS, COLOR_ROLES } from "@/data/websiteEditCatalog";
import { cssTextToStyle } from "@/lib/websiteEditPrompt";

// The five colour roles, and the effect that carries them. Each effect shows a
// swatch painted from the palette as it is right now, so the choice is seen before
// it is written into the prompt.
export default function ColorSystemPanel({ colors, effect, onColor, onEffect }) {
  const active = COLOR_EFFECTS.find((e) => e.id === effect) || COLOR_EFFECTS[0];

  return (
    <Panel
      kicker="COLOUR SYSTEM"
      title="Palette and effect"
      aside={
        <div className="cp-quote-fields cp-admin-inline-field">
          <Select value={effect} onValueChange={onEffect}>
            <SelectTrigger aria-label="Colour effect">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLOR_EFFECTS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-4 w-8 shrink-0 rounded-sm border border-border/60"
                      style={cssTextToStyle(item.swatch(colors))}
                    />
                    <span>{item.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="flex flex-wrap gap-4">
        {COLOR_ROLES.map((role) => (
          <div key={role.id} className="w-40">
            <p className="cp-kicker">{role.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                aria-label={role.label}
                value={colors[role.id]}
                onChange={(e) => onColor(role.id, e.target.value)}
                className="h-8 w-10 rounded border border-input bg-transparent"
              />
              <input
                className="cp-field"
                value={colors[role.id]}
                onChange={(e) => onColor(role.id, e.target.value)}
                aria-label={`${role.label} hex value`}
              />
            </div>
            <p className="cp-fine">{role.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="inline-block h-12 w-24 rounded-md border border-border/60" style={cssTextToStyle(active.swatch(colors))} />
        <div>
          <p className="cp-kicker">{active.label}</p>
          <p className="cp-fine">{active.hint}</p>
          <p className="cp-fine">{active.swatch(colors)}</p>
        </div>
      </div>
    </Panel>
  );
}
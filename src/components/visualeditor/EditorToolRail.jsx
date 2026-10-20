import React from "react";
import { cn } from "@/lib/utils";
import { EDITOR_TOOLS } from "@/data/workspaceNav";

/**
 * The thin vertical toolbar that sits left of the chat: one icon per editor
 * tool, driving the same view as the canvas tabs on the right.
 */
export default function EditorToolRail({ activeTab, onSelectTool }) {
  return (
    <nav
      aria-label="Editor tools"
      className="w-14 shrink-0 bg-card/40 backdrop-blur-xl flex flex-col items-center py-2 gap-1 overflow-y-auto"
    >
      {EDITOR_TOOLS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectTool(id)}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border border-transparent transition-colors electric-hover",
              active ? "x1-active-glow" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
          </button>
        );
      })}
    </nav>
  );
}
import React from "react";
import { Plus, X } from "lucide-react";

/**
 * The browser strip above the editor: one tab per visual project, the way a
 * browser holds one tab per page. Selecting a tab pulls up the page it was left
 * on; the cross closes it and the plus opens another project beside it.
 */
export default function EditorTabStrip({ tabs, activeId, onSelect, onClose, onOpen }) {
  return (
    <div className="ve-tabbar">
      <div className="ve-tabs" aria-label="Visual projects">
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <div key={tab.id} className={"ve-tab" + (selected ? " selected" : "")}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                className="ve-tab-label"
                title={tab.title}
                onClick={() => onSelect(tab.id)}
              >
                <i className="ve-tab-dot" aria-hidden="true" />
                <span>{tab.title}</span>
              </button>
              <button
                type="button"
                className="ve-tab-close"
                aria-label={`Close ${tab.title}`}
                title="Close tab"
                onClick={() => onClose(tab.id)}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="ve-tab-new" onClick={onOpen} title="New visual project tab" aria-label="New tab">
        <Plus size={14} />
      </button>
    </div>
  );
}
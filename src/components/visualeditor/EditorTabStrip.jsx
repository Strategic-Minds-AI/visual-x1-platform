import React from "react";
import { X } from "lucide-react";

/**
 * The browser strip above the editor: one tab per visual project, the way a browser
 * holds one tab per page. Selecting a tab pulls up the page it was left on, and the
 * cross closes it. Opening another project lives at the top right of the editor
 * screen itself, in the editor's own toolbar.
 */
export default function EditorTabStrip({ tabs, activeId, onSelect, onClose }) {
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
    </div>
  );
}
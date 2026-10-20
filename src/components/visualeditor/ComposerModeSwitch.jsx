import React from "react";
import { COMPOSER_MODES } from "@/components/visualeditor/editorNav";

// The left column's two modes, switched the way the package switches its own
// panel between chat and history.
export default function ComposerModeSwitch({ leftMode, onChange }) {
  return (
    <div className="ve-pill-group" role="group" aria-label="Composer panel">
      {COMPOSER_MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`ve-pill${leftMode === id ? " selected" : ""}`}
          aria-pressed={leftMode === id}
        >
          <Icon size={12} />
          <span className="ve-pill-label">{label.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
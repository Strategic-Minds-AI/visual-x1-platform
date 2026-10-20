import React from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { CANVAS_VIEWS, COMPOSER_MODES } from "@/components/visualeditor/editorNav";

const DEVICES = [
  { id: "desktop", label: "Desktop preview", Icon: Monitor },
  { id: "tablet", label: "Tablet preview", Icon: Tablet },
  { id: "mobile", label: "Phone preview", Icon: Smartphone },
];

// The package's header band, in the console's own pill language: what is being
// built on the left, and the composer panel, canvas view and device frames on the
// right, with the live build status.
export default function EditorBand({ projectName, leftMode, canvasView, device, status, busy, onComposer, onCanvas, onDevice }) {
  return (
    <div className="ve-band">
      <div>
        <p className="cp-kicker">VISUAL EDITOR · PROMPT SYSTEM DRIVES THE CANVAS</p>
        <h3>{projectName}</h3>
      </div>

      <div className="ve-band-controls">
        <div className="ve-pill-group" role="group" aria-label="Composer panel">
          {COMPOSER_MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onComposer(id)}
              className={`ve-pill${leftMode === id ? " selected" : ""}`}
              aria-pressed={leftMode === id}
            >
              <Icon size={13} />
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="ve-pill-group" role="group" aria-label="Canvas view">
          {CANVAS_VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onCanvas(id)}
              className={`ve-pill${canvasView === id ? " selected" : ""}`}
              aria-pressed={canvasView === id}
            >
              <Icon size={13} />
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="ve-devices" role="group" aria-label="Preview device">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onDevice(id)}
              title={label}
              aria-label={label}
              aria-pressed={device === id}
              className={device === id ? "selected" : ""}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        <span className={`ve-status${busy ? " is-busy" : ""}`}>
          <i />
          {status}
        </span>
      </div>
    </div>
  );
}
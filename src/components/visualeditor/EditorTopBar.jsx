import React from "react";
import { Menu, Monitor, Tablet, Smartphone } from "lucide-react";

const DEVICES = [
  { id: "desktop", label: "Desktop preview", Icon: Monitor },
  { id: "tablet", label: "Tablet preview", Icon: Tablet },
  { id: "mobile", label: "Phone preview", Icon: Smartphone },
];

// The console's own top bar, holding the editor's live status and device frames.
export default function EditorTopBar({ view, device, onDevice, status, busy, onOpenNav }) {
  return (
    <header className="cp-portal-top">
      <p className="cp-breadcrumb">
        VISUAL EDITOR <b>{view}</b>
      </p>
      <div className="cp-portal-top-actions">
        <span className={`ve-status${busy ? " is-busy" : ""}`}>
          <i />
          {status}
        </span>
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
        <button className="cp-mobile-toggle" aria-label="Open navigation" onClick={onOpenNav}>
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
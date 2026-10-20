import React from "react";
import { Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import EditorSearch from "@/components/visualeditor/EditorSearch";

const DEVICES = [
  { id: "desktop", label: "Desktop preview", Icon: Monitor },
  { id: "tablet", label: "Tablet preview", Icon: Tablet },
  { id: "mobile", label: "Phone preview", Icon: Smartphone },
];

/**
 * The editor's bottom bar, in the shape of a desktop's own: the device frames and the
 * refresh on the left, the search in the middle, and the state tray on the right. The
 * canvas views and the project dashboard live on the top bar, where the reference
 * places them. The bar stays at the foot of the workspace, so a tool is never further
 * than the bottom edge of the screen it is used on.
 */
export default function EditorTaskbar({
  device,
  onDevice,
  onRefresh,
  status,
  busy,
  tabs,
  onSelectTab,
  onBuild,
  onAsk,
}) {
  return (
    <footer className="ve-taskbar">
      <div className="ve-taskbar-tools">
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
        <button className="ve-icon-btn" onClick={onRefresh} title="Refresh the canvas" aria-label="Refresh the canvas">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="ve-taskbar-search">
        <EditorSearch tabs={tabs} onBuild={onBuild} onAsk={onAsk} onSelectTab={onSelectTab} />
      </div>

      <div className="ve-taskbar-tray">
        <span className={`ve-status${busy ? " is-busy" : ""}`}>
          <i />
          {status}
        </span>
      </div>
    </footer>
  );
}
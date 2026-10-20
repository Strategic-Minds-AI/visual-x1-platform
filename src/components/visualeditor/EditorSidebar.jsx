import React from "react";
import { Link } from "react-router-dom";
import { X, LayoutDashboard } from "lucide-react";
import emblemArt from "@/assets/x1/silver-emblem.png";
import { COMPOSER_MODES, CANVAS_VIEWS } from "@/components/visualeditor/editorNav";

// The editor's navigation in the console's own sidebar: same shell, same logo
// lockup, same button classes. Selecting a composer panel and selecting a canvas
// view are independent, so both stay marked.
export default function EditorSidebar({ leftMode, canvasView, navOpen, onPickComposer, onPickCanvas, onClose }) {
  const group = (label, items, active, pick) => (
    <>
      <p className="cp-side-label">{label}</p>
      <nav aria-label={label}>
        {items.map(({ id, label: itemLabel, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => pick(id)}
            className={active === id ? "selected" : ""}
            aria-current={active === id ? "true" : undefined}
          >
            <Icon size={17} />
            {itemLabel}
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <aside className={`cp-sidebar${navOpen ? " cp-sidebar-open" : ""}`}>
      <div className="cp-sidebar-head">
        <Link to="/admin" className="cp-portal-logo">
          <span className="cp-brand-mark">
            <img src={emblemArt} alt="Metallic S emblem" />
          </span>
          <span>
            STRATEGIC MINDS <b>AI</b>
            <small>VISUAL EDITOR</small>
          </span>
        </Link>
        <button className="cp-sidebar-close" aria-label="Close navigation" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {group("COMPOSER", COMPOSER_MODES, leftMode, onPickComposer)}
      {group("CANVAS", CANVAS_VIEWS, canvasView, onPickCanvas)}

      <div className="cp-sidebar-bottom">
        <p className="cp-panel-note">
          Builds are rendered by the prompt system and shown on the canvas. Nothing is published from here.
        </p>
        <Link className="cp-back-site" to="/admin">
          <LayoutDashboard size={16} /> BACK TO OPERATOR CONSOLE
        </Link>
      </div>
    </aside>
  );
}
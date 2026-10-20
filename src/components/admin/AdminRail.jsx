import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Boxes, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import emblemArt from "@/assets/x1/silver-emblem.png";
import { CONSOLE_SECTIONS, RAIL_MODULES } from "@/data/adminModules";
import ModuleHub from "@/components/admin/ModuleHub";

/**
 * The console's navigation: the portal's own sidebar, carrying both the console
 * sections and the Visual X modules, so it is the way into the rest of the
 * system's technology.
 *
 * Every section shows it at full size — the portal's labelled sidebar, in flow
 * from a handset up. Only the Visual Editor thins it: there the console renders
 * this same rail inside the editor's row, where the `collapsible` mode draws the
 * page buttons as icon tiles (hover names them) and offers the toggle that expands
 * it back to the labelled sidebar. Below a handset the portal's off-canvas drawer
 * takes over, where a rail would eat the content width.
 */
export default function AdminRail({
  section,
  onSection,
  pending,
  collapsible = false,
  railOpen = false,
  onToggleRail,
  navOpen,
  onCloseNav,
}) {
  const { pathname } = useLocation();
  const [hubOpen, setHubOpen] = useState(false);

  return (
    <>
      <aside className={`cp-sidebar admin-rail${navOpen ? " cp-sidebar-open" : ""}`}>
        <div className="cp-sidebar-head">
          <Link to="/v2/b" className="cp-portal-logo" title="Strategic Minds AI" onClick={onCloseNav}>
            <span className="cp-brand-mark">
              <img src={emblemArt} alt="Strategic Minds AI emblem" />
            </span>
            <span className="cp-rail-label">
              STRATEGIC MINDS <b>AI</b>
              <small>OPERATOR CONSOLE</small>
            </span>
          </Link>
          <button className="cp-sidebar-close" aria-label="Close navigation" onClick={onCloseNav}>
            <X size={18} />
          </button>
        </div>

        <nav aria-label="Console sections">
          {CONSOLE_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => {
                onCloseNav();
                onSection(id);
              }}
              aria-current={section === id ? "page" : undefined}
              className={section === id ? "selected" : ""}
            >
              <Icon size={17} />
              <span className="cp-rail-label">{label}</span>
              {id === "approvals" && pending !== null && pending > 0 && <span className="cp-side-count">{pending}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-rail-rule" />

        <nav aria-label="Visual X modules">
          {RAIL_MODULES.map(({ to, label, Icon }) => (
            <Link key={to} to={to} title={label} className={`admin-rail-item${pathname === to ? " selected" : ""}`}>
              <Icon size={17} />
              <span className="cp-rail-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="cp-sidebar-bottom">
          <button className="admin-rail-toggle" type="button" title="All Visual X modules" onClick={() => setHubOpen(true)}>
            <Boxes size={17} />
            <span className="cp-rail-label">ALL MODULES</span>
          </button>
          {collapsible && (
            <button
              className="admin-rail-toggle"
              type="button"
              onClick={onToggleRail}
              title={railOpen ? "Collapse the rail" : "Expand the rail"}
            >
              {railOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
              <span className="cp-rail-label">{railOpen ? "COLLAPSE" : "EXPAND"}</span>
            </button>
          )}
        </div>
      </aside>

      <ModuleHub open={hubOpen} onOpenChange={setHubOpen} />
    </>
  );
}
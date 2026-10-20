import React from "react";
import { Menu } from "lucide-react";

/**
 * The console's own header strip: which section is open, that every row on it is
 * read from live records, and — below a handset, where the sidebar becomes the
 * portal's off-canvas drawer — the trigger that opens it. The Visual Editor does
 * not use it: that section is the editor's own page, header and footer included.
 */
export default function ConsoleHeader({ label, onOpenNav }) {
  return (
    <header className="cp-portal-top">
      <p className="cp-breadcrumb">
        OPERATOR CONSOLE <b>{label}</b>
      </p>
      <div className="cp-portal-top-actions">
        <span className="cp-demo-pill">
          <span /> LIVE RECORDS
        </span>
        <button className="cp-mobile-toggle" aria-label="Open navigation" onClick={onOpenNav}>
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
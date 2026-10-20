import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import X1Call from "./X1Call";

const ASSETS = "/v2-assets/";

// Same labels and order as X1's own navigation. Internal destinations map onto
// this application's equivalent modules so every link stays reachable.
const PAGES = [
  { name: "HOME", to: "/x1-home" },
  { name: "SERVICES", hash: "#services" },
  { name: "SOLUTIONS", hash: "#services" },
  { name: "INDUSTRIES", hash: "#services" },
  { name: "PRICING", to: "/opportunities" },
  { name: "PORTAL", to: "/dashboard" },
  { name: "CONTACT", to: "/onboarding" },
];

export default function X1TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="v2-header">
      <div className="v2-header-grid">
        <Link className="v2-header-s" to="/x1-home" aria-label="Strategic Minds AI home">
          <img src={ASSETS + "silver-emblem.png"} alt="Metallic Strategic Minds S" />
        </Link>
        <X1Call eden />
        <div className="v2-nav-shell">
          <button
            type="button"
            className="v2-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-controls="v2-links"
            aria-expanded={open}
            onClick={() => setOpen((x) => !x)}
          >
            <span>EXPLORE</span>{open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav id="v2-links" className={"v2-nav-links" + (open ? " v2-nav-open" : "")} aria-label="Main navigation">
            {PAGES.map(({ name, to, hash }, i) =>
              to ? (
                <Link key={name} to={to} aria-current={i === 0 ? "page" : undefined} onClick={() => setOpen(false)}>{name}</Link>
              ) : (
                <a key={name} href={hash} onClick={() => setOpen(false)}>{name}</a>
              )
            )}
          </nav>
        </div>
        <X1Call />
      </div>
    </header>
  );
}
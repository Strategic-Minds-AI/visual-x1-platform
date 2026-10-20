import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, ChevronDown, ChevronRight, ExternalLink, LockKeyhole,
  Menu, ShieldCheck, Sparkles, X,
} from "lucide-react";
import {
  NAV, APPROVAL_ITEMS, Overview, ProjectSection, ApprovalSection, LeadsSection,
  AssetsSection, BillingSection, SupportSection, PortalGateway,
} from "@/components/x1portal/PortalSections";

// Ported from X1: apps/strategic-minds-v2/src/ClientPortalExperience.jsx
// X1's CommercePortal.css and BrandTheme.css are self-hosted byte-exact under
// public/x1 and linked in index.html.

function Logo() {
  return <Link to="/v2/a" className="cp-portal-logo"><span className="cp-brand-mark"><img src="/v2-assets/silver-emblem.png" alt="Metallic S emblem" /></span><span>STRATEGIC MINDS <b>AI</b><small>YOUR INTELLIGENCE WORKSPACE</small></span></Link>;
}

function DemoPill() {
  return <span className="cp-demo-pill"><span /> SANDBOX DEMO · SYNTHETIC DATA</span>;
}

function PortalDemo() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("section") || "overview";
  const section = NAV.some((x) => x.id === requested) ? requested : "overview";
  const [menu, setMenu] = useState(false);
  const [approvals, setApprovals] = useState(Object.fromEntries(APPROVAL_ITEMS.map((x) => [x.id, "pending"])));
  const changeTab = (id) => { setParams({ section: id }); setMenu(false); window.scrollTo({ top: 0, behavior: "auto" }); };
  const Active = ({ overview: <Overview switchTab={changeTab} approvals={approvals} />, projects: <ProjectSection switchTab={changeTab} />, approvals: <ApprovalSection approvals={approvals} setApprovals={setApprovals} />, leads: <LeadsSection />, assets: <AssetsSection />, billing: <BillingSection />, support: <SupportSection /> })[section];
  return <div className="cp-site cp-portal-shell">
    <aside className={"cp-sidebar" + (menu ? " cp-sidebar-open" : "")}>
      <div className="cp-sidebar-head"><Logo /><button className="cp-sidebar-close" onClick={() => setMenu(false)} aria-label="Close portal navigation"><X size={20} /></button></div>
      <div className="cp-side-label">WORKSPACE / SYNTHETIC EXAMPLE</div>
      <div className="cp-workspace-picker"><div className="cp-workspace-avatar">D</div><div><strong>Demo Company</strong><span>SAMPLE CLIENT · NO ACCOUNT</span></div><ChevronDown size={15} /></div>
      <nav aria-label="Client portal sections">{NAV.map(({ id, name, icon: Icon }) => <button className={section === id ? "selected" : ""} aria-current={section === id ? "page" : undefined} key={id} onClick={() => changeTab(id)}><Icon size={19} />{name}{id === "approvals" && <span className="cp-side-count">{Object.values(approvals).filter((x) => x === "pending").length}</span>}</button>)}</nav>
      <div className="cp-sidebar-bottom"><div className="cp-side-eden"><Sparkles size={20} /><strong>EDEN SKYE</strong><p>Your AI concierge experience.</p><Link to="/v2/c">MEET EDEN <ArrowRight size={15} /></Link></div><Link className="cp-back-site" to="/v2/a"><ExternalLink size={16} /> RETURN TO WEBSITE</Link></div>
    </aside>
    <div className="cp-portal-main">
      <header className="cp-portal-top"><button onClick={() => setMenu(true)} className="cp-mobile-toggle" aria-label="Open portal navigation" aria-expanded={menu}><Menu size={21} /></button><div className="cp-breadcrumb">CLIENT EXPERIENCE <ChevronRight size={15} /> <b>{NAV.find((x) => x.id === section)?.name}</b></div><div className="cp-portal-top-actions"><DemoPill /><Link to="/pricing" className="cp-pricing-link">EXPLORE PRICING <ArrowUpRight size={15} /></Link><span className="cp-account-avatar">D</span></div></header>
      <div className="cp-demo-ribbon"><ShieldCheck size={18} /><span>This is an interactive <strong>sample portal</strong>. No authentication, real leads, live billing, uploaded assets or customer data are connected.</span></div>
      {Active}
      <footer className="cp-portal-footer"><span>STRATEGIC MINDS AI · INTELLIGENCE IN MOTION</span><span>X1 CLIENT EXPERIENCE · DEVELOPMENT PREVIEW</span></footer>
    </div>
    {menu && <button className="cp-sidebar-backdrop" aria-label="Close navigation menu" onClick={() => setMenu(false)} />}
  </div>;
}

export default function ClientPortalExperience({ demo = false }) {
  return demo ? <PortalDemo /> : <PortalGateway />;
}
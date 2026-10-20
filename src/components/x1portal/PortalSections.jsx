import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2, ChevronRight,
  ClipboardCheck, Clock3, Download, FileCheck, FolderOpen, LayoutDashboard, LockKeyhole,
  MessageCircle, Phone, Search, ShieldCheck, Sparkles, Wallet, Workflow,
} from "lucide-react";

// Ported from X1: apps/strategic-minds-v2/src/ClientPortalExperience.jsx
// (data, shared pieces and the seven portal workspaces). The shell lives in
// src/pages/ClientPortalExperience.jsx.

export const NAV = [
  { id: "overview", name: "Overview", icon: LayoutDashboard },
  { id: "projects", name: "Projects", icon: Workflow },
  { id: "approvals", name: "Approvals", icon: ClipboardCheck },
  { id: "leads", name: "Lead Center", icon: BarChart3 },
  { id: "assets", name: "Creative Vault", icon: FolderOpen },
  { id: "billing", name: "Billing", icon: Wallet },
  { id: "support", name: "Support", icon: MessageCircle },
];
export const STAGES = [
  { key: "discover", label: "Discover", note: "Vision and discovery", status: "complete" },
  { key: "strategy", label: "Strategy", note: "Roadmap and architecture", status: "complete" },
  { key: "identity", label: "Identity", note: "Logo and brand review", status: "current" },
  { key: "experience", label: "Experience", note: "Website and AI journey", status: "pending" },
  { key: "validate", label: "Validate", note: "Independent QA and release gates", status: "pending" },
  { key: "launch", label: "Launch", note: "Customer-approved release", status: "pending" },
];
export const ASSETS = [
  { name: "Brand Direction · Concept A", type: "Brand Pack", version: "V1", state: "Needs review" },
  { name: "Corporate Site · Homepage", type: "Web Pack", version: "Preview 02", state: "In design" },
  { name: "Tone & Messaging Guide", type: "Brand Pack", version: "Draft", state: "Shared for review" },
  { name: "Social Launch Templates", type: "Social Pack", version: "Not started", state: "Queued" },
];
export const LEADS = [
  { name: "Sample Inquiry 001", channel: "Website", service: "AI Reception", status: "New", when: "Today" },
  { name: "Sample Inquiry 002", channel: "Phone", service: "Automation", status: "Qualified", when: "Yesterday" },
  { name: "Sample Inquiry 003", channel: "Referral", service: "AI Website", status: "Follow-up", when: "Earlier" },
  { name: "Sample Inquiry 004", channel: "Website", service: "Consulting", status: "New", when: "Earlier" },
];
export const APPROVAL_ITEMS = [
  { id: "identity-01", type: "BRAND PACK", title: "Brand direction · Concept A", detail: "Review the mark, colors, and visual direction before design expands.", date: "Demo milestone" },
  { id: "web-01", type: "WEB PACK", title: "Homepage · Cinematic Direction", detail: "Review the homepage composition, copy hierarchy and Call Eden experience.", date: "Demo milestone" },
  { id: "social-01", type: "SOCIAL PACK", title: "Social visual style · Draft", detail: "Sample social concept follows the approved brand direction.", date: "Future milestone" },
];

export function SectionTitle({ eyebrow, title, description, children }) {
  return <div className="cp-portal-title"><div><p className="cp-kicker">{eyebrow}</p><h2>{title}</h2>{description && <p>{description}</p>}</div>{children && <div className="cp-portal-title-action">{children}</div>}</div>;
}

export function Metric({ icon: Icon, label, value, foot, accent = false }) {
  return <div className={"cp-metric" + (accent ? " cp-metric-accent" : "")}><div className="cp-metric-top"><span>{label}</span><Icon size={22} /></div><strong>{value}</strong><small>{foot}</small></div>;
}

export function Overview({ switchTab, approvals }) {
  return <div className="cp-portal-content">
    <div className="cp-welcome"><div><p className="cp-kicker">GOOD TO SEE YOU · DEMO EXPERIENCE</p><h1>Ideas, meet <em>momentum.</em></h1><p>A beautifully simple home for your projects, approvals and the work we’re building together.</p><div className="cp-welcome-actions"><button onClick={() => switchTab("projects")} className="cp-green-button">VIEW PROJECT <ArrowRight size={17} /></button><button onClick={() => switchTab("approvals")} className="cp-portal-light-button">REVIEW APPROVALS <ArrowUpRight size={16} /></button></div></div><div className="cp-welcome-globe"><img alt="" src="https://www.strategicmindsai.com/v2-assets/connected-earth.jpg" /></div></div>
    <div className="cp-metrics">
      <Metric label="Active Projects" value="01" icon={Workflow} foot="Illustrative project workspace" accent />
      <Metric label="Awaiting Review" value={String(Object.values(approvals).filter((x) => x === "pending").length).padStart(2, "0")} icon={ClipboardCheck} foot="Local demo decisions only" />
      <Metric label="Lead Inquiries" value="04" icon={BarChart3} foot="Synthetic example records" />
      <Metric label="Milestones" value="02 / 06" icon={Activity} foot="Example delivery progression" />
    </div>
    <div className="cp-two-col"><div className="cp-portal-panel cp-project-spot"><div className="cp-panel-top"><span className="cp-kicker">YOUR PROJECT</span><button onClick={() => switchTab("projects")} className="cp-text-link">FULL TIMELINE <ArrowUpRight size={15} /></button></div>
      <h3>Intelligent Business Launch</h3><p>A sample project showing how your dedicated Strategic Minds AI portal could work.</p>
      <div className="cp-project-progress"><span>ILLUSTRATIVE PROGRESS</span><strong>2 OF 6 STAGES</strong></div><div className="cp-progress-bar"><i style={{ width: "33.3%" }} /></div>
      <div className="cp-milestone-list">{STAGES.slice(0, 4).map((item) => <div key={item.key}><span className={"cp-stage-dot " + item.status} /><div><strong>{item.label}</strong><small>{item.note}</small></div><span className={"cp-stage-status " + item.status}>{item.status === "current" ? "In review" : item.status}</span></div>)}</div>
    </div>
      <div className="cp-portal-panel cp-eden-portal"><div className="cp-panel-top"><span className="cp-kicker">MEET YOUR AI GUIDE</span><Sparkles size={18} color="#88ffba" /></div><div className="cp-eden-portal-body"><div><h3>Have a question?<br /><em>Ask Eden.</em></h3><p>Explore your next idea, prepare for onboarding or speak with our team.</p><Link to="/v2/c#onboarding" className="cp-green-button">MEET EDEN <ArrowRight size={17} /></Link></div><img src="https://www.strategicmindsai.com/v2-assets/eden-skye-original.avif" alt="Eden Skye AI assistant portrait" loading="lazy" /></div><p className="cp-panel-note">Current preview is guided text onboarding. Live avatar and voice are not yet connected.</p></div></div>
    <div className="cp-portal-panel cp-recent"><div className="cp-panel-top"><span className="cp-kicker">NEXT STEPS</span><button className="cp-text-link" onClick={() => switchTab("approvals")}>ALL APPROVALS <ArrowUpRight size={15} /></button></div>
      <div className="cp-next-items">{APPROVAL_ITEMS.map((item) => <button key={item.id} onClick={() => switchTab("approvals")}><span className="cp-tiny-icon"><FileCheck size={20} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={18} /></button>)}</div>
    </div>
  </div>;
}

export function ProjectSection({ switchTab }) {
  return <div className="cp-portal-content"><SectionTitle eyebrow="YOUR WORK, ONE PLACE" title="Project workspace" description="A sample of the approval-first project timeline. Every task and milestone shown here is synthetic." />
    <div className="cp-portal-panel cp-full-project"><div className="cp-project-banner"><div><p className="cp-kicker">EXAMPLE ENGAGEMENT · NO LIVE TASKS</p><h3>Intelligent Business Launch</h3><p>AI strategy · Digital identity · Website experience</p></div><span className="cp-state-pill">DESIGN REVIEW</span></div>
      <div className="cp-project-flow">{STAGES.map((stage, i) => <div key={stage.key} className={"cp-project-stage " + stage.status}><div className="cp-project-stage-marker">{stage.status === "complete" ? <Check size={18} /> : String(i + 1).padStart(2, "0")}</div><div><span>STAGE {String(i + 1).padStart(2, "0")}</span><h4>{stage.label}</h4><p>{stage.note}</p></div><span className="cp-stage-status">{stage.status === "current" ? "In review" : stage.status}</span></div>)}</div>
      <div className="cp-project-action"><ShieldCheck size={21} /><p>Nothing advances to public release without an approved scope, verified readiness and your explicit authorization.</p><button onClick={() => switchTab("approvals")} className="cp-outline">VIEW APPROVALS <ArrowRight size={16} /></button></div>
    </div></div>;
}

export function ApprovalSection({ approvals, setApprovals }) {
  const [filter, setFilter] = useState("all");
  const [history, setHistory] = useState([]);
  const items = APPROVAL_ITEMS.filter((i) => filter === "all" || approvals[i.id] === filter);
  const decide = (id, value) => { setApprovals((s) => ({ ...s, [id]: value })); setHistory((s) => [{ id, value, at: "This browser session" }, ...s].slice(0, 8)); };
  return <div className="cp-portal-content"><SectionTitle eyebrow="APPROVAL-FIRST WORKFLOW" title="Approval center" description="Inspect concept directions and try the decision controls. These actions never submit approvals to X1.">
    <span className="cp-state-pill">LOCAL DEMO ACTIONS</span></SectionTitle>
    <div className="cp-filter-pills" role="group" aria-label="Filter approvals">{[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["changes", "Changes requested"]].map(([v, label]) => <button key={v} className={filter === v ? "active" : ""} onClick={() => setFilter(v)}>{label}</button>)}</div>
    <div className="cp-approval-grid">{items.map((item) => <div key={item.id} className="cp-portal-panel cp-approval-card">
      <div className="cp-approval-art"><span>{item.type}</span><div className="cp-approval-shape"><div /></div></div>
      <div className="cp-approval-detail"><p className="cp-kicker">{item.date}</p><h3>{item.title}</h3><p>{item.detail}</p>
        <span className={"cp-status-label " + approvals[item.id]}>{approvals[item.id] === "changes" ? "Changes requested" : approvals[item.id]}</span>
        <div className="cp-approval-buttons"><button onClick={() => decide(item.id, "approved")} className="cp-approve"><Check size={16} /> APPROVE IN DEMO</button><button onClick={() => decide(item.id, "changes")} className="cp-request-changes">REQUEST CHANGES</button></div>
      </div></div>)}</div>
    {items.length === 0 && <div className="cp-empty"><CheckCircle2 size={28} /> No items match this filter.</div>}
    <div className="cp-disclaimer"><ShieldCheck size={20} /><p><strong>Safety boundary:</strong> Decisions exist in page memory only and reset on refresh. Real approval receipts, signed agreements and provisioning require authenticated X1 integration.</p></div>
    {history.length > 0 && <div className="cp-portal-panel"><div className="cp-panel-top"><p className="cp-kicker">LOCAL INTERACTION HISTORY</p><span className="cp-fine">NOT A BACKEND RECEIPT</span></div>{history.map((h, i) => <p key={i} className="cp-history-line">{h.id} · <strong>{h.value}</strong> · {h.at}</p>)}</div>}
  </div>;
}

export function LeadsSection() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const rows = LEADS.filter((x) => (status === "all" || x.status === status) && [x.name, x.channel, x.service].join(" ").toLowerCase().includes(q.toLowerCase()));
  return <div className="cp-portal-content"><SectionTitle eyebrow="YOUR GROWTH, VISIBLE" title="Lead center" description="Explore how inquiries, qualification and follow-ups could appear in your real portal. Every record is synthetic." />
    <div className="cp-metrics"><Metric icon={BarChart3} label="Sample Inquiries" value="04" foot="Illustration only" /><Metric icon={CheckCircle2} label="Qualified Samples" value="01" foot="Synthetic categorization" /><Metric icon={Clock3} label="Follow-up Samples" value="01" foot="No automated messages" /><Metric icon={ShieldCheck} label="Data Source" value="DEMO" foot="Not connected to CRM" accent /></div>
    <div className="cp-portal-panel cp-leads"><div className="cp-lead-tools"><div className="cp-search"><Search size={18} /><input aria-label="Search sample leads" placeholder="Search sample inquiries..." value={q} onChange={(e) => setQ(e.target.value)} /></div><select aria-label="Filter lead status" value={status} onChange={(e) => setStatus(e.target.value)}>{["all", "New", "Qualified", "Follow-up"].map((x) => <option key={x}>{x}</option>)}</select></div>
      <div className="cp-table-wrap"><table><thead><tr><th>INQUIRY</th><th>CHANNEL</th><th>INTEREST</th><th>STATUS</th><th>TIME</th></tr></thead><tbody>{rows.map((x) => <tr key={x.name}><td><span className="cp-lead-avatar">{x.name.slice(-3)}</span><strong>{x.name}</strong></td><td>{x.channel}</td><td>{x.service}</td><td><span className="cp-lead-status">{x.status}</span></td><td>{x.when}</td></tr>)}</tbody></table></div>
      {rows.length === 0 && <div className="cp-empty">No sample records matched.</div>}
    </div>
  </div>;
}

export function AssetsSection() {
  const [query, setQuery] = useState("");
  return <div className="cp-portal-content"><SectionTitle eyebrow="ONE LIBRARY. EVERY DELIVERABLE." title="Creative vault" description="Organize logo packs, brand packs, website concepts and social assets. File storage is not connected in this preview." />
    <div className="cp-portal-panel"><div className="cp-panel-top"><span className="cp-kicker">SAMPLE DELIVERABLE LIBRARY</span><span className="cp-state-pill">NO CLOUD FILES</span></div><div className="cp-search cp-asset-search"><Search size={18} /><input placeholder="Find a sample asset..." aria-label="Search demo assets" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <div className="cp-asset-list">{ASSETS.filter((x) => [x.name, x.type].join(" ").toLowerCase().includes(query.toLowerCase())).map((x) => <div key={x.name}><div className="cp-asset-icon"><FolderOpen size={24} /></div><div><h3>{x.name}</h3><span>{x.type} · {x.version}</span></div><span className="cp-asset-state">{x.state}</span><button disabled title="Connect authenticated Drive storage before downloads" className="cp-disabled-icon" aria-label={"Download " + x.name + " unavailable in demo"}><Download size={18} /></button></div>)}</div>
      <div className="cp-disclaimer"><LockKeyhole size={18} /><p>Drive/Supabase asset delivery, secure previews and signed revision receipts will be provided by the X1 backend integration.</p></div>
    </div>
  </div>;
}

export function BillingSection() {
  return <div className="cp-portal-content"><SectionTitle eyebrow="COMMERCE & AGREEMENTS" title="Billing & agreements" description="Commercial information becomes available after a signed, accepted scope and secure client account setup." />
    <div className="cp-billing-cards"><div className="cp-portal-panel cp-billing-empty"><div className="cp-billing-icon"><Wallet size={30} /></div><h3>No live billing connected.</h3><p>This is a sample portal. There are no invoices, payment methods, deposits, subscription charges or contracts attached to this page.</p><Link className="cp-green-button" to="/pricing">EXPLORE ENGAGEMENTS <ArrowRight size={17} /></Link></div>
      <div className="cp-portal-panel"><p className="cp-kicker">PLANNED FINANCIAL WORKFLOW</p><div className="cp-billing-steps">{[["01", "Scope approved"], ["02", "Agreement electronically signed"], ["03", "Deposit verified by payment provider"], ["04", "Client workspace and project activated"]].map(([no, title]) => <div key={no}><span>{no}</span><strong>{title}</strong><LockKeyhole size={16} /></div>)}</div><div className="cp-disclaimer"><ShieldCheck size={18} /><p>These are proposed secure release gates, not evidence that invoicing or account provisioning is connected.</p></div></div></div>
  </div>;
}

export function SupportSection() {
  return <div className="cp-portal-content"><SectionTitle eyebrow="REAL HELP WHEN YOU NEED IT" title="Support & conversations" description="Choose how you'd like to reach Strategic Minds AI. We won't pretend a live support inbox is already connected." />
    <div className="cp-support-cards">
      <a href="tel:+17722090266" className="cp-portal-panel cp-support-option"><Phone size={32} /><h3>Call our team</h3><p>For questions, project discussions and next steps.</p><span>(772) 209-0266 <ArrowUpRight size={17} /></span></a>
      <a href="tel:+18665711174" className="cp-portal-panel cp-support-option"><Sparkles size={32} /><h3>Call Eden</h3><p>Explore our proposed AI welcome experience.</p><span>(866) 571-1174 <ArrowUpRight size={17} /></span></a>
      <a href="mailto:jeremy@strategicmindsai.com" className="cp-portal-panel cp-support-option"><MessageCircle size={32} /><h3>Send a message</h3><p>Open an email draft in your own mail application.</p><span>EMAIL US <ArrowUpRight size={17} /></span></a>
    </div><div className="cp-disclaimer"><ShieldCheck size={18} /><p>Twilio call routing and a two-way ticket inbox have not been verified; the links use normal phone/email actions only.</p></div>
  </div>;
}

export function PortalGateway() {
  return <div className="cp-site cp-gateway"><div className="cp-gateway-stars" /><div className="cp-gateway-shell">
    <header><Link to="/v2/a"><img src="https://www.strategicmindsai.com/v2-assets/silver-emblem.png" alt="Strategic Minds AI emblem" /><span>STRATEGIC MINDS <b>AI</b></span></Link><Link to="/pricing">OUR ENGAGEMENTS <ArrowUpRight size={16} /></Link></header>
    <main><div className="cp-gateway-card"><p className="cp-kicker"><span className="cp-signal" /> YOUR INTELLIGENCE WORKSPACE</p><div className="cp-gateway-emblem"><ShieldCheck size={34} /></div><h1>One portal.<br /><em>Every possibility.</em></h1><p>Projects, your creative assets, approvals, leads, and more. Your entire AI journey in one beautifully simple place.</p>
      <div className="cp-gateway-auth"><LockKeyhole size={19} /><div><strong>Secure sign-in is being connected.</strong><small>No live account access is available on this development preview.</small></div></div>
      <Link to="/portal/demo" className="cp-green-button">EXPLORE INTERACTIVE DEMO <ArrowRight size={18} /></Link><p className="cp-fine">Demo data is synthetic. Real authentication is not active.</p>
      <div className="cp-gateway-bottom"><span>ALREADY WORKING WITH US?</span><a href="mailto:jeremy@strategicmindsai.com?subject=Client%20Portal%20Access">REQUEST ACCESS <ArrowUpRight size={15} /></a></div>
    </div><div className="cp-gateway-decor"><img src="https://www.strategicmindsai.com/v2-assets/connected-earth.jpg" alt="Glowing connected Earth artwork" /><div><span>DISCOVER</span><span>CREATE</span><span>APPROVE</span><span>GROW</span></div></div></main>
  </div></div>;
}
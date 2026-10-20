import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2, ChevronRight,
  ClipboardCheck, Clock3, FileCheck, FolderOpen, LayoutDashboard, LockKeyhole,
  MessageCircle, Phone, ShieldCheck, Sparkles, Wallet, Workflow,
} from "lucide-react";

// Ported from X1: apps/strategic-minds-v2/src/ClientPortalExperience.jsx
// (navigation, shared pieces and the seven portal workspaces). The shell lives in
// src/pages/ClientPortalExperience.jsx.
//
// No synthetic records live here. Every workspace reflects the real state of the
// account, which is empty until work is actually delivered into it.

export const NAV = [
  { id: "overview", name: "Overview", icon: LayoutDashboard },
  { id: "projects", name: "Projects", icon: Workflow },
  { id: "approvals", name: "Approvals", icon: ClipboardCheck },
  { id: "leads", name: "Lead Center", icon: BarChart3 },
  { id: "assets", name: "Creative Vault", icon: FolderOpen },
  { id: "billing", name: "Billing", icon: Wallet },
  { id: "support", name: "Support", icon: MessageCircle },
];

// The delivery process itself: the six stages every engagement moves through.
export const STAGES = [
  { key: "discover", label: "Discover", note: "Vision and discovery", status: "pending" },
  { key: "strategy", label: "Strategy", note: "Roadmap and architecture", status: "pending" },
  { key: "identity", label: "Identity", note: "Logo and brand review", status: "pending" },
  { key: "experience", label: "Experience", note: "Website and AI journey", status: "pending" },
  { key: "validate", label: "Validate", note: "Independent QA and release gates", status: "pending" },
  { key: "launch", label: "Launch", note: "Customer-approved release", status: "pending" },
];

export function SectionTitle({ eyebrow, title, description, children }) {
  return <div className="cp-portal-title"><div><p className="cp-kicker">{eyebrow}</p><h2>{title}</h2>{description && <p>{description}</p>}</div>{children && <div className="cp-portal-title-action">{children}</div>}</div>;
}

export function Metric({ icon: Icon, label, value, foot, accent = false }) {
  return <div className={"cp-metric" + (accent ? " cp-metric-accent" : "")}><div className="cp-metric-top"><span>{label}</span><Icon size={22} /></div><strong>{value}</strong><small>{foot}</small></div>;
}

export function Overview({ switchTab }) {
  return <div className="cp-portal-content">
    <div className="cp-welcome"><div><p className="cp-kicker">GOOD TO SEE YOU</p><h1>Ideas, meet <em>momentum.</em></h1><p>A beautifully simple home for your projects, approvals and the work we’re building together.</p><div className="cp-welcome-actions"><button onClick={() => switchTab("projects")} className="cp-green-button">VIEW PROJECTS <ArrowRight size={17} /></button><button onClick={() => switchTab("approvals")} className="cp-portal-light-button">REVIEW APPROVALS <ArrowUpRight size={16} /></button></div></div><div className="cp-welcome-globe"><img alt="" src="https://www.strategicmindsai.com/v2-assets/connected-earth.jpg" /></div></div>
    <div className="cp-metrics">
      <Metric label="Active Projects" value="00" icon={Workflow} foot="No project opened yet" accent />
      <Metric label="Awaiting Review" value="00" icon={ClipboardCheck} foot="Nothing waiting on you" />
      <Metric label="Lead Inquiries" value="00" icon={BarChart3} foot="Lead source not connected" />
      <Metric label="Milestones" value="—" icon={Activity} foot="Appears with your first engagement" />
    </div>
    <div className="cp-two-col"><div className="cp-portal-panel cp-project-spot"><div className="cp-panel-top"><span className="cp-kicker">YOUR PROJECT</span><button onClick={() => switchTab("projects")} className="cp-text-link">DELIVERY PROCESS <ArrowUpRight size={15} /></button></div>
      <h3>No engagement is active yet</h3><p>Once a scope is approved, your timeline, milestones and approval requests appear here.</p>
      <div className="cp-milestone-list">{STAGES.slice(0, 4).map((item) => <div key={item.key}><span className={"cp-stage-dot " + item.status} /><div><strong>{item.label}</strong><small>{item.note}</small></div><span className={"cp-stage-status " + item.status}>{item.status}</span></div>)}</div>
    </div>
      <div className="cp-portal-panel cp-eden-portal"><div className="cp-panel-top"><span className="cp-kicker">MEET YOUR AI GUIDE</span><Sparkles size={18} color="#88ffba" /></div><div className="cp-eden-portal-body"><div><h3>Have a question?<br /><em>Ask Eden.</em></h3><p>Explore your next idea, prepare for onboarding or speak with our team.</p><Link to="/v2/c#onboarding" className="cp-green-button">MEET EDEN <ArrowRight size={17} /></Link></div><img src="https://www.strategicmindsai.com/v2-assets/eden-skye-original.avif" alt="Eden Skye AI assistant portrait" loading="lazy" /></div><p className="cp-panel-note">Current preview is guided text onboarding. Live avatar and voice are not yet connected.</p></div></div>
    <div className="cp-portal-panel cp-recent"><div className="cp-panel-top"><span className="cp-kicker">NEXT STEPS</span><button className="cp-text-link" onClick={() => switchTab("approvals")}>APPROVAL CENTER <ArrowUpRight size={15} /></button></div>
      <div className="cp-empty"><FileCheck size={26} /> Nothing is waiting for your review.</div>
    </div>
  </div>;
}

export function ProjectSection({ switchTab }) {
  return <div className="cp-portal-content"><SectionTitle eyebrow="YOUR WORK, ONE PLACE" title="Project workspace" description="Each engagement moves through the same six stages, and none of them advances without your approval." />
    <div className="cp-portal-panel cp-full-project"><div className="cp-project-banner"><div><p className="cp-kicker">ENGAGEMENT TIMELINE</p><h3>No active engagement</h3><p>AI strategy · Digital identity · Website experience</p></div><span className="cp-state-pill">NOT STARTED</span></div>
      <div className="cp-project-flow">{STAGES.map((stage, i) => <div key={stage.key} className={"cp-project-stage " + stage.status}><div className="cp-project-stage-marker">{stage.status === "complete" ? <Check size={18} /> : String(i + 1).padStart(2, "0")}</div><div><span>STAGE {String(i + 1).padStart(2, "0")}</span><h4>{stage.label}</h4><p>{stage.note}</p></div><span className="cp-stage-status">{stage.status}</span></div>)}</div>
      <div className="cp-project-action"><ShieldCheck size={21} /><p>Nothing advances to public release without an approved scope, verified readiness and your explicit authorization.</p><button onClick={() => switchTab("approvals")} className="cp-outline">VIEW APPROVALS <ArrowRight size={16} /></button></div>
    </div></div>;
}

export function ApprovalSection() {
  return <div className="cp-portal-content"><SectionTitle eyebrow="APPROVAL-FIRST WORKFLOW" title="Approval center" description="Concept directions, revisions and release decisions arrive here for your review." />
    <div className="cp-empty"><CheckCircle2 size={28} /> Nothing is waiting for review.</div>
    <div className="cp-disclaimer"><ShieldCheck size={20} /><p><strong>Safety boundary:</strong> Nothing advances to public release without an approved scope, verified readiness and your explicit authorization.</p></div>
  </div>;
}

export function LeadsSection() {
  return <div className="cp-portal-content"><SectionTitle eyebrow="YOUR GROWTH, VISIBLE" title="Lead center" description="Inquiries, qualification and follow-ups appear here once a lead source is connected to your account." />
    <div className="cp-metrics"><Metric icon={BarChart3} label="Inquiries" value="00" foot="No source connected" /><Metric icon={CheckCircle2} label="Qualified" value="00" foot="No records yet" /><Metric icon={Clock3} label="Follow-ups" value="00" foot="No records yet" /><Metric icon={ShieldCheck} label="Data Source" value="—" foot="Not connected" accent /></div>
    <div className="cp-portal-panel cp-leads"><div className="cp-empty">No inquiries have been recorded yet.</div></div>
  </div>;
}

export function AssetsSection() {
  return <div className="cp-portal-content"><SectionTitle eyebrow="ONE LIBRARY. EVERY DELIVERABLE." title="Creative vault" description="Logo packs, brand packs, website concepts and social assets are stored here as they are produced." />
    <div className="cp-portal-panel"><div className="cp-panel-top"><span className="cp-kicker">DELIVERABLE LIBRARY</span><span className="cp-state-pill">NO FILES YET</span></div>
      <div className="cp-empty"><FolderOpen size={26} /> No deliverables have been published to your vault yet.</div>
      <div className="cp-disclaimer"><LockKeyhole size={18} /><p>Secure previews, signed revision receipts and asset downloads arrive with the X1 storage integration.</p></div>
    </div>
  </div>;
}

export function BillingSection() {
  return <div className="cp-portal-content"><SectionTitle eyebrow="COMMERCE & AGREEMENTS" title="Billing & agreements" description="Commercial information becomes available after a signed, accepted scope and secure account setup." />
    <div className="cp-billing-cards"><div className="cp-portal-panel cp-billing-empty"><div className="cp-billing-icon"><Wallet size={30} /></div><h3>No billing connected.</h3><p>There are no invoices, payment methods, deposits, subscription charges or contracts attached to this workspace.</p><Link className="cp-green-button" to="/pricing">EXPLORE ENGAGEMENTS <ArrowRight size={17} /></Link></div>
      <div className="cp-portal-panel"><p className="cp-kicker">RELEASE GATES</p><div className="cp-billing-steps">{[["01", "Scope approved"], ["02", "Agreement electronically signed"], ["03", "Deposit verified by payment provider"], ["04", "Client workspace and project activated"]].map(([no, title]) => <div key={no}><span>{no}</span><strong>{title}</strong><LockKeyhole size={16} /></div>)}</div><div className="cp-disclaimer"><ShieldCheck size={18} /><p>These are proposed secure release gates, not evidence that invoicing or account provisioning is connected.</p></div></div></div>
  </div>;
}

export function SupportSection() {
  return <div className="cp-portal-content"><SectionTitle eyebrow="REAL HELP WHEN YOU NEED IT" title="Support & conversations" description="Choose how you'd like to reach Strategic Minds AI." />
    <div className="cp-support-cards">
      <a href="tel:+17722090266" className="cp-portal-panel cp-support-option"><Phone size={32} /><h3>Call our team</h3><p>For questions, project discussions and next steps.</p><span>(772) 209-0266 <ArrowUpRight size={17} /></span></a>
      <a href="tel:+18665711174" className="cp-portal-panel cp-support-option"><Sparkles size={32} /><h3>Call Eden</h3><p>Explore our proposed AI welcome experience.</p><span>(866) 571-1174 <ArrowUpRight size={17} /></span></a>
      <a href="mailto:jeremy@strategicmindsai.com" className="cp-portal-panel cp-support-option"><MessageCircle size={32} /><h3>Send a message</h3><p>Open an email draft in your own mail application.</p><span>EMAIL US <ArrowUpRight size={17} /></span></a>
    </div><div className="cp-disclaimer"><ShieldCheck size={18} /><p>These links use normal phone and email actions. A live two-way ticket inbox is not connected yet.</p></div>
  </div>;
}

export function PortalGateway() {
  return <div className="cp-site cp-gateway"><div className="cp-gateway-stars" /><div className="cp-gateway-shell">
    <header><Link to="/v2/a"><img src="https://www.strategicmindsai.com/v2-assets/silver-emblem.png" alt="Strategic Minds AI emblem" /><span>STRATEGIC MINDS <b>AI</b></span></Link><Link to="/pricing">OUR ENGAGEMENTS <ArrowUpRight size={16} /></Link></header>
    <main><div className="cp-gateway-card"><p className="cp-kicker"><span className="cp-signal" /> YOUR INTELLIGENCE WORKSPACE</p><div className="cp-gateway-emblem"><ShieldCheck size={34} /></div><h1>One portal.<br /><em>Every possibility.</em></h1><p>Projects, your creative assets, approvals, leads, and more. Your entire AI journey in one beautifully simple place.</p>
      <div className="cp-gateway-auth"><LockKeyhole size={19} /><div><strong>Sign-in required.</strong><small>Your portal opens inside your authenticated workspace.</small></div></div>
      <Link to="/portal/workspace" className="cp-green-button">OPEN THE PORTAL WORKSPACE <ArrowRight size={18} /></Link><p className="cp-fine">Access follows your account permissions.</p>
      <div className="cp-gateway-bottom"><span>ALREADY WORKING WITH US?</span><a href="mailto:jeremy@strategicmindsai.com?subject=Client%20Portal%20Access">REQUEST ACCESS <ArrowUpRight size={15} /></a></div>
    </div><div className="cp-gateway-decor"><img src="https://www.strategicmindsai.com/v2-assets/connected-earth.jpg" alt="Glowing connected Earth artwork" /><div><span>DISCOVER</span><span>CREATE</span><span>APPROVE</span><span>GROW</span></div></div></main>
  </div></div>;
}
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, Compass, Layers3,
  Lightbulb, Rocket, ShieldCheck, Sparkles,
} from "lucide-react";
// X1's own styling for this workspace, bundled from the byte-exact copies taken
// from the X1 repository (vendor/x1/CommercePortal.css) plus its brand tokens.
import "../../vendor/x1/CommercePortal.css";
import "@/styles/x1-brand-theme.css";

// Ported from X1: apps/strategic-minds-v2/src/PricingExperience.jsx.

const PLAN_DATA = [
  { key: "launch", eyebrow: "01 / ESTABLISH", name: "AI Launch", subtitle: "Make your first AI investment count.", desc: "Discover a high-value use case and turn it into a verified first implementation.", features: ["AI discovery and opportunity mapping", "One scoped build or workflow", "Client project dashboard", "Milestone reviews and QA receipts", "Training and handoff"], badge: "START HERE" },
  { key: "growth", eyebrow: "02 / ACCELERATE", name: "AI Growth", subtitle: "Connect the pieces that drive growth.", desc: "Bring your website, customer journey and operational automations into one clear plan.", features: ["Everything in AI Launch", "Multiple connected workflows", "AI-assisted lead experience", "Original search-focused pages", "Conversion measurement plan", "Structured optimization roadmap"], badge: "EXPAND YOUR SYSTEM" },
  { key: "scale", eyebrow: "03 / TRANSFORM", name: "AI Enterprise", subtitle: "Architect what comes next.", desc: "Purpose-built intelligence systems for organizations with complex operations and multiple teams.", features: ["Multi-team requirements and architecture", "Custom agent and data integration design", "Security and governance review", "Staged rollout and quality gates", "Custom support and operations scope"], badge: "CUSTOM ARCHITECTURE" },
];
const OPTIONS = ["AI strategy", "AI reception & agents", "Workflow automation", "AI-powered website", "SEO / AEO / GEO", "Data intelligence"];

function QuoteRequest({ plan }) {
  const [services, setServices] = useState(["AI strategy"]);
  const [markets, setMarkets] = useState("One city / region");
  const [scope, setScope] = useState("New initiative");
  const chosen = useMemo(() => services.join(", ") || "To be discussed", [services]);
  const body = ["Strategic Minds AI | Preliminary engagement request", "", "Preferred package: " + plan, "Services: " + chosen, "Markets: " + markets, "Project status: " + scope, "", "Please contact me to discuss a scoped proposal, schedule and total cost.", "", "No price was estimated or agreed to through this preview."].join("\n");
  const mailto = "mailto:jeremy@strategicmindsai.com?subject=" + encodeURIComponent("Strategic Minds AI | " + plan + " proposal request") + "&body=" + encodeURIComponent(body);
  const toggle = (k) => setServices((s) => (s.includes(k) ? s.filter((i) => i !== k) : [...s, k]));
  return <div className="cp-quote" id="proposal-builder">
    <div className="cp-quote-heading"><div><p className="cp-kicker">DISCOVERY-FIRST PRICING</p><h2>Shape your project.<br /><em>Know what comes next.</em></h2><p>Choose your goals and we’ll prepare an itemized proposal. No invented prices, hidden checkout, or obligation.</p></div><div className="cp-quote-orb"><Lightbulb size={39} /><span>YOUR PLAN.<br />YOUR PACE.</span></div></div>
    <div className="cp-quote-grid">
      <fieldset className="cp-options"><legend>What would you like to build?</legend>
        {OPTIONS.map((item) => <label key={item} className={services.includes(item) ? "cp-option checked" : "cp-option"}><input type="checkbox" checked={services.includes(item)} onChange={() => toggle(item)} /><span className="cp-checkbox"><Check size={13} /></span>{item}</label>)}
      </fieldset>
      <div className="cp-quote-fields">
        <label htmlFor="cp-markets">Where will your solution operate?</label>
        <select id="cp-markets" value={markets} onChange={(e) => setMarkets(e.target.value)}>
          <option>One city / region</option><option>Multiple cities</option><option>Nationwide</option><option>International</option>
        </select>
        <label htmlFor="cp-scope">Where are you in the process?</label>
        <select id="cp-scope" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option>New initiative</option><option>Enhancing existing systems</option><option>Scaling a working solution</option>
        </select>
        <div className="cp-preview-ticket"><span><Sparkles size={16} /> YOUR DISCOVERY BRIEF</span><strong>{plan}</strong><p>{chosen}</p><small>{markets} · {scope}</small></div>
        <a className="cp-green-button" href={mailto} aria-label="Open an email draft requesting a custom proposal">REQUEST MY PROPOSAL <ArrowUpRight size={17} /></a>
        <p className="cp-fine">Opens an email draft. Nothing is automatically sent, charged or stored.</p>
      </div>
    </div>
  </div>;
}

export default function PricingExperience() {
  const [billing, setBilling] = useState("project");
  const [selected, setSelected] = useState("growth");
  const plan = PLAN_DATA.find((x) => x.key === selected) || PLAN_DATA[1];
  return <div className="cp-site cp-pricing">
    <a className="cp-skip" href="#pricing-content">Skip to content</a>
    <header className="cp-public-nav">
      <Link className="cp-brand" to="/v2/a"><span className="cp-brand-mark"><img src="https://www.strategicmindsai.com/v2-assets/silver-emblem.png" alt="Metallic S emblem" /></span><span>STRATEGIC MINDS <b>AI</b><small>INTELLIGENCE IN MOTION</small></span></Link>
      <nav aria-label="Pricing navigation"><Link to="/v2/a">HOME</Link><Link to="/v2/b#services">SERVICES</Link><Link to="/pricing" aria-current="page">PRICING</Link><Link to="/portal">CLIENT PORTAL</Link></nav>
      <a className="cp-header-call" href="tel:+18665711174"><Sparkles size={15} /> CALL EDEN</a>
    </header>
    <main id="pricing-content">
      <section className="cp-pricing-hero">
        <div className="cp-star-layer" />
        <div className="cp-hero-content"><div className="cp-label"><span className="cp-signal" /> THE NEXT MOVE IS YOURS</div>
          <h1>Powerful AI.<br /><em>Built around you.</em></h1>
          <p>From your first automation to an entire intelligence ecosystem. Find the right level of partnership without being buried in technical jargon.</p>
          <div className="cp-hero-actions"><a href="#packages" className="cp-primary">EXPLORE ENGAGEMENTS <ArrowRight size={17} /></a><Link to="/portal/workspace" className="cp-subtle">Open the client portal <ArrowUpRight size={16} /></Link></div>
        </div>
        <div className="cp-hero-visual" aria-hidden="true"><div className="cp-ring cp-ring-1" /><div className="cp-ring cp-ring-2" /><img src="https://www.strategicmindsai.com/v2-assets/silver-emblem.png" alt="" /><span>INTELLIGENCE IN MOTION</span></div>
      </section>
      <section id="packages" className="cp-package-section"><div className="cp-container">
        <div className="cp-section-heading"><p className="cp-kicker">THREE WAYS TO BEGIN</p><h2>The right partnership.<br /><em>Not a one-size-fits-all price.</em></h2><p>Project pricing is finalized after discovery, documented scope, delivery milestones and support requirements. No prices or inclusions are contracts until a proposal is accepted.</p></div>
        <div className="cp-billing-switch" role="group" aria-label="Engagement focus"><button className={billing === "project" ? "active" : ""} onClick={() => setBilling("project")}>PROJECT BUILD</button><button className={billing === "managed" ? "active" : ""} onClick={() => setBilling("managed")}>MANAGED PARTNERSHIP</button></div>
        <div className="cp-plans">{PLAN_DATA.map((p) => <article key={p.key} className={"cp-plan" + (selected === p.key ? " featured" : "")}>
          <div className="cp-plan-top"><span>{p.eyebrow}</span><span className="cp-plan-badge">{p.badge}</span></div>
          <h3>{p.name}</h3><p className="cp-plan-sub">{p.subtitle}</p>
          <div className="cp-price"><strong>Custom quote</strong><small>{billing === "project" ? "One-time project scope" : "Scoped recurring support, if needed"}</small></div>
          <p className="cp-plan-desc">{billing === "project" ? p.desc : "An ongoing engagement tailored around support, maintenance and measurable priorities."}</p>
          <ul>{p.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
          <button className={selected === p.key ? "cp-plan-action active" : "cp-plan-action"} onClick={() => { setSelected(p.key); document.getElementById("proposal-builder")?.scrollIntoView({ behavior: "smooth" }); }}>{selected === p.key ? "CUSTOMIZE THIS PLAN" : "EXPLORE THIS PLAN"} <ArrowRight size={16} /></button>
        </article>)}</div>
        <p className="cp-price-disclosure"><ShieldCheck size={16} /> Plans are proposed service directions. No approved public dollar pricing or live payment processing is configured.</p>
      </div></section>
      <section className="cp-build-panel-section"><div className="cp-container"><QuoteRequest plan={plan.name + (billing === "managed" ? " · Managed" : " · Project")} /></div></section>
      <section className="cp-process-section"><div className="cp-container">
        <div className="cp-section-heading"><p className="cp-kicker">HOW WE WORK</p><h2>Clear steps.<br /><em>Visible progress.</em></h2></div>
        <div className="cp-journey">{[{ n: "01", title: "Discover", icon: Compass, body: "Share your goals with our team or begin with Eden." }, { n: "02", title: "Scope", icon: Layers3, body: "Receive a written plan with deliverables, milestones and commercial terms." }, { n: "03", title: "Approve", icon: ShieldCheck, body: "Review the agreement and payment terms before work begins." }, { n: "04", title: "Build", icon: Rocket, body: "Follow the work through a private client portal once access is enabled." }].map((step) => { const Icon = step.icon; return <div className="cp-journey-step" key={step.n}><span className="cp-number">{step.n}</span><Icon size={28} /><h3>{step.title}</h3><p>{step.body}</p></div>; })}</div>
      </div></section>
      <section className="cp-faq-section"><div className="cp-container cp-faq-grid">
        <div><p className="cp-kicker">CLEAR ANSWERS</p><h2>Questions worth <em>asking.</em></h2><p>We prefer a conversation over surprising fine print.</p></div>
        <div className="cp-faq-list">{[["Why aren’t there fixed prices?", "The solution, integrations, implementation complexity and ongoing support differ from business to business. We provide an itemized quote after discovering the actual scope."], ["Can I start with one AI feature?", "Yes. A focused first project can validate value before expanding into connected workflows or a larger roadmap."], ["Will I see progress and deliverables?", "The proposed client portal includes milestones, deliverable previews and approval steps. Secure client access is still being integrated in this preview."], ["Does CALL EDEN connect to a live video agent?", "The current frontend links to the proposed Eden phone number. Live voice routing and real-time video are not yet verified."], ["Do you charge me when I select a plan?", "No. Selecting a plan only prepares a voluntary email request. It does not charge you or create an account."]].map(([q, a]) => <details key={q}><summary>{q}<ChevronDown size={18} /></summary><p>{a}</p></details>)}</div>
      </div></section>
      <section className="cp-final-cta"><div className="cp-container"><p className="cp-kicker">INTELLIGENCE IN MOTION</p><h2>Let's build what comes <em>next.</em></h2><p>Start with one conversation. We'll take it from there.</p><div className="cp-final-actions"><a href="#proposal-builder" className="cp-primary">BUILD MY PROPOSAL <ArrowRight size={16} /></a><a className="cp-outline" href="tel:+18665711174"><Sparkles size={16} /> CALL EDEN</a></div></div></section>
    </main>
    <footer className="cp-footer"><span>STRATEGIC MINDS AI · INTELLIGENCE IN MOTION</span><div><Link to="/v2/a">Home</Link><Link to="/portal">Client Portal</Link><a href="mailto:jeremy@strategicmindsai.com">Contact</a></div><small>© 2026 Strategic Minds AI. Preview-only pricing directions.</small></footer>
  </div>;
}
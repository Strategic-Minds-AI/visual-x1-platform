import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Bot, BrainCircuit, ChartNoAxesCombined, DatabaseZap,
  Globe2, Headphones, Search, Workflow,
} from "lucide-react";

const SERVICES = [
  { icon: BrainCircuit, title: "AI Strategy & Consulting", copy: "Practical AI opportunities, systems architecture and implementation plans." },
  { icon: Workflow, title: "Custom AI Systems & Automation", copy: "Connect people, processes and tools in intelligent workflows." },
  { icon: Bot, title: "AI Agents & Assistants", copy: "Supervised agents and assistants for repeatable business tasks." },
  { icon: Headphones, title: "AI Reception & Lead Systems", copy: "Improve inquiry capture, call routing, qualification and follow-up." },
  { icon: Globe2, title: "AI-Powered Websites", copy: "Original, compelling websites and measurable customer experiences." },
  { icon: DatabaseZap, title: "Data & Intelligence", copy: "Make operational data useful for confident business decisions." },
  { icon: Search, title: "SEO · AEO · GEO", copy: "Build genuinely useful content for search and AI-assisted discovery." },
  { icon: ChartNoAxesCombined, title: "Digital Growth", copy: "Research, experimentation and attribution for stronger outcomes." },
];

export default function X1ServiceGrid() {
  return (
    <section className="v2-section v2-services" id="services">
      <div className="v2-wrap">
        <div className="v2-heading">
          <p className="v2-eyebrow">WHAT WE BUILD</p>
          <h2>AI systems for <em>real business growth.</em></h2>
          <p>Build a better customer experience, simplify operations and discover what's possible with practical AI.</p>
        </div>
        <div className="v2-card-grid">
          {SERVICES.map(({ icon: Icon, title, copy }, i) => (
            <Link className="v2-service-card" id={i === 6 ? "visibility" : undefined} key={title} to="/onboarding">
              <span className="v2-card-icon"><Icon size={34} strokeWidth={1.45} /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <span className="v2-card-arrow"><ArrowUpRight size={19} /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, Copy, Gauge, Rocket, Sprout, Wand2 } from "lucide-react";
import X1SectionHeading from "@/components/x1home/X1SectionHeading";

// Each card opens the real Visual X surface it describes.
const MODULES = [
  {
    to: "/clone-ingest",
    Icon: Copy,
    title: "Ingestion and parity",
    line: "Capture a live site, host, repo, document or image; rebuild it; judge the result on operational and visual gates.",
  },
  {
    to: "/prompt-system",
    Icon: Wand2,
    title: "Prompt module system",
    line: "Versioned modules with declared inputs, output schemas, constraints, latency budgets and evaluation cases.",
  },
  {
    to: "/factory",
    Icon: Boxes,
    title: "Website factory",
    line: "One sentence in, a specified and independently validated site out, with repair cycles when the gates fail.",
  },
  {
    to: "/benchmarks",
    Icon: Gauge,
    title: "Benchmark library",
    line: "The reference gate every generation passes through, scored against the sites that define the standard.",
  },
  {
    to: "/seo-simulator",
    Icon: Sprout,
    title: "Growth engine",
    line: "Strategy simulation, programmatic structure, variation tracking and backlink health on one evidence base.",
  },
  {
    to: "/delivery",
    Icon: Rocket,
    title: "Delivery and verification",
    line: "Project-level deployment status, frame previewing, and post-deployment QA that runs on its own.",
  },
];

export default function X1ModuleGrid() {
  return (
    <section className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
        <X1SectionHeading
          eyebrow="What the system does"
          lead="Technology for"
          accent="real, provable outcomes."
          note="Six working surfaces, each backed by the same rule: if it was not executed and verified, it is not reported as done."
        />
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((m) => (
            <Link key={m.to} to={m.to} className="x1-glass rounded-xl p-5 flex flex-col gap-3 electric-hover">
              <m.Icon className="w-5 h-5 text-primary" />
              <h3 className="font-heading text-base font-bold tracking-tight">{m.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.line}</p>
              <span className="mt-auto pt-2 x1-track text-[9px] text-primary inline-flex items-center gap-1.5">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
import React from "react";
import X1SectionHeading from "@/components/x1home/X1SectionHeading";

const STAGES = [
  {
    step: "01",
    title: "Capture",
    line: "A URL, host, repository, markup, document or image is read into a deterministic signature: status, size, headings, nav, sections, forms, colours, fonts.",
  },
  {
    step: "02",
    title: "Specify",
    line: "The signature becomes a build specification, compiled by versioned prompt modules with typed inputs, acceptance criteria and failure behaviour.",
  },
  {
    step: "03",
    title: "Validate",
    line: "An independent validator runs the operational and visual gates against benchmark references. A score never authorises release on its own.",
  },
  {
    step: "04",
    title: "Improve",
    line: "Bounded repair cycles close the open defects, the QA loop refines what failed, and a receipt records exactly what was and was not verified.",
  },
];

export default function X1Approach() {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
        <X1SectionHeading
          eyebrow="Our approach"
          lead="Discover. Design."
          accent="Build. Improve."
          note="Four stages, in order, with a gate between each one. Nothing advances because it looks finished."
        />
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STAGES.map((s) => (
            <div key={s.step} className="x1-glass-flat rounded-xl p-5 flex flex-col gap-3">
              <span className="font-heading text-xs font-bold text-primary x1-track">{s.step}</span>
              <h3 className="font-heading text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
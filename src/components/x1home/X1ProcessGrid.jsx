import React from "react";

const STEPS = [
  ["01", "Discover", "Find your highest-value opportunity."],
  ["02", "Architect", "Select a practical system and milestones."],
  ["03", "Validate", "Build a real preview and verify outcomes."],
  ["04", "Improve", "Measure performance and refine."],
];

export default function X1ProcessGrid() {
  return (
    <section className="v2-section v2-process" id="process">
      <div className="v2-wrap">
        <div className="v2-heading">
          <p className="v2-eyebrow">OUR APPROACH</p>
          <h2>Discover. Design. <em>Build. Improve.</em></h2>
        </div>
        <div className="v2-process-grid">
          {STEPS.map(([n, title, copy]) => (
            <div key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
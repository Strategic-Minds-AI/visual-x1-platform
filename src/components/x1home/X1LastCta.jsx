import React from "react";
import X1Call from "./X1Call";
import X1MainCta from "./X1MainCta";

export default function X1LastCta() {
  return (
    <section className="v2-last-cta">
      <p className="v2-eyebrow">INTELLIGENCE IN MOTION</p>
      <h2>Make your next idea <em>intelligent.</em></h2>
      <div className="v2-last-buttons">
        <X1Call eden />
        <X1MainCta />
      </div>
    </section>
  );
}
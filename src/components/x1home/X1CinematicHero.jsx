import React from "react";
import X1Brand from "./X1Brand";
import X1Earth from "./X1Earth";
import X1MainCta from "./X1MainCta";

// X1 /v2/a — the cinematic mystery homepage: chrome S, wordmark, one clean CTA.
export default function X1CinematicHero() {
  return (
    <section className="v2-hero v2-earth-hero">
      <div className="v2-nebula" aria-hidden="true" />
      <X1Earth />
      <div className="v2-hero-center">
        <X1Brand />
        <div className="v2-hero-statement v2-hero-statement-short">
          <h1 className="v2-visually-hidden">Strategic Minds AI. Intelligence in Motion. Build Smarter. Grow Faster.</h1>
          <X1MainCta label="BUILD SMARTER.  GROW FASTER." />
        </div>
      </div>
    </section>
  );
}
import React from "react";
import { ArrowRight } from "lucide-react";
import X1Brand from "./X1Brand";
import X1Earth from "./X1Earth";
import X1MainCta from "./X1MainCta";

export default function X1HeroEarth() {
  return (
    <section className="v2-hero v2-earth-hero v2-earth-hero-expanded">
      <div className="v2-nebula" aria-hidden="true" />
      <X1Earth />
      <div className="v2-hero-center">
        <X1Brand />
        <div className="v2-hero-statement">
          <h1>Build Smarter.<span>Grow Faster.</span></h1>
          <X1MainCta />
        </div>
      </div>
      <a href="#services" className="v2-down-link">EXPLORE OUR SOLUTIONS <ArrowRight size={16} /></a>
    </section>
  );
}
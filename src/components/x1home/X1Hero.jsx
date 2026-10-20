import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const EMBLEM = "https://www.strategicmindsai.com/v2-assets/silver-emblem.png";
const WORDMARK = "https://www.strategicmindsai.com/v2-assets/chrome-wordmark.png";
const EARTH = "https://www.strategicmindsai.com/v2-assets/connected-earth.jpg";

export default function X1Hero() {
  return (
    <section className="relative overflow-hidden">
      <img src={EARTH} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />

      <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        <img src={EMBLEM} alt="Strategic Minds AI" className="h-20 w-20 sm:h-28 sm:w-28 object-contain x1-emblem-glow" />
        <img src={WORDMARK} alt="Strategic Minds AI" className="mt-6 h-5 sm:h-7 w-auto max-w-[80vw] object-contain" />

        <div className="mt-4 flex items-center gap-3">
          <span className="x1-rule w-10 sm:w-16" />
          <span className="x1-track text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
            Intelligence in motion
          </span>
          <span className="x1-rule w-10 sm:w-16" />
        </div>

        <h1 className="mt-9 font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Build smarter. <span className="text-primary">Prove everything.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-sm sm:text-base text-muted-foreground">
          The engineering system behind Strategic Minds AI. Every site, agent and asset is captured from a real
          source, compiled into a specification, rendered, and then gated on evidence before it is allowed to ship.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/"
            className="x1-pill x1-pill-primary x1-track text-[10px] font-semibold px-7 py-3.5 inline-flex items-center gap-2"
          >
            Enter the workspace <ArrowRight className="w-4 h-4 text-action" />
          </Link>
          <Link
            to="/system-audit"
            className="x1-pill x1-track text-[10px] font-semibold px-7 py-3.5 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Review the evidence <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
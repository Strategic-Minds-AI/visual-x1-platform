import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const EMBLEM = "https://www.strategicmindsai.com/v2-assets/silver-emblem.png";

export default function X1ClosingCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 flex flex-col items-center text-center">
        <img src={EMBLEM} alt="Strategic Minds AI" className="h-12 w-12 object-contain x1-emblem-glow" />
        <div className="mt-5 flex items-center gap-3">
          <span className="x1-rule w-10 sm:w-16" />
          <span className="x1-track text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
            Intelligence in motion
          </span>
          <span className="x1-rule w-10 sm:w-16" />
        </div>
        <h2 className="mt-7 font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          Make your next build <span className="text-primary">provable.</span>
        </h2>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/"
            className="x1-pill x1-pill-primary x1-track text-[10px] font-semibold px-7 py-3.5 inline-flex items-center gap-2"
          >
            Enter the workspace <ArrowRight className="w-4 h-4 text-action" />
          </Link>
          <Link
            to="/x1-experience"
            className="x1-pill x1-pill-outline x1-track text-[10px] font-semibold px-7 py-3.5 inline-flex items-center gap-2"
          >
            Open the X1 app <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
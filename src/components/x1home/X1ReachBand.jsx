import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Image } from "@/components/ui/image";

const ASSETS = "https://www.strategicmindsai.com/v2-assets/";

export default function X1ReachBand() {
  return (
    <section className="v2-section v2-reach">
      <div className="v2-wrap v2-reach-grid">
        <div>
          <p className="v2-eyebrow">INTELLIGENCE WITHOUT BORDERS</p>
          <h2>Designed for today.<em>Built for what's next.</em></h2>
          <p>From intelligent workflows and discovery to scalable systems, explore solutions designed around your business, not a generic template.</p>
          <Link className="v2-alt-cta" to="/onboarding">EXPLORE YOUR OPPORTUNITY <ArrowRight size={18} /></Link>
        </div>
        <Image src={ASSETS + "connected-earth.jpg"} alt="Glowing global connectivity across Earth" width="1254" height="306" loading="lazy" />
      </div>
    </section>
  );
}
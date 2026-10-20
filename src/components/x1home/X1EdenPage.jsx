import React from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import X1Brand from "./X1Brand";
import X1Call from "./X1Call";
import X1MainCta from "./X1MainCta";
import X1Onboarding from "./X1Onboarding";
import X1ServiceGrid from "./X1ServiceGrid";
import X1LastCta from "./X1LastCta";

const ASSETS = "/v2-assets/";

// X1 /v2/c and /v2/eden — Eden Skye portrait plus the four-question discovery demo.
export default function X1EdenPage() {
  return (
    <>
      <section className="v2-hero v2-eden-hero">
        <div className="v2-nebula" aria-hidden="true" />
        <div className="v2-wrap v2-eden-grid">
          <div className="v2-eden-copy">
            <X1Brand small />
            <p className="v2-eyebrow"><span className="v2-green-dot" /> MEET YOUR AI WELCOME HOST</p>
            <h1>Meet Eden Skye.<em>Let's talk about what's possible.</em></h1>
            <p>Eden is the AI onboarding guide for Strategic Minds AI. A few thoughtful questions can be the start of something extraordinary.</p>
            <div className="v2-eden-actions">
              <X1MainCta label="START WITH EDEN" to="/v2/c#onboarding" />
              <X1Call eden />
            </div>
            <p className="v2-eden-note"><ShieldCheck size={17} /> Eden is an AI assistant. Live HeyGen video is not yet active in this preview.</p>
          </div>
          <figure className="v2-eden-figure">
            <Image src={ASSETS + "eden-skye-original.avif"} alt="Eden Skye with dark brown hair, glasses and a futuristic black jacket" width="900" height="1100" />
            <figcaption><span className="v2-green-dot" /> EDEN SKYE <small>AI ONBOARDING SPECIALIST</small></figcaption>
          </figure>
        </div>
      </section>
      <X1Onboarding />
      <X1ServiceGrid />
      <section className="v2-last-cta">
        <h2>Ready when you are.</h2>
        <div className="v2-last-buttons">
          <X1Call eden />
          <a href="#onboarding" className="v2-alt-cta">START YOUR DISCOVERY <ArrowRight size={18} /></a>
        </div>
      </section>
    </>
  );
}
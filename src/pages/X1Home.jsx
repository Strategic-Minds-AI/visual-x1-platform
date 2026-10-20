import React, { useEffect } from "react";
import "@/styles/x1-experience.css";
import X1TopNav from "@/components/x1home/X1TopNav";
import X1HeroEarth from "@/components/x1home/X1HeroEarth";
import X1ServiceGrid from "@/components/x1home/X1ServiceGrid";
import X1ReachBand from "@/components/x1home/X1ReachBand";
import X1ProcessGrid from "@/components/x1home/X1ProcessGrid";
import X1LastCta from "@/components/x1home/X1LastCta";
import X1SiteFooter from "@/components/x1home/X1SiteFooter";

export default function X1Home() {
  // X1's public home page owns this document title.
  useEffect(() => {
    const title = document.title;
    document.title = "Strategic Minds AI | Intelligence in Motion";
    return () => { document.title = title; };
  }, []);

  return (
    <div className="v2-page v2-variant-b">
      <a href="#main-content" className="v2-skip">Skip to content</a>
      <X1TopNav />
      <main id="main-content">
        <X1HeroEarth />
        <X1ServiceGrid />
        <X1ReachBand />
        <X1ProcessGrid />
        <X1LastCta />
      </main>
      <X1SiteFooter />
    </div>
  );
}
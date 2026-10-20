import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import "@/styles/x1-experience.css";
import X1TopNav from "@/components/x1home/X1TopNav";
import X1CinematicHero from "@/components/x1home/X1CinematicHero";
import X1LongPage from "@/components/x1home/X1LongPage";
import X1EdenPage from "@/components/x1home/X1EdenPage";
import X1SiteFooter from "@/components/x1home/X1SiteFooter";

// The X1 public front end, ported from X1 source: apps/strategic-minds-v2/src/V2Experience.jsx.
// Route contract matches X1's own router exactly:
//   /v2/a    cinematic mystery homepage
//   /v2/b    extended AI service and company homepage
//   /v2/c    Eden Skye portrait and four-question discovery demo
//   /v2/eden the same Eden workspace under its alias route
export default function V2Experience({ forceVariant }) {
  const { variant: route } = useParams();
  const variant = forceVariant || (route === "b" ? "b" : route === "c" || route === "eden" ? "c" : "a");

  useEffect(() => {
    const title = document.title;
    document.title = "Strategic Minds AI | Intelligence in Motion";
    return () => { document.title = title; };
  }, [variant]);

  return (
    <div className={"v2-page v2-variant-" + variant}>
      <a href="#main-content" className="v2-skip">Skip to content</a>
      <X1TopNav />
      <main id="main-content">
        {variant === "a" ? <X1CinematicHero /> : variant === "b" ? <X1LongPage /> : <X1EdenPage />}
      </main>
      <X1SiteFooter />
    </div>
  );
}
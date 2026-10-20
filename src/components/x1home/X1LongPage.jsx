import React from "react";
import X1HeroEarth from "./X1HeroEarth";
import X1ServiceGrid from "./X1ServiceGrid";
import X1ReachBand from "./X1ReachBand";
import X1ProcessGrid from "./X1ProcessGrid";
import X1LastCta from "./X1LastCta";

// X1 /v2/b — the extended AI service and company homepage.
export default function X1LongPage() {
  return (
    <>
      <X1HeroEarth />
      <X1ServiceGrid />
      <X1ReachBand />
      <X1ProcessGrid />
      <X1LastCta />
    </>
  );
}
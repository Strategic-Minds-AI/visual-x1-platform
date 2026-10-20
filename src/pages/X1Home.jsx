import React from "react";
import X1Hero from "@/components/x1home/X1Hero";
import X1ProofStrip from "@/components/x1home/X1ProofStrip";
import X1Approach from "@/components/x1home/X1Approach";
import X1ModuleGrid from "@/components/x1home/X1ModuleGrid";
import X1ClosingCta from "@/components/x1home/X1ClosingCta";

export default function X1Home() {
  return (
    <div className="min-h-full">
      <X1Hero />
      <X1ProofStrip />
      <X1Approach />
      <X1ModuleGrid />
      <X1ClosingCta />
    </div>
  );
}
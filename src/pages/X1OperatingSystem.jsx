import React from "react";
import { Radar } from "lucide-react";
import X1BrandHeader from "@/components/x1/X1BrandHeader";
import X1StatusStrip from "@/components/x1/X1StatusStrip";
import X1ParityLedger from "@/components/x1/X1ParityLedger";
import X1EmbedPanel from "@/components/x1/X1EmbedPanel";

export default function X1OperatingSystem() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold tracking-tight">X1 Operating System</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          The X1 operating system, inside Visual X. Visual X carries X1's identity and reads X1's real state; X1 stays
          the authority for its own queue, workers and sessions. Nothing on this page claims a state that X1 did not answer.
        </p>

        <X1BrandHeader />
        <X1StatusStrip />
        <X1EmbedPanel />
        <X1ParityLedger />

        <p className="text-xs text-muted-foreground pb-2">
          X1 remains the runtime authority. These read-only surfaces are conditional on production deployment, token provisioning and audit verification. Screenshots and live embed parity are not claimed until browser-tested.
        </p>
      </div>
    </div>
  );
}
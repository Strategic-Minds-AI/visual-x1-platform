import React from "react";
import { Radar } from "lucide-react";
import X1BrandHeader from "@/components/x1/X1BrandHeader";
import X1StatusStrip from "@/components/x1/X1StatusStrip";
import X1ParityLedger from "@/components/x1/X1ParityLedger";

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
        <X1ParityLedger />

        <p className="text-xs text-muted-foreground pb-2">
          Parity is recorded as it is, not as it should be: the nine experiences are inventoried and not yet ported, seven of the twelve
          routes are bridged here, and the five constraints above are what a full merge has to resolve. X1's own doctrine forbids a
          Base44 runtime dependency and a second orchestration queue, so Visual X is built as the cockpit over X1's plane rather than a
          replacement for it.
        </p>
      </div>
    </div>
  );
}
import React from "react";
import V2Experience from "./V2Experience";

// Convenience alias route for the extended X1 homepage (/v2/b is the canonical one).
export default function X1Home() {
  return <V2Experience forceVariant="b" />;
}
import React, { useCallback, useState } from "react";
import { Code2, Copy, Boxes, Radar } from "lucide-react";
import VisualEditor from "@/pages/VisualEditor";
import CloneIngest from "@/pages/CloneIngest";
import WebsiteFactory from "@/pages/WebsiteFactory";
import X1OperatingSystem from "@/pages/X1OperatingSystem";
import X1ModuleShell from "@/components/x1module/X1ModuleShell";
import useX1ModuleBridge, { notifyHostSurface } from "@/components/x1module/useX1ModuleBridge";

// Visual X's engines, presented as surfaces the X1 admin can host. Declared at
// module scope so the frame announces a stable surface list to its host instead
// of a fresh array on every render.
const SURFACES = [
  { id: "editor", label: "Visual Editor", Icon: Code2, Component: VisualEditor },
  { id: "ingest", label: "Clone & Ingest", Icon: Copy, Component: CloneIngest },
  { id: "factory", label: "Website Factory", Icon: Boxes, Component: WebsiteFactory },
  { id: "x1", label: "X1 Live", Icon: Radar, Component: X1OperatingSystem },
];

const SURFACE_IDS = SURFACES.map((s) => s.id);

export default function X1Module() {
  const requested = new URLSearchParams(window.location.search).get("surface");
  const [active, setActive] = useState(SURFACE_IDS.includes(requested) ? requested : "editor");

  const select = useCallback((id) => {
    setActive(id);
    notifyHostSurface(id);
  }, []);

  // The host drives surface changes too; those arrive here without echoing back.
  const hostContext = useX1ModuleBridge({ surfaces: SURFACE_IDS, onSurface: setActive });
  const Surface = SURFACES.find((s) => s.id === active).Component;

  return (
    <X1ModuleShell surfaces={SURFACES} active={active} onSelect={select} hostContext={hostContext}>
      <Surface />
    </X1ModuleShell>
  );
}
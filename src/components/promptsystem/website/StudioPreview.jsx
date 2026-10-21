import React, { useState } from "react";
import { Monitor, Smartphone, Tablet, ExternalLink, MessageSquare } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton } from "@/components/admin/adminUi";

// The preview system: the rendered artifact at each device width, with the two
// ways on from here — into the Visual Editor canvas, or into its AI chat.
const DEVICES = [
  { id: "mobile", label: "390", width: 390, Icon: Smartphone },
  { id: "tablet", label: "768", width: 768, Icon: Tablet },
  { id: "desktop", label: "1440", width: 1440, Icon: Monitor },
];

export default function StudioPreview({ html, onSendToEditor, onContinueInChat }) {
  const [device, setDevice] = useState("desktop");
  const width = DEVICES.find((d) => d.id === device)?.width || 1440;

  if (!html) return null;

  return (
    <Panel
      kicker="PREVIEW SYSTEM"
      title="The rendered artifact"
      aside={
        <div className="cp-admin-actions">
          {DEVICES.map((d) => {
            const Icon = d.Icon;
            return (
              <OutlineButton key={d.id} onClick={() => setDevice(d.id)} title={`${d.width}px wide`}>
                <Icon size={14} /> {d.label}
              </OutlineButton>
            );
          })}
        </div>
      }
    >
      <iframe
        title="Website self-edit preview"
        srcDoc={html}
        sandbox="allow-scripts"
        className="w-full bg-white rounded-md mx-auto block"
        style={{ width, height: 620, border: "0" }}
      />
      <div className="cp-admin-actions mt-3">
        <PrimaryButton onClick={onSendToEditor}>
          <ExternalLink size={14} /> Open in the Visual Editor
        </PrimaryButton>
        <OutlineButton onClick={onContinueInChat}>
          <MessageSquare size={14} /> Continue in AI chat
        </OutlineButton>
      </div>
      <p className="cp-fine">
        The preview is sandboxed without same-origin access, so the artifact cannot reach this console. Opening it in the Visual
        Editor puts this document on that canvas and carries the prompt with it; the AI chat option seeds the same prompt into the
        editor's composer.
      </p>
    </Panel>
  );
}
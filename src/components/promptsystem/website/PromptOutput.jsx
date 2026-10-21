import React from "react";
import { Panel, LinkButton } from "@/components/admin/adminUi";

// The two texts the studio produces: the assembled brief, and — once the prompt
// transform has run — the production prompt it became.
export default function PromptOutput({ assembled, prompt, onUseAssembled }) {
  if (!assembled && !prompt) {
    return (
      <Panel kicker="THE PROMPT" title="Nothing assembled yet">
        <p className="cp-fine">Describe the change, tick the capabilities, then build the prompt.</p>
      </Panel>
    );
  }

  return (
    <div className="cp-admin-stack">
      {prompt && (
        <Panel
          kicker="TRANSFORMED PROMPT"
          title="What the builder receives"
          aside={<span className="cp-fine">{prompt.length.toLocaleString()} characters</span>}
        >
          <pre className="cp-admin-pre">{prompt}</pre>
        </Panel>
      )}
      {assembled && (
        <Panel
          kicker="ASSEMBLED BRIEF"
          title="Everything you ticked, as one brief"
          aside={
            <div className="cp-admin-actions">
              <span className="cp-fine">{assembled.length.toLocaleString()} characters</span>
              {prompt && <LinkButton onClick={onUseAssembled}>USE THIS INSTEAD</LinkButton>}
            </div>
          }
        >
          <pre className="cp-admin-pre">{assembled}</pre>
        </Panel>
      )}
    </div>
  );
}
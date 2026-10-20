import React from "react";
import PromptPipeline from "@/components/admin/PromptPipeline";
import ComposerModeSwitch from "@/components/visualeditor/ComposerModeSwitch";

// The prompt system, as the left column's second mode: the same modules panel the
// console's Prompt System section renders, so a module and the canvas it produces
// live in one workspace.
export default function PromptSystemPanel({ leftMode, onComposer }) {
  return (
    <>
      <div className="ve-panel-head">
        <p className="cp-kicker">PROMPT SYSTEM</p>
        <ComposerModeSwitch leftMode={leftMode} onChange={onComposer} />
      </div>
      <div className="ve-scroll-soft">
        <PromptPipeline />
      </div>
    </>
  );
}
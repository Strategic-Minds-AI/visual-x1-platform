import React from "react";
import { Sparkles } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton, ErrorText } from "@/components/admin/adminUi";

// Every action this studio runs, all of them unmetered: the operator may simulate,
// preview and re-validate as many times as it takes.
const Action = ({ busy, id, onClick, disabled, children, primary }) => {
  const B = primary ? PrimaryButton : OutlineButton;
  return (
    <B onClick={onClick} disabled={disabled || Boolean(busy)}>
      {busy === id ? "Working…" : children}
    </B>
  );
};

export default function StudioActions({
  busy,
  error,
  hasPrompt,
  hasHtml,
  actions,
}) {
  return (
    <Panel kicker="RUN THE LOOP" title="Simulate, preview, validate — without limit">
      <div className="cp-admin-actions">
        <Action busy={busy} id="build" onClick={actions.build} primary>
          <Sparkles size={14} /> 1 · Build the prompt
        </Action>
        <Action busy={busy} id="transform" onClick={actions.transform} disabled={!hasPrompt}>
          Transform it
        </Action>
        <Action busy={busy} id="benchmark" onClick={actions.readBenchmark}>
          Read the benchmark
        </Action>
      </div>

      <div className="cp-admin-actions">
        <Action busy={busy} id="simulate" onClick={actions.simulate} disabled={!hasPrompt}>
          Simulate the prompt
        </Action>
        <Action busy={busy} id="preview" onClick={actions.preview} disabled={!hasPrompt}>
          Preview the artifact
        </Action>
        <Action busy={busy} id="enhance" onClick={actions.applyEnhanced} disabled={!actions.canApplyEnhanced}>
          Use the enhanced prompt
        </Action>
      </div>

      <div className="cp-admin-actions">
        <Action busy={busy} id="validate" onClick={actions.validate} disabled={!hasHtml}>
          Validation agent
        </Action>
        <Action busy={busy} id="test" onClick={actions.test} disabled={!hasHtml}>
          Test agent
        </Action>
        <Action busy={busy} id="judge" onClick={actions.judge} disabled={!hasHtml}>
          Content judge
        </Action>
      </div>

      {actions.note && <p className="cp-fine">{actions.note}</p>}
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}
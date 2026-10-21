import React, { useMemo } from "react";
import { Panel, StatusPill } from "@/components/admin/adminUi";
import { buildLoopPrompt } from "@/lib/loopPrompt";

// The prompt foundation: the twelve blocks the loop writes into every brief, and
// the assembled text as it would actually be sent. This is the page's answer to
// "what are the prompts", shown rather than described.
const BLOCKS = [
  ["TARGETS", "The metric, its comparator, its window and where it stands now — read from the active policy."],
  ["EVIDENCE TO GATHER FIRST", "The observation steps that must run before anything is edited."],
  ["LESSONS THAT APPLY", "Measured outcomes from past changes of this class, injected as instruction."],
  ["REGRESSION GUARDS", "Every armed guard that must stay green, with the blocking ones marked."],
  ["PREDICTION + CONFIDENCE", "The expected move and how sure the run is — or an honest 'cannot predict'."],
  ["SELF-EVALUATION LOOP", "Loop until validation reads 95+ with no hard gate, then escalate with one question."],
  ["PROOF-OF-CHANGE", "Re-run the same probes and report before/after side by side, with the source of each number."],
  ["WHAT WOULD FALSIFY THIS", "The evidence that would prove the change wrong, named before the work starts."],
  ["BLAST RADIUS & ROLLBACK", "The routes touched, the snapshot, the canary, and the exact revert."],
  ["OUTCOME RECORD", "The mandatory write-back: gates, apply, measurement and the reusable lesson."],
  ["AUTONOMY & BUDGET", "The level this run may act at, and the spend it may consume."],
  ["STOP CONDITIONS", "The conditions that end the run immediately, including the policy's own."],
];

export default function PromptFoundationPanel({ policy, metrics, ledger, guards, change, items }) {
  const assembled = useMemo(
    () => buildLoopPrompt({ policy, metrics, ledger, guards, change, items }),
    [policy, metrics, ledger, guards, change, items]
  );

  return (
    <Panel
      kicker="PROMPT FOUNDATION"
      title="The blocks every brief carries"
      aside={<StatusPill>{BLOCKS.length} blocks</StatusPill>}
    >
      <div className="cp-admin-grid">
        {BLOCKS.map(([name, what]) => (
          <div key={name} className="cp-admin-inline-field" style={{ alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0 }}>{name}</h3>
              <p className="cp-fine">{what}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="cp-fine" style={{ marginTop: 16 }}>
        Assembled now, from the live policy, guards and ledger:
      </p>
      <pre className="cp-admin-pre" style={{ maxHeight: 380, overflowY: "auto" }}>
        {assembled}
      </pre>
    </Panel>
  );
}
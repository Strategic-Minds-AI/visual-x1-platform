import React from "react";
import { Loader2, RefreshCw, Repeat2, SlidersHorizontal, Wand2, Zap } from "lucide-react";
import EditorSearch from "@/components/visualeditor/EditorSearch";
import ComposerModeSwitch from "@/components/visualeditor/ComposerModeSwitch";

/**
 * The editor's bottom bar, in the shape of a desktop's own. It carries the composer's
 * controls, in the order the workflow runs left to right: the two composer modes, then
 * build, convert, simulate and add to chain, with the refresh beside them. The search
 * holds the middle and the state tray the right. The device frames are not here — they
 * sit over the canvas itself, on the editor's own tool bar.
 */
export default function EditorTaskbar({
  composer,
  onRefresh,
  status,
  busy,
  tabs,
  onSelectTab,
  onBuild,
  onAsk,
}) {
  const { mode, onMode, running, canAct } = composer;

  return (
    <footer className="ve-taskbar">
      <div className="ve-taskbar-tools">
        <ComposerModeSwitch leftMode={mode} onChange={onMode} />
        <span className="ve-flow-sep" aria-hidden="true" />
        <button
          className="ve-flow is-go"
          type="button"
          onClick={() => onBuild()}
          disabled={!canAct || running.render}
          title="Build the request into an artifact"
        >
          {running.render ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          <span className="ve-flow-label">BUILD</span>
        </button>
        <button
          className="ve-flow"
          type="button"
          onClick={composer.onConvert}
          disabled={!canAct || running.convert}
          title="Convert the request into a structured specification"
        >
          {running.convert ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
          <span className="ve-flow-label">CONVERT</span>
        </button>
        <button
          className="ve-flow"
          type="button"
          onClick={composer.onSimulate}
          disabled={!canAct || running.simulate}
          title="Simulate the request against the benchmark library"
        >
          {running.simulate ? <Loader2 size={12} className="animate-spin" /> : <SlidersHorizontal size={12} />}
          <span className="ve-flow-label">SIMULATE</span>
        </button>
        <button
          className="ve-flow"
          type="button"
          onClick={composer.onAddToChain}
          disabled={!canAct}
          title="Add the request as the next step in the chain"
        >
          <Repeat2 size={12} />
          <span className="ve-flow-label">ADD TO CHAIN</span>
        </button>
        <span className="ve-flow-sep" aria-hidden="true" />
        <button className="ve-icon-btn" onClick={onRefresh} title="Refresh the canvas" aria-label="Refresh the canvas">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="ve-taskbar-search">
        <EditorSearch tabs={tabs} onBuild={onBuild} onAsk={onAsk} onSelectTab={onSelectTab} />
      </div>

      <div className="ve-taskbar-tray">
        <span className={`ve-status${busy ? " is-busy" : ""}`}>
          <i />
          {status}
        </span>
      </div>
    </footer>
  );
}
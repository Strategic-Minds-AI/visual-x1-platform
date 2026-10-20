import React, { useEffect, useRef } from "react";
import { Loader2, Sparkles, Zap } from "lucide-react";
import ChatBubble from "@/components/visualeditor/ChatBubble";
import EditorComposer from "@/components/visualeditor/EditorComposer";
import ComposerModeSwitch from "@/components/visualeditor/ComposerModeSwitch";

// The package's chat panel: an agent header strip carrying the build control, the
// message stream, then the composer. Wired to this app's own agent and pipelines.
export default function EditorChat({ engine, busy, status, leftMode, onComposer, onSend, onRender, onConvert, onSimulate, onAddToChain }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [engine.messages.length, busy]);

  return (
    <>
      <div className="ve-panel-head">
        <div className="ve-agent">
          <span className="ve-avatar" aria-hidden="true">
            <Sparkles size={14} />
          </span>
          <div>
            <p className="ve-name">EDITOR AGENT</p>
            <span className={`ve-status${busy ? " is-busy" : ""}`}>
              <i />
              {status}
            </span>
          </div>
        </div>

        <div className="ve-head-actions">
          <ComposerModeSwitch leftMode={leftMode} onChange={onComposer} />
          <button
            className="cp-green-button"
            type="button"
            onClick={() => onRender()}
            disabled={!engine.input.trim() || engine.loading.render}
          >
            {engine.loading.render ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            BUILD
          </button>
        </div>
      </div>

      <div className="ve-scroll">
        {engine.messages.length === 0 ? (
          <div className="ve-empty">
            <Sparkles size={26} />
            <p>I can build, render, convert and check anything here. Describe what you want, or tap a suggestion.</p>
          </div>
        ) : (
          engine.messages.map((message, i) => <ChatBubble key={i} {...message} />)
        )}
        {busy && (
          <p className="ve-name" style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Loader2 size={12} className="animate-spin" /> working
          </p>
        )}
        <div ref={endRef} />
      </div>

      <EditorComposer
        input={engine.input}
        setInput={engine.setInput}
        loading={engine.loading}
        busy={busy}
        onSend={onSend}
        onRender={onRender}
        onConvert={onConvert}
        onSimulate={onSimulate}
        onAddToChain={onAddToChain}
      />
    </>
  );
}
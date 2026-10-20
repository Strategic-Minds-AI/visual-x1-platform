import React, { useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import ChatBubble from "@/components/visualeditor/ChatBubble";
import EditorComposer from "@/components/visualeditor/EditorComposer";
import { CANVAS_VIEWS } from "@/components/visualeditor/editorNav";

// The package's chat panel: a navigation bar carrying the agent and the canvas view
// switch at its top right, the message stream, then the composer. Wired to this
// app's own agent and pipelines.
export default function EditorChat({ engine, busy, status, canvasView, onCanvas, leftMode, onComposer, onSend, onRender, onConvert, onSimulate, onAddToChain }) {
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

        {/* The canvas view switch (Preview, Simulator, Chain), at the top right of
            the chat's own navigation bar. */}
        <div className="ve-head-actions">
          <div className="ve-pill-group" role="group" aria-label="Canvas view">
            {CANVAS_VIEWS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onCanvas(id)}
                className={`ve-pill${canvasView === id ? " selected" : ""}`}
                aria-pressed={canvasView === id}
              >
                <Icon size={13} />
                <span className="ve-pill-label">{label.toUpperCase()}</span>
              </button>
            ))}
          </div>
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
        leftMode={leftMode}
        onComposer={onComposer}
        onSend={onSend}
        onRender={onRender}
        onConvert={onConvert}
        onSimulate={onSimulate}
        onAddToChain={onAddToChain}
      />
    </>
  );
}
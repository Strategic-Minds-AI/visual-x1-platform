import React, { useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import ChatBubble from "@/components/visualeditor/ChatBubble";
import EditorComposer from "@/components/visualeditor/EditorComposer";

// The package's chat panel: agent head, message stream, suggestion chips and
// composer — wired to this app's own chat and prompt-system actions.
export default function EditorChat({
  engine, busy, status, onSend, onRender, onConvert, onSimulate, onAddToChain, onExecuteChain,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [engine.messages.length, busy]);

  return (
    <>
      <div className="ve-panel-head">
        <div className="ve-agent">
          <span className="ve-avatar" aria-hidden="true">
            <Sparkles size={13} />
          </span>
          <div>
            <p className="cp-kicker">EDITOR AGENT</p>
            <p className="ve-name">{status}</p>
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
        canChain={engine.chain.length > 0}
        onSend={onSend}
        onRender={onRender}
        onConvert={onConvert}
        onSimulate={onSimulate}
        onAddToChain={onAddToChain}
        onExecuteChain={onExecuteChain}
      />
    </>
  );
}
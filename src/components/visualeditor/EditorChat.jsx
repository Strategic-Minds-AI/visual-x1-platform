import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Loader2 } from "lucide-react";
import ChatBubble from "@/components/visualeditor/ChatBubble";
import EditorComposer from "@/components/visualeditor/EditorComposer";
import "@/styles/x1-editor-chat.css";

// The package's chat panel: a navigation bar carrying the agent and, at its top
// right, the way back to the console's command deck — then the message stream, then
// the composer, where every chat-side control lives. Wired to this app's own agent
// and pipelines.
export default function EditorChat({ engine, busy, status, leftMode, onComposer, onSend, onRender, onConvert, onSimulate, onAddToChain }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [engine.messages.length, busy]);

  return (
    <>
      <div className="ve-panel-head">
        <div className="ve-agent">
          <p className="ve-name">EDITOR AGENT</p>
          <span className={`ve-status${busy ? " is-busy" : ""}`}>
            <i />
            {status}
          </span>
        </div>

        <div className="ve-head-actions">
          <Link className="ve-pill ve-dash" to="/admin?section=overview" title="Dashboard — the console command deck">
            <LayoutDashboard size={13} />
            <span className="ve-pill-label">DASHBOARD</span>
          </Link>
        </div>
      </div>

      <div className="ve-scroll">
        {engine.messages.map((message, i) => <ChatBubble key={i} {...message} />)}
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
      />
    </>
  );
}
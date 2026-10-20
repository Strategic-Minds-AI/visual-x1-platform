import React from "react";
import { Eye, Link2, Loader2, Send, Shield, Sparkles, Wand2 } from "lucide-react";
import { SUGGESTIONS } from "@/components/visualeditor/editorNav";

// The composer: suggestion chips, the request field, and every action the editor
// can take on that request — render it, ask the agent, convert it, simulate it,
// or put it on the prompt chain.
export default function EditorComposer({
  input, setInput, loading, busy, canChain,
  onSend, onRender, onConvert, onSimulate, onAddToChain, onExecuteChain,
}) {
  const empty = !input.trim();

  return (
    <div className="ve-composer">
      <div className="ve-chips">
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} type="button" className="ve-chip" onClick={() => onRender(suggestion)}>
            <Sparkles size={11} />
            {suggestion}
          </button>
        ))}
      </div>

      <textarea
        className="cp-field"
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend();
        }}
        placeholder="Describe what to build, edit or check…"
      />

      <div className="ve-actions">
        <button className="cp-green-button" type="button" onClick={() => onRender()} disabled={empty || loading.render}>
          {loading.render ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
          BUILD
        </button>
        <button className="cp-outline" type="button" onClick={onSend} disabled={empty || busy}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          ASK AGENT
        </button>
        <button className="cp-outline" type="button" onClick={() => onConvert()} disabled={empty || loading.convert}>
          {loading.convert ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          CONVERT
        </button>
        <button className="cp-outline" type="button" onClick={() => onSimulate()} disabled={empty || loading.simulate}>
          {loading.simulate ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
          SIMULATE
        </button>
        <button className="cp-outline" type="button" onClick={onAddToChain} disabled={empty}>
          <Link2 size={13} />
          CHAIN
        </button>
        <button className="cp-outline" type="button" onClick={onExecuteChain} disabled={!canChain || loading.chain}>
          {loading.chain ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
          RUN CHAIN
        </button>
      </div>
    </div>
  );
}
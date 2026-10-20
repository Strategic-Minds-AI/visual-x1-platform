import React from "react";
import { Loader2, Send, Sparkles, Zap } from "lucide-react";
import { SUGGESTIONS } from "@/components/visualeditor/editorNav";
import ComposerModeSwitch from "@/components/visualeditor/ComposerModeSwitch";

// The composer, in the package's shape: suggestion chips, the request field with
// its send control, and the panel's own controls on that same request — the two
// composer modes, the build control, and the prompt system's actions.
export default function EditorComposer({ input, setInput, loading, busy, leftMode, onComposer, onSend, onRender, onConvert, onSimulate, onAddToChain }) {
  const empty = !input.trim();

  return (
    <div className="ve-composer">
      <p className="ve-suggest-label">SUGGESTIONS</p>
      <div className="ve-chips">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="ve-chip"
            onClick={() => onRender(suggestion)}
            disabled={loading.render}
          >
            <Sparkles size={11} />
            {suggestion}
          </button>
        ))}
      </div>

      <div className="ve-input-row">
        <textarea
          className="cp-field"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend();
          }}
          placeholder="Describe what to build, edit or check…"
        />
        <button
          className="ve-send"
          type="button"
          onClick={onSend}
          disabled={empty || busy}
          title="Ask the agent"
          aria-label="Ask the agent"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      <div className="ve-actions">
        <ComposerModeSwitch leftMode={leftMode} onChange={onComposer} />
        <button
          className="cp-green-button"
          type="button"
          onClick={() => onRender()}
          disabled={empty || loading.render}
        >
          {loading.render ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          BUILD
        </button>
        <button className="cp-outline" type="button" onClick={onConvert} disabled={empty || loading.convert}>
          CONVERT
        </button>
        <button className="cp-outline" type="button" onClick={onSimulate} disabled={empty || loading.simulate}>
          SIMULATE
        </button>
        <button className="cp-outline" type="button" onClick={onAddToChain} disabled={empty}>
          ADD TO CHAIN
        </button>
      </div>
    </div>
  );
}
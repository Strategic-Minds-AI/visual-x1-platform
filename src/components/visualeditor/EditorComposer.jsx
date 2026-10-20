import React from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { SUGGESTIONS } from "@/components/visualeditor/editorNav";

// The composer, at the foot of the chat column and directly above the bottom bar: the
// suggestions, then one slim request field with its send control. Everything that acts
// on the request — the two composer modes, the build, and the prompt system's own steps
// — lives in the bottom bar, so the field stays as small as the thread above it.
export default function EditorComposer({ input, setInput, loading, busy, onSend, onRender }) {
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
            <Sparkles size={10} />
            {suggestion}
          </button>
        ))}
      </div>

      <div className="ve-input-row">
        <textarea
          className="cp-field"
          rows={1}
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
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}
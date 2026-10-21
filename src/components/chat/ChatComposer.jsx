import React, { useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// The input. With the transformer on, what the operator types is the comment and
// what the orchestrator receives is the production prompt — one toggle, and the
// transformed text is shown so the difference is never a mystery.
export default function ChatComposer({ onSend, sending, transform, setTransform, lastTransformed }) {
  const [value, setValue] = useState("");
  const [showTransformed, setShowTransformed] = useState(false);
  const areaRef = useRef(null);

  const submit = () => {
    const text = value.trim();
    if (!text || sending) return;
    onSend(text);
    setValue("");
    setShowTransformed(false);
    requestAnimationFrame(() => areaRef.current?.focus());
  };

  return (
    <div className="border-t border-border/60 px-4 pb-4 pt-3">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Switch checked={transform} onCheckedChange={setTransform} />
          <Sparkles size={11} className={transform ? "text-primary" : ""} />
          Comment transformer
        </label>
        {lastTransformed && (
          <button
            type="button"
            onClick={() => setShowTransformed((v) => !v)}
            className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            {showTransformed ? "Hide" : "Show"} last prompt
          </button>
        )}
      </div>

      {showTransformed && lastTransformed && (
        <pre className="cp-admin-pre mt-2 max-h-40 overflow-y-auto text-[10px]">{lastTransformed}</pre>
      )}

      <div className="mt-2 flex items-end gap-2">
        <textarea
          ref={areaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Audit the site and fix what is broken…"
          className="min-h-[52px] flex-1 resize-none rounded-xl border border-border/60 bg-popover/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          type="button"
          onClick={submit}
          disabled={sending || !value.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <ArrowUp size={16} />
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Enter sends · Shift+Enter new line{transform ? " · transformed before it is sent" : " · sent exactly as typed"}
      </p>
    </div>
  );
}
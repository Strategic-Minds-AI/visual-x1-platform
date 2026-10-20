import React from "react";
import { Send, Loader2, Wand2, ShieldCheck, Eye, Link2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SystemTypeMenu from "@/components/editor/SystemTypeMenu";
import { cn } from "@/lib/utils";

const BUBBLE = {
  user: "bg-primary/15 text-foreground ring-1 ring-primary/40 rounded-2xl rounded-br-md",
  assistant: "x1-glass rounded-2xl rounded-bl-md",
  error: "bg-destructive/15 text-foreground ring-1 ring-destructive/40 rounded-2xl",
};

function Message({ msg }) {
  const user = msg.role === "user";
  return (
    <div className={cn("flex", user ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[92%] px-3.5 py-2.5", BUBBLE[msg.type] || (user ? BUBBLE.user : BUBBLE.assistant))}>
        {msg.type !== "user" && (
          <p className="x1-track text-[9px] text-muted-foreground mb-1.5">{msg.name || "Editor"}</p>
        )}
        {msg.type === "prompt" ? (
          <pre className="text-xs whitespace-pre-wrap font-body leading-relaxed">{msg.content}</pre>
        ) : (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        )}
      </div>
    </div>
  );
}

/** The chat UI: it sits directly right of the tool rail, with the canvas beyond it. */
export default function EditorChat({ engine, onSelectTool }) {
  const busy = Object.values(engine.loading).some(Boolean);
  const ready = Boolean(engine.input.trim()) && !busy;

  const send = (e) => {
    e.preventDefault();
    if (!ready) return;
    engine.handleConvert();
  };

  const action = (run, tab) => () => {
    run();
    onSelectTool(tab);
  };

  return (
    <section className="w-[340px] lg:w-[400px] shrink-0 flex flex-col bg-card/40 backdrop-blur-xl min-w-0">
      <header className="px-4 pt-4 pb-3 flex items-center gap-2 shrink-0">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="x1-track text-[10px] font-semibold">Editor chat</h2>
        <span className="ml-auto x1-track text-[9px] text-muted-foreground">{engine.messages.length} turns</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 min-h-0">
        {engine.messages.map((msg, i) => <Message key={i} msg={msg} />)}
      </div>

      <form onSubmit={send} className="p-3 space-y-2 border-t border-border/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <SystemTypeMenu onSelect={(p) => engine.setInput(p)} />
          <span className="text-[11px] text-muted-foreground truncate">Load a system type into the composer</span>
        </div>
        <Textarea
          value={engine.input}
          onChange={(e) => engine.setInput(e.target.value)}
          placeholder="Describe what you want to build..."
          rows={3}
          className="text-sm resize-none rounded-2xl bg-popover/40"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={!ready} className="x1-pill-primary">
            {engine.loading.convert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={!ready} onClick={action(engine.handleSimulate, "simulator")}>
            {engine.loading.simulate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Simulate
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={!ready} onClick={action(engine.handleRender, "preview")}>
            {engine.loading.render ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Render
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={!engine.input.trim() || busy} onClick={action(engine.handleAddToChain, "chain")}>
            <Link2 className="w-3.5 h-3.5" /> Chain
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={engine.loading.chain || engine.chain.length === 0} onClick={action(engine.handleExecuteChain, "chain")}>
            {engine.loading.chain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run chain
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={!engine.input.trim() || busy} onClick={() => engine.handleConvert()}>
            <Wand2 className="w-3.5 h-3.5" /> Convert
          </Button>
        </div>
      </form>
    </section>
  );
}
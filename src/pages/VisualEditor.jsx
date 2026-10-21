import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Wand2, Play, Eye, Link2, Sparkles, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import useEditorEngine from "@/hooks/useEditorEngine";
import EditorOutputPanel from "@/components/editor/EditorOutputPanel";
import SystemTypeMenu from "@/components/editor/SystemTypeMenu";

export default function VisualEditor() {
  const engine = useEditorEngine();
  const [activeTab, setActiveTab] = useState("preview");

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="w-4 h-4" /> Workspace
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-lg font-semibold">Visual Editor</h1>
          </div>
          <Badge variant="outline" className="text-xs ml-2">Vibe Coding Studio</Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 border-r border-border flex flex-col bg-card min-w-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {engine.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : msg.type === "error"
                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                      : msg.type === "prompt"
                      ? "bg-muted/50 border border-border"
                      : "bg-muted"
                  }`}
                >
                  {msg.type === "prompt" ? (
                    <pre className="text-xs whitespace-pre-wrap font-body">{msg.content}</pre>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <SystemTypeMenu onSelect={(p) => engine.setInput(p)} />
              <span className="text-xs text-muted-foreground">Pick a system type to load into the input</span>
            </div>
            <Textarea
              value={engine.input}
              onChange={(e) => engine.setInput(e.target.value)}
              placeholder="Describe what you want to build..."
              rows={3}
              className="text-sm resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={engine.handleConvert} disabled={engine.loading.convert || !engine.input.trim()}>
                {engine.loading.convert ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />} Convert
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  engine.handleSimulate();
                  setActiveTab("simulator");
                }}
                disabled={engine.loading.simulate || !engine.input.trim()}
              >
                {engine.loading.simulate ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Shield className="w-3.5 h-3.5 mr-1" />} Simulate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  engine.handleRender();
                  setActiveTab("preview");
                }}
                disabled={engine.loading.render || !engine.input.trim()}
              >
                {engine.loading.render ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-1" />} Render
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  engine.handleAddToChain();
                  setActiveTab("chain");
                }}
                disabled={!engine.input.trim()}
              >
                <Link2 className="w-3.5 h-3.5 mr-1" /> Chain
              </Button>
              <Button size="sm" variant="ghost" onClick={engine.handleExecuteChain} disabled={engine.loading.chain || !engine.chain.length}>
                {engine.loading.chain ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />} Run chain
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <EditorOutputPanel engine={engine} activeTab={activeTab} setActiveTab={setActiveTab} onSendToChat={(t) => engine.setInput(t)} />
        </div>
      </div>
    </div>
  );
}
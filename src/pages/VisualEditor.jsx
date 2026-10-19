import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Wand2, Play, Eye, Link2, Send, Sparkles, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import SimulatorResults from "@/components/editor/SimulatorResults";
import PromptChainBuilder from "@/components/editor/PromptChainBuilder";
import SystemTypeMenu from "@/components/editor/SystemTypeMenu";

const TABS = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "simulator", label: "Simulator", icon: Shield },
  { id: "chain", label: "Chain", icon: Link2 }
];

export default function VisualEditor() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome to the Visual Editor. Describe what you want to build, then click Convert, Simulate, or Render to see it come to life.", type: "text" }
  ]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [previewHtml, setPreviewHtml] = useState("");
  const [simulatorResult, setSimulatorResult] = useState(null);
  const [chain, setChain] = useState([]);
  const [chainResult, setChainResult] = useState(null);
  const [loading, setLoading] = useState({ convert: false, simulate: false, render: false, chain: false });

  const addMessage = (msg) => setMessages(prev => [...prev, msg]);

  const handleConvert = async () => {
    if (!input.trim()) return;
    addMessage({ role: "user", content: input, type: "text" });
    setLoading(l => ({ ...l, convert: true }));
    try {
      const res = await base44.functions.invoke("convertPrompt", { sentence: input, category: "general" });
      addMessage({ role: "assistant", content: res.data.advanced, type: "prompt" });
      setInput(res.data.advanced);
    } catch (e) {
      addMessage({ role: "assistant", content: e?.response?.data?.error || "Conversion failed.", type: "error" });
    } finally {
      setLoading(l => ({ ...l, convert: false }));
    }
  };

  const handleSimulate = async () => {
    if (!input.trim()) return;
    addMessage({ role: "user", content: `Simulating: ${input.slice(0, 80)}...`, type: "text" });
    setActiveTab("simulator");
    setLoading(l => ({ ...l, simulate: true }));
    try {
      const res = await base44.functions.invoke("promptSimulator", { prompt: input });
      setSimulatorResult(res.data);
      addMessage({ role: "assistant", content: `Simulation complete — QA score: ${res.data.qa_review?.score || 0}/100, ${res.data.negative_flags?.length || 0} flags found.`, type: "text" });
    } catch (e) {
      addMessage({ role: "assistant", content: "Simulation failed.", type: "error" });
    } finally {
      setLoading(l => ({ ...l, simulate: false }));
    }
  };

  const handleRender = async () => {
    if (!input.trim()) return;
    addMessage({ role: "user", content: `Rendering: ${input.slice(0, 80)}...`, type: "text" });
    setActiveTab("preview");
    setLoading(l => ({ ...l, render: true }));
    try {
      const res = await base44.functions.invoke("renderPreview", { prompt: input });
      setPreviewHtml(res.data.html);
      addMessage({ role: "assistant", content: "Visual preview generated — see the Preview tab.", type: "text" });
    } catch (e) {
      addMessage({ role: "assistant", content: "Render failed.", type: "error" });
    } finally {
      setLoading(l => ({ ...l, render: false }));
    }
  };

  const handleAddToChain = () => {
    if (!input.trim()) return;
    setChain(prev => [...prev, { id: Date.now(), prompt: input.trim() }]);
    setActiveTab("chain");
    addMessage({ role: "assistant", content: `Added to chain (step ${chain.length + 1}).`, type: "text" });
  };

  const handleExecuteChain = async () => {
    if (chain.length === 0) return;
    setLoading(l => ({ ...l, chain: true }));
    setChainResult(null);
    try {
      let context = "";
      for (let i = 0; i < chain.length; i++) {
        const step = chain[i];
        const res = await base44.functions.invoke("convertPrompt", { sentence: step.prompt, category: "general" });
        context = res.data.advanced;
        if (i < chain.length - 1) {
          // Pass output as context to next step
          chain[i].output = context;
        }
      }
      // Render the final step
      const renderRes = await base44.functions.invoke("renderPreview", { prompt: chain[chain.length - 1].prompt, context });
      setPreviewHtml(renderRes.data.html);
      setChainResult(context);
      setActiveTab("preview");
      addMessage({ role: "assistant", content: `Chain executed (${chain.length} steps). Final preview rendered.`, type: "text" });
    } catch (e) {
      addMessage({ role: "assistant", content: "Chain execution failed.", type: "error" });
    } finally {
      setLoading(l => ({ ...l, chain: false }));
    }
  };

  const useEnhanced = (enhanced) => {
    setInput(enhanced);
    addMessage({ role: "assistant", content: "Enhanced prompt loaded into the input. Click Render to generate a visual.", type: "text" });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="w-4 h-4" /> Dashboard
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
        {/* Left: Chat Panel */}
        <div className="w-2/5 border-r border-border flex flex-col bg-card">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" :
                  msg.type === "error" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                  msg.type === "prompt" ? "bg-muted/50 border border-border" :
                  "bg-muted"
                }`}>
                  {msg.type === "prompt" ? (
                    <pre className="text-xs whitespace-pre-wrap font-body">{msg.content}</pre>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="border-t border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <SystemTypeMenu onSelect={(p) => setInput(p)} />
              <span className="text-xs text-muted-foreground">Pick a system type to load into the input</span>
            </div>
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe what you want to build..."
              rows={3}
              className="text-sm resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleConvert} disabled={loading.convert || !input.trim()}>
                {loading.convert ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />} Convert
              </Button>
              <Button size="sm" variant="outline" onClick={handleSimulate} disabled={loading.simulate || !input.trim()}>
                {loading.simulate ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Shield className="w-3.5 h-3.5 mr-1" />} Simulate
              </Button>
              <Button size="sm" variant="outline" onClick={handleRender} disabled={loading.render || !input.trim()}>
                {loading.render ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-1" />} Render
              </Button>
              <Button size="sm" variant="ghost" onClick={handleAddToChain} disabled={!input.trim()}>
                <Link2 className="w-3.5 h-3.5 mr-1" /> Chain
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="w-3/5 flex flex-col">
          <div className="border-b border-border flex shrink-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden bg-muted/20">
            {activeTab === "preview" && (
              <div className="h-full">
                {previewHtml ? (
                  <iframe srcDoc={previewHtml} className="w-full h-full border-0" sandbox="allow-scripts" title="Preview" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Eye className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Click "Render" to generate a visual preview</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "simulator" && (
              <SimulatorResults result={simulatorResult} onUseEnhanced={useEnhanced} />
            )}
            {activeTab === "chain" && (
              <PromptChainBuilder
                chain={chain}
                setChain={setChain}
                onExecute={handleExecuteChain}
                executing={loading.chain}
                executionResult={chainResult}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
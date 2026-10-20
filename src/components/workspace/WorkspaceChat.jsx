import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Wand2, Shield, Eye, Link2, Bot, Infinity as InfinityIcon } from "lucide-react";
import SystemTypeMenu from "@/components/editor/SystemTypeMenu";
import ToolTrail from "@/components/workspace/ToolTrail";

// The composer offers every action the engine has, on whichever responder is selected.
export default function WorkspaceChat({ engine, onShowTab }) {
  const [agents, setAgents] = useState([]);
  const [responder, setResponder] = useState("autonomy");
  const [steps, setSteps] = useState("8");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Agent.filter({}, { sort: "-created_date", limit: 50 });
        setAgents(res.items || []);
      } catch (e) {
        // agent list is optional
      }
    })();
  }, []);

  const send = async () => {
    if (!engine.input.trim() || sending) return;
    const text = engine.input;
    engine.addMessage({ role: "user", content: text, type: "text" });
    engine.setInput("");
    setSending(true);
    setError("");
    try {
      if (responder === "autonomy") {
        const history = engine.messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
        const res = await base44.functions.invoke("autonomyChat", { message: text, max_steps: Number(steps), history });
        if (res.data?.error) {
          setError(res.data.error);
          engine.addMessage({ role: "assistant", name: "Autonomy", content: res.data.error, type: "error" });
        } else {
          engine.addMessage({
            role: "assistant",
            name: `Autonomy · ${res.data.steps_used} step${res.data.steps_used === 1 ? "" : "s"}`,
            content: res.data.answer || "No answer returned.",
            type: "text",
            tools: res.data.trail || []
          });
        }
      } else {
        const agent = agents.find((a) => a.id === responder);
        const res = await base44.functions.invoke("agentChat", { agent_id: responder, message: text });
        engine.addMessage({
          role: "assistant",
          name: agent?.name || "Agent",
          content: res.data?.response || "No response returned.",
          type: "text"
        });
      }
    } catch (e) {
      setError(e?.response?.data?.error || "The request failed.");
    } finally {
      setSending(false);
    }
  };

  const renderActions = [
    { label: "Convert", icon: Wand2, busy: engine.loading.convert, run: engine.handleConvert, tab: null },
    { label: "Simulate", icon: Shield, busy: engine.loading.simulate, run: engine.handleSimulate, tab: "simulator" },
    { label: "Render", icon: Eye, busy: engine.loading.render, run: engine.handleRender, tab: "preview" },
    { label: "Chain", icon: Link2, busy: false, run: engine.handleAddToChain, tab: "chain" }
  ];

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="border-b border-border px-3 py-2.5 flex items-center gap-2 shrink-0">
        <Bot className="w-4 h-4 text-muted-foreground" />
        <Select value={responder} onValueChange={setResponder}>
          <SelectTrigger className="h-8 text-sm flex-1 min-w-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="autonomy">Autonomy — full read/write/execute</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name} · {a.role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {responder === "autonomy" && (
          <Select value={steps} onValueChange={setSteps}>
            <SelectTrigger className="h-8 w-24 text-xs shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 steps</SelectItem>
              <SelectItem value="8">8 steps</SelectItem>
              <SelectItem value="12">12 steps</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {engine.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[92%] ${msg.role === "user" ? "" : "w-full"}`}>
              {msg.role === "assistant" && msg.name && <p className="text-xs text-muted-foreground mb-1">{msg.name}</p>}
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground inline-block"
                    : msg.type === "error"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : msg.type === "prompt"
                    ? "bg-muted/50 border border-border"
                    : "bg-muted"
                }`}
              >
                {msg.type === "prompt" ? (
                  <pre className="text-xs whitespace-pre-wrap font-body">{msg.content}</pre>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.tools?.length ? <ToolTrail trail={msg.tools} /> : null}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> working
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <SystemTypeMenu onSelect={(p) => engine.setInput(p)} />
          <span className="text-xs text-muted-foreground truncate">Load a system type into the composer</span>
        </div>
        <Textarea
          value={engine.input}
          onChange={(e) => engine.setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
          placeholder="Tell the agent, or describe what to build…"
          rows={3}
          className="text-sm resize-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={send} disabled={sending || !engine.input.trim()}>
            {sending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />} Send
          </Button>
          {renderActions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant="outline"
              onClick={() => {
                a.run();
                if (a.tab && onShowTab) onShowTab(a.tab);
              }}
              disabled={a.busy || !engine.input.trim()}
            >
              {a.busy ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <a.icon className="w-3.5 h-3.5 mr-1" />} {a.label}
            </Button>
          ))}
          <Badge variant="outline" className="text-xs ml-auto">
            <InfinityIcon className="w-3 h-3 mr-1" /> full access on app data · vault excluded
          </Badge>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
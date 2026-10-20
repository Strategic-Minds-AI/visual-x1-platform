import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Radio, Bot, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CommunicationBus() {
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [targetAgent, setTargetAgent] = useState("gpt");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [agentRes, msgRes] = await Promise.all([
        base44.entities.Agent.filter({}, { limit: 50 }),
        base44.entities.AgentMessage.filter({}, { sort: '-created_date', limit: 30 })
      ]);
      setAgents(agentRes.items || agentRes || []);
      setMessages(msgRes.items || msgRes || []);
    } catch (e) {
      // entities might be empty
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSend = async () => {
    if (!input.trim() || !selectedAgent) return;
    setSending(true);
    try {
      await base44.functions.invoke("agentCommunicationBus", {
        from_agent_id: selectedAgent.id,
        to_agent_id: targetAgent,
        content: input.trim(),
        message_type: targetAgent === 'broadcast' ? 'broadcast' : 'request',
        bridge_to_gpt: targetAgent === 'gpt'
      });
      setInput("");
      loadData();
    } catch (e) {
      // error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
            <Radio className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">Communication Bus</h3>
            <p className="text-xs text-muted-foreground">Inter-agent messaging + GPT bridge</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">{messages.length} messages</Badge>
      </div>

      {/* Message feed */}
      <div className="max-h-48 overflow-y-auto space-y-2 bg-muted/30 rounded-lg p-3 min-h-[100px]">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center pt-6">No messages yet. Select an agent and send a message.</p>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`text-xs ${m.from_agent_id === 'user' || m.from_agent_id === 'gpt' ? '' : ''}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-medium">{m.from_agent_id === 'gpt' ? 'GPT' : m.from_agent_id === 'user' ? 'User' : agents.find(a => a.id === m.from_agent_id)?.name || m.from_agent_id?.slice(0, 8)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">{m.to_agent_id === 'broadcast' ? 'All' : m.to_agent_id === 'gpt' ? 'GPT' : agents.find(a => a.id === m.to_agent_id)?.name || m.to_agent_id?.slice(0, 8)}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0">{m.message_type}</Badge>
              </div>
              <p className="text-muted-foreground pl-1">{m.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Send controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={selectedAgent?.id || ""}
            onChange={e => setSelectedAgent(agents.find(a => a.id === e.target.value))}
            className="text-xs rounded-md border border-input bg-transparent px-2 py-1.5 flex-1"
          >
            <option value="">From agent...</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select
            value={targetAgent}
            onChange={e => setTargetAgent(e.target.value)}
            className="text-xs rounded-md border border-input bg-transparent px-2 py-1.5 flex-1"
          >
            <option value="gpt">→ GPT Bridge</option>
            <option value="broadcast">→ All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>→ {a.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="text-sm rounded-md border border-input bg-transparent px-3 py-1.5 flex-1 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button size="sm" onClick={handleSend} disabled={sending || !input.trim() || !selectedAgent}>
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
        {targetAgent === 'gpt' && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Zap className="w-3 h-3" /> GPT bridge uses the agent's system prompt + memories for context-aware responses
          </p>
        )}
      </div>
    </div>
  );
}
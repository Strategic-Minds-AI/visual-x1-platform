import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2, Send, Play, RefreshCw } from "lucide-react";

export default function MultiAgentPanel({ onSendToChat }) {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState("1");
  const [transcript, setTranscript] = useState([]);
  const [synthesis, setSynthesis] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Agent.filter({}, { sort: "-created_date", limit: 50 });
        setAgents(res.items || []);
      } catch (e) {
        // agents load is non-blocking
      }
    })();
  }, []);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 6 ? prev : [...prev, id]));

  const run = async () => {
    if (!topic.trim() || selected.length < 2) return;
    setRunning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("multiAgentRound", {
        agent_ids: selected,
        topic: topic.trim(),
        rounds: Number(rounds),
        transcript
      });
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        setTranscript(res.data.transcript || []);
        setSynthesis(res.data.synthesis || "");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "The round failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-3 space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Multi-agent room</span>
          <Badge variant="outline" className="text-xs">{selected.length}/6 selected</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {agents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No agents yet. Create agents on the Job Board to seat them here.</p>
          ) : (
            agents.map((a) => (
              <label
                key={a.id}
                className={`flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer transition ${selected.includes(a.id) ? "border-primary bg-muted" : "border-border hover:bg-muted"}`}
              >
                <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggle(a.id)} className="h-3.5 w-3.5" />
                <span className="w-2 h-2 rounded-full" style={{ background: a.avatar_color || "#6366f1" }} />
                {a.name}
              </label>
            ))
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What should they work out together?" className="h-9 text-sm" />
          <Select value={rounds} onValueChange={setRounds}>
            <SelectTrigger className="w-28 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 round</SelectItem>
              <SelectItem value="2">2 rounds</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={run} disabled={running || selected.length < 2 || !topic.trim()}>
            {running ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            {transcript.length ? "Continue" : "Run round"}
          </Button>
          {transcript.length > 0 && (
            <Button size="icon" variant="ghost" title="Clear the room" onClick={() => { setTranscript([]); setSynthesis(""); }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm">Seat two or more agents and give them a question</p>
            <p className="text-xs max-w-md text-center px-6">Each agent answers in turn, seeing everything said before it, and a moderator closes the round with what they agreed on and what is still open.</p>
          </div>
        ) : (
          <>
            {transcript.map((m, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0" style={{ background: m.avatar_color || "#6366f1" }}>
                  {m.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {m.name} <span className="opacity-60">· round {m.round}</span>
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {synthesis && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs font-medium mb-1">Moderator synthesis</p>
                <p className="text-sm whitespace-pre-wrap">{synthesis}</p>
              </div>
            )}
          </>
        )}
      </div>

      {synthesis && onSendToChat && (
        <div className="border-t border-border p-3 shrink-0">
          <Button size="sm" variant="outline" className="w-full" onClick={() => onSendToChat(`Multi-agent synthesis on "${topic}":\n${synthesis}`)}>
            <Send className="w-3.5 h-3.5 mr-1" /> Send synthesis to composer
          </Button>
        </div>
      )}
    </div>
  );
}
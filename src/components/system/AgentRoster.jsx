import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, Shield, ClipboardCheck, Cpu, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROLE_ICONS = {
  researcher: Cpu, planner: Cpu, executor: Cpu, reviewer: ClipboardCheck,
  coordinator: Bot, memory_keeper: Bot, specialist: Shield
};

export default function AgentRoster() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await base44.entities.Agent.filter({}, { limit: 50 });
      setAgents(res.items || res || []);
    } catch (e) {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">Agent Roster</h3>
            <p className="text-xs text-muted-foreground">{agents.length} agents in the system</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {agents.map(a => {
            const Icon = ROLE_ICONS[a.role] || Bot;
            const isGuardian = a.name?.toLowerCase().includes('guardian');
            const isQA = a.name?.toLowerCase().includes('qa') || a.name?.toLowerCase().includes('quality');
            return (
              <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isGuardian ? 'bg-rose-100' : isQA ? 'bg-violet-100' : 'bg-muted'
                }`} style={!isGuardian && !isQA ? { background: a.avatar_color || '#6366f1' } : {}}>
                  <Icon className={`w-4 h-4 ${isGuardian ? 'text-rose-600' : isQA ? 'text-violet-600' : 'text-white'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{a.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.status === 'idle' ? 'bg-emerald-400' : a.status === 'busy' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{a.role}{a.specialization ? ` · ${a.specialization}` : ''}</p>
                </div>
                <Badge variant="outline" className="text-[9px] capitalize shrink-0">{a.status}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
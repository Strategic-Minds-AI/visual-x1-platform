import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Activity, Brain, CheckCircle2, XCircle, TrendingUp, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_COLORS = {
  open: "#0ea5e9", assigned: "#8b5cf6", in_progress: "#f59e0b",
  review: "#06b6d4", completed: "#10b981", failed: "#f43f5e", cancelled: "#94a3b8"
};

const SEVERITY_COLORS = {
  critical: "bg-rose-500", high: "bg-orange-500", medium: "bg-amber-400", low: "bg-sky-400"
};

export default function AgentActivity() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [agentStats, setAgentStats] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);

  const load = useCallback(async () => {
    try {
      const [logsRes, msgRes, agentsRes, statusAgg, logCount] = await Promise.all([
        base44.entities.ReasoningLog.filter({}, { sort: "-created_date", limit: 15 }),
        base44.entities.AgentMessage.filter({}, { sort: "-created_date", limit: 10 }),
        base44.entities.Agent.filter({}, { limit: 50 }),
        base44.entities.Job.aggregate({ groupBy: "status", count: true }),
        base44.entities.ReasoningLog.count({})
      ]);

      setLogs(logsRes.items || []);
      setMessages(msgRes.items || []);
      setAgents(agentsRes.items || []);
      setTotalLogs(logCount);
      setStatusDist((statusAgg.rows || []).map(r => ({ status: r._id || r.status, count: r.count })));

      // Per-agent stats
      const [completedAgg, assignedAgg] = await Promise.all([
        base44.entities.Job.aggregate({ query: { status: "completed" }, groupBy: "assigned_agent_id", count: true }),
        base44.entities.Job.aggregate({ groupBy: "assigned_agent_id", count: true })
      ]);

      const completedMap = {};
      (completedAgg.rows || []).forEach(r => { if (r._id || r.assigned_agent_id) completedMap[r._id || r.assigned_agent_id] = r.count; });
      const assignedMap = {};
      (assignedAgg.rows || []).forEach(r => { if (r._id || r.assigned_agent_id) assignedMap[r._id || r.assigned_agent_id] = r.count; });

      const stats = (agentsRes.items || []).map(a => ({
        agent: a,
        assigned: assignedMap[a.id] || 0,
        completed: completedMap[a.id] || 0,
        rate: assignedMap[a.id] ? Math.round((completedMap[a.id] / assignedMap[a.id]) * 100) : 0
      })).filter(s => s.assigned > 0);
      setAgentStats(stats);

      // Avg confidence from recent logs
      const logItems = logsRes.items || [];
      if (logItems.length > 0) {
        const avg = logItems.reduce((sum, l) => sum + (l.confidence || 0), 0) / logItems.length;
        setAvgConfidence(Math.round(avg * 100));
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalJobs = statusDist.reduce((sum, s) => sum + s.count, 0);
  const completed = statusDist.find(s => s.status === "completed")?.count || 0;
  const failed = statusDist.find(s => s.status === "failed")?.count || 0;
  const inProgress = statusDist.find(s => s.status === "in_progress")?.count || 0;
  const open = statusDist.find(s => s.status === "open")?.count || 0;
  const completionRate = (completed + failed) > 0 ? Math.round((completed / (completed + failed)) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <h1 className="font-heading text-lg font-semibold">Agent Activity</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-semibold mt-1 text-emerald-600">{completionRate}%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Reasoning Logs</p>
                  <p className="text-2xl font-semibold mt-1">{totalLogs}</p>
                </div>
                <Brain className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  <p className="text-2xl font-semibold mt-1 text-sky-600">{avgConfidence}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-sky-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Agents</p>
                  <p className="text-2xl font-semibold mt-1">{agents.filter(a => a.status === "busy").length}</p>
                </div>
                <Activity className="w-8 h-8 text-violet-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Status Distribution */}
        <section>
          <h2 className="font-heading text-lg font-semibold mb-4">Job Status Distribution</h2>
          <Card>
            <CardContent className="pt-6">
              {totalJobs === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No jobs yet.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex h-6 rounded-full overflow-hidden">
                    {statusDist.map(s => (
                      <div key={s.status} style={{ width: `${(s.count / totalJobs) * 100}%`, background: STATUS_COLORS[s.status] || "#94a3b8" }} className="flex items-center justify-center text-xs text-white font-medium" title={`${s.status}: ${s.count}`}>
                        {s.count > 1 && s.count}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {statusDist.map(s => (
                      <div key={s.status} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.status] || "#94a3b8" }} />
                        <span className="text-sm capitalize">{s.status.replace("_", " ")}</span>
                        <span className="text-sm font-medium">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Per-Agent Stats */}
        <section>
          <h2 className="font-heading text-lg font-semibold mb-4">Agent Performance</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agentStats.length === 0 ? (
              <Card className="col-span-full"><CardContent className="py-6 text-center text-sm text-muted-foreground">No assigned jobs yet. Run orchestration to assign jobs to agents.</CardContent></Card>
            ) : (
              agentStats.map(({ agent, assigned, completed, rate }) => (
                <Card key={agent.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: agent.avatar_color || "#6366f1" }}>
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{agent.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-xs text-muted-foreground">Assigned</p><p className="text-lg font-semibold">{assigned}</p></div>
                      <div><p className="text-xs text-muted-foreground">Completed</p><p className="text-lg font-semibold text-emerald-600">{completed}</p></div>
                      <div><p className="text-xs text-muted-foreground">Rate</p><p className="text-lg font-semibold text-sky-600">{rate}%</p></div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Reasoning Logs + Recent Messages */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Brain className="w-5 h-5" /> Recent Reasoning Logs</h2>
            <Card>
              <CardContent className="pt-4 space-y-3 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No reasoning logs yet. Run orchestration to generate them.</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium line-clamp-2">{log.thought}</p>
                        <Badge variant="outline" className="text-xs shrink-0">{Math.round((log.confidence || 0) * 100)}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{log.decision}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Recent Agent Messages</h2>
            <Card>
              <CardContent className="pt-4 space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No messages yet. Chat with an agent to see activity.</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">{msg.message_type}</Badge>
                        <span className="text-xs text-muted-foreground">{msg.from_agent_id === "user" ? "User" : msg.from_agent_id?.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs text-muted-foreground">{msg.to_agent_id === "user" ? "User" : msg.to_agent_id?.slice(0, 8)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{msg.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
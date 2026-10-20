import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Briefcase, Brain, ListTodo, Zap, RefreshCw, Plus, Send, BookOpen, MessageSquare, Wand2, Layers, Activity, Code, Sparkles, Cpu, Rocket, Users, Search, ListChecks, Gauge, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const CONNECTOR_ID = "69db201897e4e8f9ae073be7";

const STATUS_STYLES = {
  open: "bg-sky-100 text-sky-700 border-sky-200",
  assigned: "bg-violet-100 text-violet-700 border-violet-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200"
};

const PRIORITY_STYLES = {
  urgent: "bg-rose-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-sky-500 text-white",
  low: "bg-slate-400 text-white"
};

const ROLE_COLORS = {
  researcher: "#0ea5e9", planner: "#8b5cf6", executor: "#f59e0b",
  reviewer: "#10b981", coordinator: "#ec4899", memory_keeper: "#6366f1", specialist: "#14b8a6"
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ openJobs: 0, activeAgents: 0, pendingTodos: 0, memories: 0 });
  const [jobs, setJobs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [jobFilter, setJobFilter] = useState("open");
  const [showNewJob, setShowNewJob] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", description: "", priority: "medium", type: "task" });
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [chatAgent, setChatAgent] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatting, setChatting] = useState(false);
  const [orchestrating, setOrchestrating] = useState(false);

  const loadAll = useCallback(async () => {
    const [jobsRes, agentsRes, todosRes, openCount, busyCount, pendingCount, memCount] = await Promise.all([
      base44.entities.Job.filter(jobFilter === "all" ? {} : { status: jobFilter }, { sort: "-created_date", limit: 50 }),
      base44.entities.Agent.filter({}, { sort: "-created_date", limit: 50 }),
      base44.entities.Todo.filter({ status: "pending" }, { sort: "-created_date", limit: 10 }),
      base44.entities.Job.count({ status: "open" }),
      base44.entities.Agent.count({ status: "busy" }),
      base44.entities.Todo.count({ status: "pending" }),
      base44.entities.Memory.count({})
    ]);
    setJobs(jobsRes.items || []);
    setAgents(agentsRes.items || []);
    setTodos(todosRes.items || []);
    setStats({
      openJobs: openCount,
      activeAgents: busyCount,
      pendingTodos: pendingCount,
      memories: memCount
    });
  }, [jobFilter]);

  useEffect(() => {
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (authed) {
          const me = await base44.auth.me();
          setUser(me);
          await loadAll();
          const msgRes = await base44.entities.AgentMessage.filter({}, { sort: "-created_date", limit: 8 });
          setMessages(msgRes.items || []);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAll]);

  const handleCreateJob = async () => {
    if (!newJob.title.trim()) return;
    await base44.entities.Job.create({
      title: newJob.title,
      description: newJob.description,
      priority: newJob.priority,
      type: newJob.type,
      status: "open"
    });
    setNewJob({ title: "", description: "", priority: "medium", type: "task" });
    setShowNewJob(false);
    await loadAll();
  };

  const handleOrchestrate = async () => {
    setOrchestrating(true);
    try {
      await base44.functions.invoke("orchestrateAgents", {});
      await loadAll();
    } catch (e) {
      // ignore
    } finally {
      setOrchestrating(false);
    }
  };

  const handleSyncTasks = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("syncGoogleTasks", { direction: "both" });
      setSyncStatus(res.data);
      await loadAll();
    } catch (e) {
      setSyncStatus({ error: "Connect your Google Tasks account first." });
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
      }
    }, 500);
  };

  const handleChat = async () => {
    if (!chatMessage.trim() || !chatAgent) return;
    setChatting(true);
    try {
      const res = await base44.functions.invoke("agentChat", { agent_id: chatAgent.id, message: chatMessage });
      setChatMessage("");
      const msgRes = await base44.entities.AgentMessage.filter({}, { sort: "-created_date", limit: 8 });
      setMessages(msgRes.items || []);
      return res.data;
    } catch (e) {
      // ignore
    } finally {
      setChatting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Sign in to NexusCore AI</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">Sign in to access your multi-agent workforce and live job board.</p>
            <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>Sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold leading-none">NexusCore AI</h1>
              <p className="text-xs text-muted-foreground">Multi-Agent Workforce</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/job-board"><Button variant="ghost" size="sm"><Briefcase className="w-4 h-4 mr-1.5" /> Job Board</Button></Link>
            <Link to="/prompt-studio"><Button variant="ghost" size="sm"><Wand2 className="w-4 h-4 mr-1.5" /> Prompt Studio</Button></Link>
            <Link to="/system-control"><Button variant="ghost" size="sm"><Cpu className="w-4 h-4 mr-1.5" /> System Control</Button></Link>
            <Link to="/prompt-lab"><Button variant="ghost" size="sm"><Sparkles className="w-4 h-4 mr-1.5" /> Prompt Lab</Button></Link>
            <Link to="/visual-editor"><Button variant="ghost" size="sm"><Code className="w-4 h-4 mr-1.5" /> Visual Editor</Button></Link>
            <Link to="/agent-activity"><Button variant="ghost" size="sm"><Activity className="w-4 h-4 mr-1.5" /> Activity</Button></Link>
            <Link to="/seo-simulator"><Button variant="ghost" size="sm"><Rocket className="w-4 h-4 mr-1.5" /> Growth Simulator</Button></Link>
            <Button variant="outline" size="sm" onClick={handleConnectGoogle}>
              <Zap className="w-4 h-4 mr-1.5" /> Connect Google Tasks
            </Button>
            <Button variant="outline" size="sm" onClick={() => base44.auth.logout(window.location.origin)}>
              Sign out
            </Button>
          </div>
        </div>

        {/* Client workflow strip */}
        <div className="max-w-7xl mx-auto px-6 pb-3 flex items-center gap-1 overflow-x-auto">
          {[
            { to: "/onboarding", label: "Client Onboarding", Icon: Users },
            { to: "/discovery", label: "Discovery Packages", Icon: Search },
            { to: "/workflow-map", label: "Workflow Map", Icon: ListChecks },
            { to: "/system-capabilities", label: "Capabilities", Icon: Layers },
            { to: "/system-benchmarks", label: "Benchmarks", Icon: Gauge },
            { to: "/system-audit", label: "System Audit", Icon: ShieldCheck },
          ].map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2.5 py-1.5 transition whitespace-nowrap"
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Open Jobs" value={stats.openJobs} color="text-sky-600" />
          <StatCard icon={Bot} label="Active Agents" value={stats.activeAgents} color="text-violet-600" />
          <StatCard icon={ListTodo} label="Pending Todos" value={stats.pendingTodos} color="text-amber-600" />
          <StatCard icon={Brain} label="Memories" value={stats.memories} color="text-indigo-600" />
        </div>

        {/* Job Board */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-heading text-xl font-semibold">Live Job Board</h2>
            </div>
            <div className="flex items-center gap-2">
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleOrchestrate} disabled={orchestrating}>
                <Zap className="w-4 h-4 mr-1.5" /> {orchestrating ? "Assigning..." : "Orchestrate"}
              </Button>
              <Dialog open={showNewJob} onOpenChange={setShowNewJob}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1.5" /> New Job</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Post a new job</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} placeholder="Research competitor pricing" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} placeholder="What should the agent do?" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Priority</Label>
                        <Select value={newJob.priority} onValueChange={v => setNewJob({ ...newJob, priority: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select value={newJob.type} onValueChange={v => setNewJob({ ...newJob, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="task">Task</SelectItem>
                            <SelectItem value="research">Research</SelectItem>
                            <SelectItem value="analysis">Analysis</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="sync">Sync</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewJob(false)}>Cancel</Button>
                    <Button onClick={handleCreateJob}>Post Job</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {jobs.length === 0 ? (
              <Card className="col-span-full"><CardContent className="py-10 text-center text-muted-foreground text-sm">No jobs in this view. Post a job to get started.</CardContent></Card>
            ) : (
              jobs.map(job => {
                const agent = agents.find(a => a.id === job.assigned_agent_id);
                return (
                  <Card key={job.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
                        <Badge className={`${PRIORITY_STYLES[job.priority] || PRIORITY_STYLES.medium} text-xs`} variant="secondary">{job.priority}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3">
                        {job.description && <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>}
                      <div className="flex items-center justify-between mt-auto">
                        <Badge className={`${STATUS_STYLES[job.status] || STATUS_STYLES.open} text-xs`} variant="outline">{job.status.replace("_", " ")}</Badge>
                        {agent && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[agent.role] || "#6366f1" }} />
                            {agent.name}
                          </span>
                        )}
                      </div>
                      {job.result && <p className="text-xs text-emerald-600 bg-emerald-50 rounded p-2 mt-1">{job.result}</p>}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* Agents + Chat */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-heading text-xl font-semibold">Agents</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {agents.length === 0 ? (
                <Card className="sm:col-span-2"><CardContent className="py-8 text-center text-muted-foreground text-sm">No agents yet. Agents will appear here once created.</CardContent></Card>
              ) : (
                agents.map(agent => (
                  <Card key={agent.id} className={chatAgent?.id === agent.id ? "ring-2 ring-primary" : ""}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ background: ROLE_COLORS[agent.role] || agent.avatar_color || "#6366f1" }}>
                          {agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-sm truncate">{agent.name}</h3>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${agent.status === "idle" ? "bg-emerald-400" : agent.status === "busy" ? "bg-amber-400" : "bg-slate-300"}`} />
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{agent.role}{agent.specialization ? ` · ${agent.specialization}` : ""}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs capitalize">{agent.status}</Badge>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setChatAgent(agent)}>
                              <MessageSquare className="w-3 h-3 mr-1" /> Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Chat panel */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-heading text-xl font-semibold">Agent Chat</h2>
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{chatAgent ? `Talking to ${chatAgent.name}` : "Select an agent to chat"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2 bg-muted/40 rounded-lg p-3 min-h-[80px]">
                  {messages.filter(m => chatAgent && (m.from_agent_id === chatAgent.id || m.to_agent_id === chatAgent.id)).slice().reverse().map(m => (
                    <div key={m.id} className={`text-xs ${m.from_agent_id === "user" ? "text-right" : ""}`}>
                      <span className={`inline-block px-2.5 py-1.5 rounded-lg max-w-[85%] ${m.from_agent_id === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                        {m.content}
                      </span>
                    </div>
                  ))}
                  {!chatAgent && <p className="text-xs text-muted-foreground text-center pt-4">Pick an agent above to start a conversation.</p>}
                </div>
                <div className="flex gap-2">
                  <Input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Message the agent..." onKeyDown={e => e.key === "Enter" && handleChat()} disabled={!chatAgent || chatting} />
                  <Button size="icon" onClick={handleChat} disabled={!chatAgent || chatting || !chatMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Todos + Google Tasks */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ListTodo className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-heading text-xl font-semibold">Todos</h2>
              </div>
              <Button variant="outline" size="sm" onClick={handleSyncTasks} disabled={syncing}>
                <RefreshCw className={`w-4 h-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} /> Sync Google Tasks
              </Button>
            </div>
            <Card>
              <CardContent className="pt-4 space-y-2">
                {todos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No pending todos. Sync from Google Tasks or add one.</p>
                ) : (
                  todos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className={`w-2 h-2 rounded-full ${todo.google_task_id ? "bg-emerald-400" : "bg-slate-300"}`} />
                      <span className="text-sm flex-1">{todo.title}</span>
                      {todo.google_task_id && <Badge variant="outline" className="text-xs">Google</Badge>}
                    </div>
                  ))
                )}
                {syncStatus && (
                  <p className="text-xs text-muted-foreground pt-2">{syncStatus.error ? syncStatus.error : `Pushed ${syncStatus.pushed || 0}, pulled ${syncStatus.pulled || 0}`}</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-heading text-xl font-semibold">Intelligence</h2>
            </div>
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">The knowledge base and reasoning logs power agent decisions. Agents read from knowledge and write reasoning logs as they work.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Knowledge entries</p>
                    <p className="text-2xl font-semibold mt-1">{stats.memories}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Reasoning logs</p>
                    <p className="text-2xl font-semibold mt-1">—</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Connect ChatGPT via the MCP server to let agents work from your chat. Publish the app, then add the MCP endpoint from the MCP page.</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Briefcase, Plus, Zap, ChevronLeft, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  open: "bg-sky-100 text-sky-700 border-sky-200",
  assigned: "bg-violet-100 text-violet-700 border-violet-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  review: "bg-cyan-100 text-cyan-700 border-cyan-200",
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

const STATUSES = ["open", "assigned", "in_progress", "review", "completed", "failed", "cancelled"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const TYPES = ["task", "research", "analysis", "review", "creative", "sync", "build", "funnel", "deploy"];

export default function JobBoard() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, completed: 0, total: 0 });
  const [filter, setFilter] = useState({ status: "all", priority: "all", type: "all" });
  const [showNewJob, setShowNewJob] = useState(false);
  const [orchestrating, setOrchestrating] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", description: "", priority: "medium", type: "task", tags: "", due_date: "" });

  const loadJobs = async () => {
    const query = {};
    if (filter.status !== "all") query.status = filter.status;
    if (filter.priority !== "all") query.priority = filter.priority;
    if (filter.type !== "all") query.type = filter.type;
    const [jobsRes, agentsRes, openCount, inProgCount, doneCount, totalCount] = await Promise.all([
      base44.entities.Job.filter(query, { sort: "-created_date", limit: 100 }),
      base44.entities.Agent.filter({}, { limit: 50 }),
      base44.entities.Job.count({ status: "open" }),
      base44.entities.Job.count({ status: "in_progress" }),
      base44.entities.Job.count({ status: "completed" }),
      base44.entities.Job.count({})
    ]);
    setJobs(jobsRes.items || []);
    setAgents(agentsRes.items || []);
    setStats({ open: openCount, inProgress: inProgCount, completed: doneCount, total: totalCount });
    setLoading(false);
  };

  React.useEffect(() => { loadJobs(); }, [filter.status, filter.priority, filter.type]);

  const handleCreate = async () => {
    if (!newJob.title.trim()) return;
    await base44.entities.Job.create({
      ...newJob,
      status: "open",
      progress: 0,
      applicant_count: 0
    });
    setNewJob({ title: "", description: "", priority: "medium", type: "task", tags: "", due_date: "" });
    setShowNewJob(false);
    await loadJobs();
  };

  const handleOrchestrate = async () => {
    setOrchestrating(true);
    try {
      await base44.functions.invoke("orchestrateAgents", {});
      await loadJobs();
    } finally { setOrchestrating(false); }
  };

  const handleUpdateJob = async (id, updates) => {
    await base44.entities.Job.update(id, updates);
    await loadJobs();
  };

  const agentName = (id) => {
    const a = agents.find(x => x.id === id);
    return a ? a.name : "Unassigned";
  };
  const agentRole = (id) => {
    const a = agents.find(x => x.id === id);
    return a ? a.role : null;
  };

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              <h1 className="font-heading text-lg font-semibold">Live Job Board</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/kanban"><Button variant="outline" size="sm">Kanban View</Button></Link>
            <Button variant="outline" size="sm" onClick={handleOrchestrate} disabled={orchestrating}>
              <Zap className="w-4 h-4 mr-1.5" /> {orchestrating ? "Assigning..." : "Orchestrate"}
            </Button>
            <Button size="sm" onClick={() => setShowNewJob(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Post Job
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Open" value={stats.open} color="text-sky-600" />
          <StatBox label="In Progress" value={stats.inProgress} color="text-amber-600" />
          <StatBox label="Completed" value={stats.completed} color="text-emerald-600" />
          <StatBox label="Total" value={stats.total} color="text-violet-600" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={filter.status} onValueChange={v => setFilter({ ...filter, status: v })}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filter.priority} onValueChange={v => setFilter({ ...filter, priority: v })}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filter.type} onValueChange={v => setFilter({ ...filter, type: v })}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.length === 0 ? (
            <Card className="col-span-full"><CardContent className="py-10 text-center text-muted-foreground text-sm">No jobs match this filter. Post a job to get started.</CardContent></Card>
          ) : (
            jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                agentName={agentName(job.assigned_agent_id)}
                agentRole={agentRole(job.assigned_agent_id)}
                onUpdate={handleUpdateJob}
              />
            ))
          )}
        </div>
      </main>

      <Dialog open={showNewJob} onOpenChange={setShowNewJob}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post a new job</DialogTitle></DialogHeader>
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
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={newJob.type} onValueChange={v => setNewJob({ ...newJob, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input value={newJob.tags} onChange={e => setNewJob({ ...newJob, tags: e.target.value })} placeholder="research, q4" />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="datetime-local" value={newJob.due_date} onChange={e => setNewJob({ ...newJob, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJob(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Post Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function JobCard({ job, agentName, agentRole, onUpdate }) {
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState("");

  const addNote = async () => {
    if (!noteText.trim()) return;
    const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const newNote = `[${timestamp}] ${noteText.trim()}`;
    const updatedNotes = job.progress_notes ? `${job.progress_notes}\n${newNote}` : newNote;
    await onUpdate(job.id, { progress_notes: updatedNotes });
    setNoteText("");
  };

  const cycleStatus = async () => {
    const idx = STATUSES.indexOf(job.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    const updates = { status: next };
    if (next === "in_progress" && !job.started_at) updates.started_at = new Date().toISOString();
    if (next === "completed") { updates.completed_at = new Date().toISOString(); updates.progress = 100; }
    await onUpdate(job.id, updates);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
          <Badge className={`${PRIORITY_STYLES[job.priority] || PRIORITY_STYLES.medium} text-xs shrink-0`} variant="secondary">{job.priority}</Badge>
        </div>
        {job.tags && <div className="flex flex-wrap gap-1 mt-1">{job.tags.split(",").map(t => <Badge key={t} variant="outline" className="text-xs">{t.trim()}</Badge>)}</div>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {job.description && <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>}

        {job.status === "in_progress" || job.status === "completed" || job.status === "review" ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Progress</span>
              <span className="font-medium">{job.progress || 0}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${job.progress || 0}%` }} />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <Badge className={`${STATUS_STYLES[job.status] || STATUS_STYLES.open} text-xs`} variant="outline">{job.status.replace("_", " ")}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            {agentRole && <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[agentRole] || "#6366f1" }} />}
            {agentName}
          </span>
        </div>

        {job.progress_notes && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">{job.progress_notes}</div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2">
          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={cycleStatus}>Advance Status</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNotes(!showNotes)}>
            {showNotes ? "Hide" : "Notes"}
          </Button>
        </div>

        {showNotes && (
          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <Input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a progress note..." className="h-8 text-xs" onKeyDown={e => e.key === "Enter" && addNote()} />
              <Button size="sm" className="h-8" onClick={addNote}>Add</Button>
            </div>
            {job.status === "in_progress" && (
              <div className="flex items-center gap-2">
                <Input type="number" min="0" max="100" defaultValue={job.progress || 0} className="h-8 text-xs w-20" onBlur={e => onUpdate(job.id, { progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} />
                <span className="text-xs text-muted-foreground">% complete</span>
              </div>
            )}
          </div>
        )}

        {job.result && <p className="text-xs text-emerald-600 bg-emerald-50 rounded p-2">{job.result}</p>}
      </CardContent>
    </Card>
  );
}
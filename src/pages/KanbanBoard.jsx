import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ChevronLeft, Layout } from "lucide-react";
import { Link } from "react-router-dom";

const COLUMNS = [
  { id: "open", label: "Open", color: "bg-sky-50", accent: "text-sky-700", border: "border-sky-200" },
  { id: "assigned", label: "Assigned", color: "bg-violet-50", accent: "text-violet-700", border: "border-violet-200" },
  { id: "in_progress", label: "In Progress", color: "bg-amber-50", accent: "text-amber-700", border: "border-amber-200" },
  { id: "review", label: "Review", color: "bg-cyan-50", accent: "text-cyan-700", border: "border-cyan-200" },
  { id: "completed", label: "Completed", color: "bg-emerald-50", accent: "text-emerald-700", border: "border-emerald-200" },
  { id: "failed", label: "Failed", color: "bg-rose-50", accent: "text-rose-700", border: "border-rose-200" },
  { id: "cancelled", label: "Cancelled", color: "bg-slate-50", accent: "text-slate-500", border: "border-slate-200" }
];

const PRIORITY_STYLES = {
  urgent: "bg-rose-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-sky-500 text-white",
  low: "bg-slate-400 text-white"
};

export default function KanbanBoard() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [orchestrating, setOrchestrating] = useState(false);

  const load = async () => {
    try {
      const [jobsRes, agentsRes] = await Promise.all([
        base44.entities.Job.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.Agent.filter({}, { limit: 50 })
      ]);
      setJobs(jobsRes.items || []);
      setAgents(agentsRes.items || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const jobId = result.draggableId;
    const newStatus = result.destination.droppableId;
    if (newStatus === result.source.droppableId) return;

    const job = jobs.find(j => j.id === jobId);
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));

    try {
      const updates = { status: newStatus };
      if (newStatus === "in_progress" && !job?.started_at) updates.started_at = new Date().toISOString();
      if (newStatus === "completed") { updates.completed_at = new Date().toISOString(); updates.progress = 100; }
      await base44.entities.Job.update(jobId, updates);
    } catch (e) {
      await load();
    }
  };

  const handleOrchestrate = async () => {
    setOrchestrating(true);
    try {
      await base44.functions.invoke("orchestrateAgents", {});
      await load();
    } finally { setOrchestrating(false); }
  };

  const agentName = (id) => agents.find(a => a.id === id)?.name || "Unassigned";

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background flex flex-col">
      <header className="border-b border-border bg-card shrink-0">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              <h1 className="font-heading text-lg font-semibold">Kanban Board</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/job-board"><Button variant="outline" size="sm">List View</Button></Link>
            <Button variant="outline" size="sm" onClick={handleOrchestrate} disabled={orchestrating}>
              <Zap className="w-4 h-4 mr-1.5" /> {orchestrating ? "Assigning..." : "Orchestrate"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(col => {
              const colJobs = jobs.filter(j => j.status === col.id);
              return (
                <Droppable droppableId={col.id} key={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`w-72 shrink-0 rounded-xl border ${col.border} ${col.color} flex flex-col ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}>
                      <div className={`px-4 py-3 border-b ${col.border} flex items-center justify-between`}>
                        <span className={`font-medium text-sm ${col.accent}`}>{col.label}</span>
                        <span className={`text-xs font-medium ${col.accent} bg-white/60 rounded-full px-2 py-0.5`}>{colJobs.length}</span>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
                        {colJobs.map((job, index) => (
                          <Draggable draggableId={job.id} index={index} key={job.id}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                className={`bg-card rounded-lg border border-border p-3 shadow-sm cursor-grab ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/40" : ""}`}>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-sm font-medium leading-snug">{job.title}</p>
                                  <Badge className={`${PRIORITY_STYLES[job.priority] || PRIORITY_STYLES.medium} text-xs shrink-0`} variant="secondary">{job.priority}</Badge>
                                </div>
                                {job.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{job.description}</p>}
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{agentName(job.assigned_agent_id)}</span>
                                  {job.progress > 0 && job.progress < 100 && <span className="text-muted-foreground">{job.progress}%</span>}
                                </div>
                                {(job.status === "in_progress" || job.status === "review" || job.status === "completed") && job.progress > 0 && (
                                  <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${job.progress}%` }} />
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colJobs.length === 0 && !snapshot.isDraggingOver && (
                          <p className="text-xs text-muted-foreground text-center py-4">Drop jobs here</p>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
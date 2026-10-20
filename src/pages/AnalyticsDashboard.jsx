import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, BarChart3, Activity, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AgentPerformanceCharts from "@/components/analytics/AgentPerformanceCharts";
import BacklinkTrafficTrends from "@/components/analytics/BacklinkTrafficTrends";

const STATUS_COLORS = {
  open: "#0ea5e9", assigned: "#8b5cf6", in_progress: "#f59e0b",
  review: "#06b6d4", completed: "#10b981", failed: "#f43f5e", cancelled: "#94a3b8"
};
const PRIORITY_COLORS = { low: "#94a3b8", medium: "#0ea5e9", high: "#f59e0b", urgent: "#f43f5e" };

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [agentStats, setAgentStats] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [priorityDist, setPriorityDist] = useState([]);
  const [jobsOverTime, setJobsOverTime] = useState([]);
  const [taskDist, setTaskDist] = useState([]);
  const [totals, setTotals] = useState({ jobs: 0, completed: 0, agents: 0, activeAgents: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [agentsRes, statusAgg, priorityAgg, timeAgg, taskAgg, completedAgg, assignedAgg, jobCount, completedCount] = await Promise.all([
          base44.entities.Agent.filter({}, { limit: 50 }),
          base44.entities.Job.aggregate({ groupBy: "status", count: true }),
          base44.entities.Job.aggregate({ groupBy: "priority", count: true }),
          base44.entities.Job.aggregate({ dateBucket: { field: "created_date", unit: "day" }, count: true, sort: "created_date" }),
          base44.entities.Todo.aggregate({ groupBy: "status", count: true }),
          base44.entities.Job.aggregate({ query: { status: "completed" }, groupBy: "assigned_agent_id", count: true }),
          base44.entities.Job.aggregate({ groupBy: "assigned_agent_id", count: true }),
          base44.entities.Job.count({}),
          base44.entities.Job.count({ status: "completed" })
        ]);

        const agents = agentsRes.items || [];
        const completedMap = {};
        (completedAgg.rows || []).forEach(r => { if (r._id) completedMap[r._id] = r.count; });
        const assignedMap = {};
        (assignedAgg.rows || []).forEach(r => { if (r._id) assignedMap[r._id] = r.count; });

        setAgentStats(agents.map(a => ({
          name: a.name.split(" ").slice(0, 2).join(" "),
          assigned: assignedMap[a.id] || 0,
          completed: completedMap[a.id] || 0
        })).filter(s => s.assigned > 0 || s.completed > 0));

        setStatusDist((statusAgg.rows || []).map(r => ({ name: (r._id || "").replace("_", " "), value: r.count, color: STATUS_COLORS[r._id] || "#94a3b8" })));
        setPriorityDist((priorityAgg.rows || []).map(r => ({ name: r._id, value: r.count, color: PRIORITY_COLORS[r._id] || "#94a3b8" })));
        setJobsOverTime((timeAgg.rows || []).map(r => ({ date: r._id, count: r.count })));
        setTaskDist((taskAgg.rows || []).map(r => ({ name: (r._id || "").replace("_", " "), value: r.count })));
        setTotals({ jobs: jobCount, completed: completedCount, agents: agents.length, activeAgents: agents.filter(a => a.status === "busy").length });
      } catch (e) {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const completionRate = totals.jobs > 0 ? Math.round((totals.completed / totals.jobs) * 100) : 0;

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h1 className="font-heading text-lg font-semibold">Analytics Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Jobs" value={totals.jobs} color="text-violet-600" />
          <StatCard icon={CheckCircle2} label="Completed" value={totals.completed} color="text-emerald-600" />
          <StatCard icon={TrendingUp} label="Completion Rate" value={`${completionRate}%`} color="text-sky-600" />
          <StatCard icon={Activity} label="Active Agents" value={totals.activeAgents} color="text-amber-600" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Agent Activity</CardTitle></CardHeader>
            <CardContent>
              {agentStats.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No agent activity yet.</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={agentStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="assigned" fill="#8b5cf6" name="Assigned" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Job Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {statusDist.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No jobs yet.</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Job Priority Breakdown</CardTitle></CardHeader>
            <CardContent>
              {priorityDist.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No jobs yet.</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priorityDist}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Jobs" radius={[4, 4, 0, 0]}>
                      {priorityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Jobs Created Over Time</CardTitle></CardHeader>
            <CardContent>
              {jobsOverTime.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={jobsOverTime}>
                    <defs>
                      <linearGradient id="jobGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#jobGradient)" name="Jobs" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {taskDist.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Task Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={taskDist}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Tasks" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Backlink Site Traffic Comparison (Google Analytics) */}
        <div>
          <h2 className="font-heading font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Backlink Site Traffic Comparison</h2>
          <BacklinkTrafficTrends />
        </div>

        {/* Agent Performance Over Time */}
        <div>
          <h2 className="font-heading font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Agent Performance Tracking</h2>
          <AgentPerformanceCharts />
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
            <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
          </div>
          <Icon className="w-8 h-8 text-muted-foreground/40" />
        </div>
      </CardContent>
    </Card>
  );
}
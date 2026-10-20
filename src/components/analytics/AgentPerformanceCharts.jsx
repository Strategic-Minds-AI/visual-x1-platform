import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Target, Award } from "lucide-react";

const SYSTEM_GOAL = 80;
const AGENT_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#ec4899"];

export default function AgentPerformanceCharts() {
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [topPerformer, setTopPerformer] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const agentsRes = await base44.entities.Agent.filter({}, { limit: 50 });
        const agents = agentsRes.items || [];

        const completedAgg = await base44.entities.Job.aggregate({
          query: { status: "completed" },
          groupBy: "assigned_agent_id",
          count: true
        });
        const assignedAgg = await base44.entities.Job.aggregate({
          groupBy: "assigned_agent_id",
          count: true
        });

        const completedMap = {};
        (completedAgg.rows || []).forEach(r => { if (r._id) completedMap[r._id] = r.count; });
        const assignedMap = {};
        (assignedAgg.rows || []).forEach(r => { if (r._id) assignedMap[r._id] = r.count; });

        const stats = agents.map((a, i) => {
          const assigned = assignedMap[a.id] || 0;
          const completed = completedMap[a.id] || 0;
          const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
          return {
            name: a.name.split(" ").slice(0, 2).join(" "),
            fullName: a.name,
            assigned, completed, rate,
            color: AGENT_COLORS[i % AGENT_COLORS.length]
          };
        }).filter(s => s.assigned > 0);

        setAgentData(stats);

        const timeAgg = await base44.entities.Job.aggregate({
          query: { status: "completed" },
          dateBucket: { field: "completed_at", unit: "day" },
          groupBy: "assigned_agent_id",
          count: true,
          sort: "completed_at"
        });

        const dateMap = {};
        (timeAgg.rows || []).forEach(r => {
          const date = r._id?.date || r._id || "unknown";
          const agentId = r._id?.assigned_agent_id || r.assigned_agent_id;
          if (!dateMap[date]) dateMap[date] = { date };
          const agent = agents.find(a => a.id === agentId);
          const name = agent ? agent.name.split(" ").slice(0, 2).join(" ") : "Unknown";
          dateMap[date][name] = (dateMap[date][name] || 0) + r.count;
        });

        const sortedDates = Object.values(dateMap).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        setTimeData(sortedDates.slice(-14));

        if (stats.length > 0) {
          const top = stats.reduce((best, s) => s.rate > best.rate ? s : best, stats[0]);
          setTopPerformer(top);
        }
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading agent performance...</CardContent></Card>;
  }

  if (agentData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Agent Performance Over Time</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">No agent task data yet. Assign jobs to agents to see performance trends.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">System Goal</p><p className="text-2xl font-semibold mt-1 text-primary">{SYSTEM_GOAL}%</p></div>
              <Target className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Agents Above Goal</p><p className="text-2xl font-semibold mt-1 text-emerald-600">{agentData.filter(a => a.rate >= SYSTEM_GOAL).length}</p></div>
              <Award className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Top Performer</p><p className="text-lg font-semibold mt-1">{topPerformer?.name || "—"}</p><p className="text-xs text-emerald-600">{topPerformer?.rate || 0}% completion</p></div>
              <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Agent Completion Rate vs System Goal</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => `${v}%`} />
              <ReferenceLine x={SYSTEM_GOAL} stroke="#f43f5e" strokeWidth={2} label={{ value: "Goal", position: "top", fill: "#f43f5e", fontSize: 10 }} />
              <Bar dataKey="rate" name="Completion Rate" radius={[0, 4, 4, 0]}>
                {agentData.map((entry, i) => <Cell key={i} fill={entry.rate >= SYSTEM_GOAL ? "#10b981" : entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {timeData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Completion Trends Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {agentData.slice(0, 5).map((agent, i) => (
                  <Line key={agent.name} type="monotone" dataKey={agent.name} stroke={agent.color} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
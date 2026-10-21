import React, { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton, StatusPill, Empty, ErrorText, Metric } from "@/components/admin/adminUi";
import AgentCard from "@/components/agents/AgentCard";
import AgentBuilderForm from "@/components/agents/AgentBuilderForm";
import TaskAssignForm from "@/components/agents/TaskAssignForm";
import { AGENT_BLUEPRINT } from "@/data/agentCatalog";
import { readRecords } from "@/lib/loopApi";
import { base44 } from "@/api/base44Client";

// The registry: every agent, what it can do, how far it may go, and the work it has
// been given. The builder writes here, and the task system assigns from here.
export default function AgentRegistryWorkspace() {
  const [agents, setAgents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [agentRows, assignmentRows] = await Promise.all([
        readRecords("Agent", { limit: 60 }),
        readRecords("TaskAssignment", { limit: 40, sort: "-created_date" }),
      ]);
      setAgents(agentRows);
      setAssignments(assignmentRows);
    } catch (e) {
      setError(e?.message || "Could not read the registry.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const installStarters = async () => {
    setBusy(true);
    setError("");
    try {
      const existing = new Set(agents.map((a) => a.name));
      const missing = AGENT_BLUEPRINT.filter((a) => !existing.has(a.name));
      if (missing.length) {
        await base44.entities.Agent.bulkCreate(
          missing.map((a) => ({
            name: a.name,
            role: a.role,
            specialization: a.specialization,
            system_prompt: a.system_prompt,
            avatar_color: a.avatar_color,
            skills: a.skills,
            jobs_owned: a.jobs_owned,
            access_level: a.access_level,
            autonomy_level: a.autonomy_level,
            tools: a.tools,
            connectors: a.connectors,
            vault_access: a.vault_access,
            knowledge_scope: a.knowledge_scope,
            memory_scope: a.memory_scope,
            channel: a.channel,
            reports_to: a.reports_to,
            can_command: a.can_command,
            veto_power: a.veto_power,
            status: "idle",
          }))
        );
      }
      await load();
    } catch (e) {
      setError(e?.message || "Could not register the starters.");
    } finally {
      setBusy(false);
    }
  };

  const saveAgent = async (form) => {
    setBusy(true);
    setError("");
    try {
      if (editing?.id) {
        await base44.entities.Agent.update(editing.id, form);
      } else {
        await base44.entities.Agent.create({ ...form, status: "idle" });
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(e?.message || "Could not save the agent.");
    } finally {
      setBusy(false);
    }
  };

  const closeAssignment = async (assignment, status) =>
    base44.entities.TaskAssignment
      .update(assignment.id, { status, completed_at: new Date().toISOString() })
      .then(load);

  return (
    <div className="cp-admin-stack">
      <div className="cp-metrics">
        <Metric label="Registered agents" value={String(agents.length)} foot={`${AGENT_BLUEPRINT.length} starters available`} accent />
        <Metric label="With vault access" value={String(agents.filter((a) => a.vault_access).length)} foot="Guardian scope only" />
        <Metric label="Open assignments" value={String(assignments.filter((a) => ["open", "scheduled", "in_progress"].includes(a.status)).length)} foot="Work in flight" />
        <Metric label="With a veto" value={String(agents.filter((a) => a.veto_power).length)} foot="Independent checks" />
      </div>

      <ErrorText>{error}</ErrorText>

      <Panel
        kicker="AGENT REGISTRY"
        title="Who works here, and what they may do"
        aside={
          <div className="cp-admin-actions">
            {agents.length === 0 && (
              <PrimaryButton disabled={busy} onClick={installStarters}>
                <Plus size={13} /> INSTALL THE STARTERS
              </PrimaryButton>
            )}
            <OutlineButton onClick={() => setEditing({})}>
              <LayoutGrid size={13} /> BUILD AN AGENT
            </OutlineButton>
          </div>
        }
      >
        {agents.length === 0 ? (
          <Empty>
            No agents in the registry yet. Install the starters to register the orchestrator, the guardian and the
            specialists — then edit any of them, or build your own.
          </Empty>
        ) : (
          <div className="cp-admin-stack">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onEdit={setEditing} />
            ))}
          </div>
        )}
      </Panel>

      {editing && (
        <AgentBuilderForm
          editing={editing.id ? editing : null}
          busy={busy}
          onSave={saveAgent}
          onCancel={() => setEditing(null)}
          error={error}
        />
      )}

      <TaskAssignForm agents={agents} busy={busy} setBusy={setBusy} />

      <Panel kicker="ASSIGNMENTS" title="Work handed out">
        {assignments.length === 0 ? (
          <Empty>Nothing assigned yet. An assignment reaches Google Tasks, Calendar or email — whichever you tick.</Empty>
        ) : (
          <div className="cp-admin-stack">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="cp-admin-inline-field">
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{assignment.title}</h3>
                  <p className="cp-fine">
                    {assignment.work_type} · {assignment.assigned_agent} · due{" "}
                    {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "not set"}
                  </p>
                  <p className="cp-fine">
                    Landed in · {(assignment.channels || []).join(", ") || "nothing yet"}
                    {assignment.google_task_id ? " · task created" : ""}
                    {assignment.calendar_event_id ? " · event created" : ""}
                  </p>
                </div>
                <div className="cp-admin-row-buttons">
                  <StatusPill>{assignment.status}</StatusPill>
                  {assignment.status !== "done" && (
                    <button className="cp-text-link" onClick={() => closeAssignment(assignment, "done")}>MARK DONE</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
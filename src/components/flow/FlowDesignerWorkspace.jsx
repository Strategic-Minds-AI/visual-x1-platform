import React, { useCallback, useEffect, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Save, Trash2, Workflow } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton, StatusPill, Empty, ErrorText } from "@/components/admin/adminUi";
import { Switch } from "@/components/ui/switch";
import StepLibrary from "@/components/flow/StepLibrary";
import FlowCanvas from "@/components/flow/FlowCanvas";
import StepConfigPanel from "@/components/flow/StepConfigPanel";
import FlowRunPanel from "@/components/flow/FlowRunPanel";
import { STEP_PRESETS, STEP_TYPES, TRIGGER_KINDS, emptyStep, stepTypeById } from "@/data/flowCatalog";
import { runFlow, readRecords } from "@/lib/loopApi";
import { base44 } from "@/api/base44Client";

// The visual workflow designer. Steps are dragged from the library onto the canvas,
// configured in place, saved as a flow, and run deterministically by the runner —
// which is the same mechanism whatever the flow links together: social, funnels,
// task assignment or the loop itself.
const LIBRARY = [
  ...STEP_PRESETS.map((p) => ({ id: `preset-${p.id}`, label: p.label, group: "Ready-made", type: p.type, config: p.config })),
  ...STEP_TYPES.map((t) => ({ id: `type-${t.id}`, label: t.label, group: "Step types", type: t.id, config: {} })),
];

const newFlow = () => ({
  name: "Untitled automation",
  purpose: "",
  category: "custom",
  trigger_kind: "manual",
  schedule_cron: "",
  steps: [],
  requires_approval: true,
  status: "draft",
  linked_targets: [],
  owner_agent: "X1 Orchestrator",
});

export default function FlowDesignerWorkspace() {
  const [flows, setFlows] = useState([]);
  const [draft, setDraft] = useState(null);
  const [selectedStep, setSelectedStep] = useState("");
  const [log, setLog] = useState([]);
  const [held, setHeld] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setFlows(await readRecords("AutomationFlow", { limit: 50 }));
    } catch (e) {
      setError(e?.message || "Could not read the saved flows.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openFlow = (flow) => {
    setDraft({
      id: flow.id,
      name: flow.name,
      purpose: flow.purpose || "",
      category: flow.category || "custom",
      trigger_kind: flow.trigger_kind || "manual",
      schedule_cron: flow.schedule_cron || "",
      requires_approval: flow.requires_approval !== false,
      status: flow.status || "draft",
      linked_targets: flow.linked_targets || [],
      owner_agent: flow.owner_agent || "X1 Orchestrator",
      run_count: flow.run_count || 0,
      last_run_at: flow.last_run_at,
      last_run_status: flow.last_run_status,
      steps: (() => {
        try {
          return JSON.parse(flow.steps_json || "[]");
        } catch {
          return [];
        }
      })(),
    });
    setSelectedStep("");
    setLog([]);
    setHeld("");
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || !draft) return;
    if (source.droppableId === "library") {
      const entry = LIBRARY[source.index];
      if (!entry) return;
      const step = { ...emptyStep(entry.type), config: { ...emptyStep(entry.type).config, ...entry.config }, label: entry.label };
      const steps = [...draft.steps];
      steps.splice(destination.index, 0, step);
      setDraft({ ...draft, steps });
      setSelectedStep(step.id);
      return;
    }
    if (source.droppableId === "canvas" && destination.droppableId === "canvas") {
      const steps = [...draft.steps];
      const [moved] = steps.splice(source.index, 1);
      steps.splice(destination.index, 0, moved);
      setDraft({ ...draft, steps });
    }
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: draft.name,
        purpose: draft.purpose,
        category: draft.category,
        trigger_kind: draft.trigger_kind,
        schedule_cron: draft.schedule_cron,
        steps_json: JSON.stringify(draft.steps),
        step_count: draft.steps.length,
        linked_targets: (draft.linked_targets || []).filter(Boolean),
        owner_agent: draft.owner_agent,
        requires_approval: draft.requires_approval !== false,
        status: draft.status,
      };
      const saved = draft.id
        ? await base44.entities.AutomationFlow.update(draft.id, payload)
        : await base44.entities.AutomationFlow.create(payload);
      setDraft({ ...draft, id: saved.id });
      await load();
    } catch (e) {
      setError(e?.message || "Could not save the flow.");
    } finally {
      setBusy(false);
    }
  };

  const execute = async () => {
    if (!draft?.id) {
      setError("Save the flow before running it.");
      return;
    }
    setBusy(true);
    setError("");
    setHeld("");
    try {
      const result = await runFlow(draft.id, { approved: true });
      if (result?.held) {
        setHeld(result.reason);
        setLog([]);
      } else {
        setLog(result?.log || []);
      }
      await load();
    } catch (e) {
      setError(e?.message || "The run failed.");
    } finally {
      setBusy(false);
    }
  };

  const selected = draft?.steps.find((s) => s.id === selectedStep) || null;

  return (
    <div className="cp-admin-stack">
      <Panel
        kicker="FLOW DESIGNER"
        title="One automation across social, funnels and tasks"
        aside={
          <div className="cp-admin-actions">
            <OutlineButton onClick={() => { setDraft(newFlow()); setLog([]); setSelectedStep(""); }}>
              <Workflow size={13} /> NEW FLOW
            </OutlineButton>
            <PrimaryButton disabled={busy || !draft} onClick={save}>
              <Save size={13} /> SAVE FLOW
            </PrimaryButton>
          </div>
        }
      >
        <ErrorText>{error}</ErrorText>

        <div className="cp-admin-grid">
          {flows.length === 0 && <Empty>No flows saved yet. Start one above, then drag steps in.</Empty>}
          {flows.map((flow) => (
            <div key={flow.id} className="cp-admin-inline-field">
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>{flow.name}</h3>
                <p className="cp-fine">
                  {flow.category} · {flow.trigger_kind} · {flow.step_count || 0} step(s) ·{" "}
                  {flow.requires_approval ? "needs approval" : "runs freely"}
                </p>
              </div>
              <div className="cp-admin-row-buttons">
                <StatusPill>{flow.status}</StatusPill>
                <button className="cp-text-link" onClick={() => openFlow(flow)}>OPEN</button>
                <button
                  className="cp-text-link"
                  onClick={async () => {
                    await base44.entities.AutomationFlow.delete(flow.id);
                    setDraft(null);
                    await load();
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {draft && (
        <>
          <Panel kicker="THIS FLOW" title={draft.name} aside={<StatusPill>{draft.steps.length} step(s)</StatusPill>}>
            <div className="cp-admin-grid">
              <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
                <span className="cp-fine" style={{ minWidth: 110 }}>Name</span>
                <input className="cp-field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </label>
              <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
                <span className="cp-fine" style={{ minWidth: 110 }}>Purpose</span>
                <input className="cp-field" value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} />
              </label>
              <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
                <span className="cp-fine" style={{ minWidth: 110 }}>Category</span>
                <select className="cp-field" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {["site", "social", "funnel", "tasks", "growth", "operations", "custom"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
                <span className="cp-fine" style={{ minWidth: 110 }}>Trigger</span>
                <select className="cp-field" value={draft.trigger_kind} onChange={(e) => setDraft({ ...draft, trigger_kind: e.target.value })}>
                  {TRIGGER_KINDS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              {draft.trigger_kind === "schedule" && (
                <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
                  <span className="cp-fine" style={{ minWidth: 110 }}>Cron</span>
                  <input className="cp-field" placeholder="0 9 * * 1" value={draft.schedule_cron} onChange={(e) => setDraft({ ...draft, schedule_cron: e.target.value })} />
                </label>
              )}
              <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
                <span className="cp-fine" style={{ minWidth: 110 }}>Drives</span>
                <input
                  className="cp-field"
                  placeholder="social accounts, funnel names, agent names"
                  value={(draft.linked_targets || []).join(", ")}
                  onChange={(e) => setDraft({ ...draft, linked_targets: e.target.value.split(",").map((s) => s.trim()) })}
                />
              </label>
              <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
                <span className="cp-fine" style={{ minWidth: 110 }}>Requires approval</span>
                <Switch checked={draft.requires_approval !== false} onCheckedChange={(v) => setDraft({ ...draft, requires_approval: v })} />
              </label>
              <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
                <span className="cp-fine" style={{ minWidth: 110 }}>Status</span>
                <select className="cp-field" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  {["draft", "active", "paused"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            {draft.trigger_kind === "schedule" && (
              <p className="cp-fine">
                A saved cron is the flow's declared cadence. Scheduled firing itself runs through a platform workflow on
                that cadence, which can call this flow from its own steps.
              </p>
            )}
          </Panel>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="cp-admin-grid">
              <StepLibrary entries={LIBRARY} />
              <Panel
                kicker="THE FLOW"
                title="Runs top to bottom, in this order"
                aside={<StatusPill>{stepTypeById(draft.steps[0]?.type) ? "ready" : "empty"}</StatusPill>}
              >
                <FlowCanvas
                  steps={draft.steps}
                  selectedId={selectedStep}
                  onSelect={setSelectedStep}
                  onRemove={(id) => {
                    setDraft({ ...draft, steps: draft.steps.filter((s) => s.id !== id) });
                    setSelectedStep("");
                  }}
                />
              </Panel>
              <StepConfigPanel
                step={selected}
                onChange={(next) => setDraft({ ...draft, steps: draft.steps.map((s) => (s.id === next.id ? next : s)) })}
                onDone={() => setSelectedStep("")}
              />
            </div>
          </DragDropContext>

          <FlowRunPanel
            flow={{ ...draft, run_count: draft.run_count, last_run_at: draft.last_run_at, last_run_status: draft.last_run_status }}
            log={log}
            held={held}
            busy={busy}
            onRun={execute}
            error={error}
          />
        </>
      )}
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlatformNav from "@/components/PlatformNav";
import PhaseRail from "@/components/workflow/PhaseRail";
import StepRow from "@/components/workflow/StepRow";
import { buildWorkflowSteps, TOTAL_WORKFLOW_STEPS } from "@/data/workflowTemplate";
import { Loader2, AlertCircle, ListChecks, Flag } from "lucide-react";

export default function WorkflowMap() {
  const [params] = useSearchParams();
  const [intakes, setIntakes] = useState([]);
  const [intakeId, setIntakeId] = useState(params.get("intake") || "");
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [activePhase, setActivePhase] = useState(null);

  const loadIntakes = async () => {
    const { items } = await base44.entities.ClientIntake.filter({}, { sort: "-created_date", limit: 50 });
    setIntakes(items || []);
    if (!intakeId && items?.length) setIntakeId(items[0].id);
  };

  const loadSteps = async (id) => {
    const { items } = await base44.entities.WorkflowStep.filter(
      { intake_id: id }, { sort: "step_order", limit: 200 }
    );
    return items || [];
  };

  useEffect(() => { loadIntakes().catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (!intakeId) return;
    (async () => {
      setSeeding(true);
      setError(null);
      try {
        let existing = await loadSteps(intakeId);
        if (existing.length === 0) {
          const intake = intakes.find((i) => i.id === intakeId);
          const created = buildWorkflowSteps(intakeId, intake?.company_name || "Project");
          await base44.entities.WorkflowStep.bulkCreate(created);
          existing = await loadSteps(intakeId);
        }
        setSteps(existing);
        setActivePhase((p) => p || existing[0]?.phase || null);
      } catch (e) {
        setError(e.message || "The checklist could not be set up.");
      } finally {
        setSeeding(false);
      }
    })();
  }, [intakeId]);

  const phases = useMemo(() => {
    const map = new Map();
    steps.forEach((s) => {
      const entry = map.get(s.phase) || {
        name: s.phase, order: s.phase_order, total: 0, approved: 0, inProgress: 0, blocked: 0, gatesPending: 0,
      };
      entry.total += 1;
      if (s.status === "approved") entry.approved += 1;
      if (s.status === "in_progress") entry.inProgress += 1;
      if (s.status === "blocked") entry.blocked += 1;
      if (s.is_gate && s.status !== "approved") entry.gatesPending += 1;
      map.set(s.phase, entry);
    });
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [steps]);

  const stats = useMemo(() => ({
    total: steps.length,
    approved: steps.filter((s) => s.status === "approved").length,
    open: steps.filter((s) => s.status !== "approved").length,
    blocked: steps.filter((s) => s.status === "blocked").length,
    gates: steps.filter((s) => s.is_gate).length,
    gatesPending: steps.filter((s) => s.is_gate && s.status !== "approved").length,
  }), [steps]);

  const pct = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;

  const visible = steps.filter((s) => {
    if (activePhase && s.phase !== activePhase) return false;
    if (filter === "open") return s.status !== "approved";
    if (filter === "gates") return s.is_gate;
    if (filter === "blocked") return s.status === "blocked";
    if (filter === "approved") return s.status === "approved";
    return true;
  });

  const updateStep = async (step, patch) => {
    setBusy(true);
    try {
      const payload = { ...patch };
      if (patch.status === "approved") payload.completed_at = new Date().toISOString();
      await base44.entities.WorkflowStep.update(step.id, payload);
      setSteps((list) => list.map((s) => (s.id === step.id ? { ...s, ...payload } : s)));
    } catch (e) {
      setError(e.message || "That update did not save.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PlatformNav />
        <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav />
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-5">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <header className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-lg font-semibold flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary" /> Workflow map and checklist
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {TOTAL_WORKFLOW_STEPS} steps across {phases.length || 10} phases, each with an owner, evidence to attach, and the gates that stop work until something is shown.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <Select value={intakeId} onValueChange={setIntakeId}>
                <SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger>
                <SelectContent>
                  {intakes.length === 0 ? (
                    <SelectItem value="none" disabled>No client intakes yet</SelectItem>
                  ) : intakes.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.company_name || i.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {[
              ["Steps done", `${stats.approved}/${stats.total}`],
              ["Open", stats.open],
              ["Blocked", stats.blocked],
              ["Gates cleared", `${stats.gates - stats.gatesPending}/${stats.gates}`],
              ["Project complete", `${pct}%`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
                <p className="text-lg font-semibold mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-4">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="flex items-center gap-1.5 mt-4 flex-wrap">
            {[["all", "All steps"], ["open", "Open"], ["gates", "Gates"], ["blocked", "Blocked"], ["approved", "Done"]].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                  filter === k ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
            {activePhase && (
              <button type="button" onClick={() => setActivePhase(null)} className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted">
                Viewing: {activePhase} ✕
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr] items-start">
          <aside className="lg:sticky lg:top-4">
            <PhaseRail phases={phases} activePhase={activePhase} onSelect={setActivePhase} />
          </aside>

          <section className="space-y-2">
            {intakes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">No client intakes yet, so there is no project to measure.</p>
                <Link to="/onboarding"><Button size="sm">Start a client intake</Button></Link>
              </div>
            ) : seeding ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Setting up this project's checklist...</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">Nothing matches this view.</p>
              </div>
            ) : (
              visible.map((s) => (
                <StepRow
                  key={s.id}
                  step={s}
                  index={s.step_order}
                  busy={busy}
                  onAdvance={updateStep}
                  onBlock={(step, status) => updateStep(step, { status })}
                  onSaveEvidence={(step, evidence) => updateStep(step, { evidence })}
                />
              ))
            )}

            {stats.gatesPending > 0 && (
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 flex items-start gap-3">
                <Flag className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-medium">{stats.gatesPending} gate(s) waiting for a decision</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gates are where the client sees a rendering and approves before the next phase starts — brand, automations and launch all stop here until they clear.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlatformNav from "@/components/PlatformNav";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import ToolPicker from "@/components/onboarding/ToolPicker";
import ReviewSummary from "@/components/onboarding/ReviewSummary";
import { TextField, AreaField } from "@/components/onboarding/IntakeField";
import { INDUSTRY_OPTIONS, BUSINESS_STAGES, GOAL_KINDS, GOAL_HORIZONS, ALL_TOOLS } from "@/data/intakeCatalog";
import { Sparkles, Loader2, ArrowRight, ChevronLeft, AlertCircle, Search, Wand2 } from "lucide-react";

const STEPS = [
  { id: "outcome", label: "The outcome you want" },
  { id: "client", label: "Who you are" },
  { id: "business", label: "The business" },
  { id: "pain", label: "What is not working" },
  { id: "vision", label: "Your AI system vision" },
  { id: "tools", label: "What to automate" },
  { id: "goal", label: "Lock the goal" },
  { id: "review", label: "Review and research" },
];

const RESEARCH_STEPS = [
  "Scanning the public surface of the business",
  "Finding the strongest competitors inside the radius",
  "Pulling their ratings, complaints and price signals",
  "Scoring every competitor's frontend and offer on the rubric",
  "Mapping the industry offer set, pricing and ideal customer",
  "Building the dominant benchmark and the counter strategy",
];

const EMPTY = {
  full_name: "", email: "", phone: "", address: "", city: "", state: "", postal_code: "",
  company_name: "", industry: "", business_stage: "existing_business", website_url: "",
  primary_services: "", service_area: "", seed_sentence: "", pain_points: "", desired_outcomes: "",
  ideal_system_vision: "", goal_kind: "leads", goal_value: "", goal_horizon: "12m", monthly_budget: "",
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [vision, setVision] = useState(null);
  const [selectedTools, setSelectedTools] = useState([]);
  const [customTools, setCustomTools] = useState("");
  const [expanding, setExpanding] = useState(false);
  const [running, setRunning] = useState(false);
  const [researchStep, setResearchStep] = useState(0);
  const [error, setError] = useState(null);
  const step = STEPS[index];
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const expandVision = async () => {
    setError(null);
    if ((form.seed_sentence || "").trim().length < 8) {
      setError("Write one sentence first — the outcome you want, in your own words.");
      return;
    }
    setExpanding(true);
    try {
      const res = await base44.functions.invoke("draftVisionStatement", {
        seed_sentence: form.seed_sentence,
        context: [form.company_name, form.industry, form.pain_points, form.desired_outcomes].filter(Boolean).join(" | "),
        tools: ALL_TOOLS.map((t) => ({ id: t.id, label: t.label })),
      });
      if (res.data?.error) setError(res.data.error);
      else {
        setVision(res.data.vision);
        const rec = res.data.vision?.recommended_tool_ids || [];
        setSelectedTools((ids) => [...new Set([...ids, ...rec])]);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "The expansion did not run.");
    } finally {
      setExpanding(false);
    }
  };

  const canAdvance = () => {
    if (step.id === "outcome") return (form.seed_sentence || "").trim().length >= 8;
    if (step.id === "client") return Boolean(form.full_name.trim() && form.email.trim());
    if (step.id === "business") return Boolean(form.company_name.trim() && form.industry.trim());
    return true;
  };

  const runResearch = async (intakeId) => {
    setRunning(true);
    setError(null);
    const ticker = setInterval(() => setResearchStep((s) => Math.min(s + 1, RESEARCH_STEPS.length - 1)), 9000);
    try {
      const res = await base44.functions.invoke("clientDiscovery", {
        intake_id: intakeId, radius_miles: 75, inner_radius_miles: 25,
      });
      if (res.data?.error) setError(res.data.error);
      else {
        navigate(`/discovery?report=${res.data.report_id}`);
        return;
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Research failed to run.");
    } finally {
      clearInterval(ticker);
      setRunning(false);
      setResearchStep(0);
    }
  };

  const submit = async () => {
    setError(null);
    setRunning(true);
    try {
      const created = await base44.entities.ClientIntake.create({
        ...form,
        goal_value: Number(form.goal_value) || 0,
        monthly_budget: Number(form.monthly_budget) || 0,
        vision_statement: vision?.vision_statement || "",
        vision_json: JSON.stringify(vision || {}),
        ideal_system_vision: form.ideal_system_vision || vision?.vision_statement || "",
        selected_tools: selectedTools,
        custom_tools: customTools,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      });
      await runResearch(created.id);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "The intake could not be saved.");
      setRunning(false);
    }
  };

  if (running) {
    return (
      <div className="min-h-screen bg-background">
        <PlatformNav />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div>
                <h1 className="font-heading font-semibold">Discovery is running</h1>
                <p className="text-xs text-muted-foreground">
                  Three research passes and a rubric scoring run for every competitor. Usually a minute or two.
                </p>
              </div>
            </div>
            <ol className="space-y-2">
              {RESEARCH_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      i < researchStep
                        ? "w-2 h-2 rounded-full bg-emerald-500"
                        : i === researchStep
                          ? "w-2 h-2 rounded-full bg-primary animate-pulse"
                          : "w-2 h-2 rounded-full bg-muted"
                    }
                  />
                  <span className={i <= researchStep ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                </li>
              ))}
            </ol>
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr] items-start">
          <aside className="lg:sticky lg:top-4 space-y-4">
            <div>
              <h1 className="font-heading text-lg font-semibold">Client onboarding</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Answers compound into the research, the strategy options and the prediction ranges.
              </p>
            </div>
            <OnboardingProgress steps={STEPS} currentIndex={index} onJump={setIndex} />
          </aside>

          <section className="space-y-6">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <div>
                <h2 className="font-heading text-base font-semibold">{step.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Question {index + 1} of {STEPS.length}</p>
              </div>

              {step.id === "outcome" && (
                <div className="space-y-4">
                  <AreaField
                    label="In one sentence, describe the outcome you want"
                    hint="Plain words. What should be true in a year that is not true today?"
                    required
                    rows={3}
                    value={form.seed_sentence}
                    onChange={(v) => set({ seed_sentence: v })}
                    placeholder="I want to be the busiest plumber in Miami without answering the phone myself."
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button onClick={expandVision} disabled={expanding} size="sm">
                      {expanding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
                      {expanding ? "Expanding..." : "Expand into a vision statement"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Rewrites your sentence into a structured vision and suggests the automations it implies.
                    </span>
                  </div>

                  {vision && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <p className="text-xs font-medium">Expanded vision</p>
                      </div>
                      <p className="text-sm">{vision.vision_statement}</p>
                      <div className="grid gap-2 sm:grid-cols-2 text-xs">
                        {[
                          ["Industry focus", vision.industry_focus],
                          ["Financial focus", vision.financial_focus],
                          ["Autonomy level", vision.autonomy_level],
                          ["Risk tolerance", vision.risk_tolerance],
                          ["Time horizon", vision.time_horizon],
                          ["Success looks like", vision.success_definition],
                        ].filter(([, v]) => Boolean(v)).map(([k, v]) => (
                          <div key={k} className="rounded-md border border-border bg-card p-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
                            <p className="mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                      {vision.differentiators?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {vision.differentiators.map((d) => <Badge key={d} variant="outline" className="text-[11px]">{d}</Badge>)}
                        </div>
                      )}
                      {vision.clarifying_questions?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Worth answering — they sharpen the plan</p>
                          {vision.clarifying_questions.map((q) => (
                            <p key={q} className="text-xs text-muted-foreground">· {q}</p>
                          ))}
                        </div>
                      )}
                      {vision.recommended_tool_ids?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {vision.recommended_tool_ids.length} automation(s) suggested from this vision — pre-ticked in step 6.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step.id === "client" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Full name" required value={form.full_name} onChange={(v) => set({ full_name: v })} placeholder="Jordan Reyes" />
                  <TextField label="Email" required type="email" value={form.email} onChange={(v) => set({ email: v })} placeholder="jordan@company.com" />
                  <TextField label="Phone" value={form.phone} onChange={(v) => set({ phone: v })} placeholder="(305) 555-0142" />
                  <TextField label="Postal code" value={form.postal_code} onChange={(v) => set({ postal_code: v })} placeholder="33139" />
                  <TextField className="sm:col-span-2" label="Street address" hint="Used to work out the competitor radius, not for mail." value={form.address} onChange={(v) => set({ address: v })} placeholder="1200 Ocean Dr" />
                  <TextField label="City" value={form.city} onChange={(v) => set({ city: v })} placeholder="Miami" />
                  <TextField label="State" value={form.state} onChange={(v) => set({ state: v })} placeholder="FL" />
                </div>
              )}

              {step.id === "business" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField className="sm:col-span-2" label="Business name" required value={form.company_name} onChange={(v) => set({ company_name: v })} placeholder="Reyes Plumbing Co." />
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">Industry <span className="text-destructive">*</span></p>
                    <Select value={form.industry} onValueChange={(v) => set({ industry: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose the closest match" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={form.industry} onChange={(e) => set({ industry: e.target.value })} placeholder="Or type it exactly" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">Where this business sits today</p>
                    <Select value={form.business_stage} onValueChange={(v) => set({ business_stage: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label} — {s.hint}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField className="sm:col-span-2" label="Existing website URL" hint="Leave empty if there is none. The frontend audit is skipped without it." value={form.website_url} onChange={(v) => set({ website_url: v })} placeholder="https://example.com" />
                  <AreaField className="sm:col-span-2" label="Services and products you sell" rows={3} value={form.primary_services} onChange={(v) => set({ primary_services: v })} placeholder="Drain cleaning, water heater replacement, emergency callouts" />
                  <TextField className="sm:col-span-2" label="Area you serve" value={form.service_area} onChange={(v) => set({ service_area: v })} placeholder="Miami-Dade and Broward, 40 mile radius" />
                </div>
              )}

              {step.id === "pain" && (
                <div className="space-y-4">
                  <AreaField
                    label="What you do not like about the business today"
                    hint="The honest version. Slow lead response, no-shows, chasing money, being invisible online — whatever it is."
                    rows={5}
                    value={form.pain_points}
                    onChange={(v) => set({ pain_points: v })}
                  />
                  <AreaField
                    label="What you would like to get more out of it"
                    hint="More jobs, higher job value, fewer hours, a real pipeline, a brand people recognise."
                    rows={5}
                    value={form.desired_outcomes}
                    onChange={(v) => set({ desired_outcomes: v })}
                  />
                </div>
              )}

              {step.id === "vision" && (
                <div className="space-y-4">
                  <AreaField
                    label="Your idea of a website operating AI system"
                    hint="If the whole business ran itself online, what would it be doing without you?"
                    rows={6}
                    value={form.ideal_system_vision}
                    onChange={(v) => set({ ideal_system_vision: v })}
                    placeholder={vision?.vision_statement || "Answering every enquiry instantly, booking jobs into the calendar, quoting from my price list, and chasing reviews without me touching it."}
                  />
                  {vision?.vision_statement && (
                    <Button variant="outline" size="sm" onClick={() => set({ ideal_system_vision: vision.vision_statement })}>
                      <Sparkles className="w-4 h-4 mr-1.5" /> Use the expanded vision instead
                    </Button>
                  )}
                </div>
              )}

              {step.id === "tools" && (
                <ToolPicker
                  selected={selectedTools}
                  onToggle={(id) => setSelectedTools((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
                  customTools={customTools}
                  onCustomChange={setCustomTools}
                  recommended={vision?.recommended_tool_ids || []}
                />
              )}

              {step.id === "goal" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">What the goal is measured in</p>
                    <Select value={form.goal_kind} onValueChange={(v) => set({ goal_kind: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOAL_KINDS.map((g) => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">By when</p>
                    <Select value={form.goal_horizon} onValueChange={(v) => set({ goal_horizon: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOAL_HORIZONS.map((h) => <SelectItem key={h.id} value={h.id}>{h.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField label="Target number" type="number" value={form.goal_value} onChange={(v) => set({ goal_value: v })} placeholder="40" />
                  <TextField label="Monthly budget you will commit ($)" type="number" hint="Drives the budget split in every strategy option." value={form.monthly_budget} onChange={(v) => set({ monthly_budget: v })} placeholder="2500" />
                </div>
              )}

              {step.id === "review" && (
                <ReviewSummary form={form} vision={vision} selectedTools={selectedTools} customTools={customTools} />
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              {index < STEPS.length - 1 ? (
                <Button size="sm" disabled={!canAdvance()} onClick={() => setIndex((i) => i + 1)}>
                  Next <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button size="sm" disabled={running || !form.company_name || !form.industry} onClick={submit}>
                  <Search className="w-4 h-4 mr-1.5" /> Save and run discovery
                </Button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
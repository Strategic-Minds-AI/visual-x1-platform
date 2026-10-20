import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Sparkles, Loader2, ArrowRight, Check, AlertCircle, FileText, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import PhaseStepper from "@/components/promptlab/PhaseStepper";
import PatternGrid from "@/components/promptlab/PatternGrid";

export default function PromptLab() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [idea, setIdea] = useState("");
  const [project, setProject] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [refineResult, setRefineResult] = useState(null);
  const [simulateResult, setSimulateResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const goToPhase = (phase) => {
    if (phase <= maxReached) {
      setCurrentPhase(phase);
      setError("");
    }
  };

  const advance = () => {
    const next = currentPhase + 1;
    setCurrentPhase(next);
    if (next > maxReached) setMaxReached(next);
    setError("");
  };

  const handleIdeaNext = async () => {
    if (!idea.trim() || idea.trim().length < 3) {
      setError("Please enter at least a few words describing your idea.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let proj = project;
      if (!proj) {
        proj = await base44.entities.Project.create({
          name: idea.slice(0, 60),
          idea: idea.trim(),
          status: "idea",
          current_phase: 1
        });
        setProject(proj);
      }
      advance();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  const handlePatternSelect = (pattern) => {
    setSelectedPattern(pattern);
  };

  const handlePatternNext = async () => {
    if (!selectedPattern) {
      setError("Please select a system pattern.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const updated = await base44.entities.Project.update(project.id, {
        status: "pattern_selected",
        current_phase: 2,
        pattern_id: selectedPattern.slug,
        pattern_name: selectedPattern.name
      });
      setProject(updated);
      advance();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to save pattern selection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("compilePromptLab", {
        idea: project.idea,
        pattern_name: selectedPattern.name,
        pattern_prompt: selectedPattern.prompt,
        pattern_metadata: {
          use_cases: selectedPattern.use_cases,
          components: selectedPattern.components,
          data_requirements: selectedPattern.data_requirements,
          integrations: selectedPattern.integrations,
          security_risks: selectedPattern.security_risks,
          visual_conventions: selectedPattern.visual_conventions,
          tests: selectedPattern.tests,
          compatible_patterns: selectedPattern.compatible_patterns
        }
      });
      setRefineResult(res.data);

      await base44.entities.PromptVersion.create({
        project_id: project.id,
        version: 1,
        prompt_text: res.data.refined_prompt,
        prompt_type: "refined",
        status: "active"
      });

      await base44.entities.ProductSpec.create({
        project_id: project.id,
        version: 1,
        specification: res.data.product_spec.summary || "",
        data_contracts: JSON.stringify(res.data.product_spec.data_contracts || []),
        acceptance_criteria: JSON.stringify(res.data.product_spec.acceptance_criteria || []),
        components: JSON.stringify(res.data.product_spec.components || []),
        integrations: JSON.stringify(res.data.product_spec.integrations || []),
        risks: JSON.stringify(res.data.product_spec.risks || []),
        status: "active"
      });

      const updated = await base44.entities.Project.update(project.id, {
        status: "refined",
        current_phase: 3
      });
      setProject(updated);
      advance();
    } catch (e) {
      setError(e?.response?.data?.error || "Compilation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!refineResult) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("promptSimulator", {
        prompt: refineResult.refined_prompt
      });
      setSimulateResult(res.data);

      await base44.entities.SimulationResult.create({
        project_id: project.id,
        spec_version: 1,
        scenario_results: JSON.stringify(res.data.qa_review || {}),
        risk_register: JSON.stringify(res.data.negative_flags || []),
        unresolved_questions: JSON.stringify(res.data.recommendations || []),
        qa_score: res.data.qa_review?.score || 0,
        status: "complete"
      });

      const updated = await base44.entities.Project.update(project.id, {
        status: "simulated",
        current_phase: 4
      });
      setProject(updated);
      advance();
    } catch (e) {
      setError(e?.response?.data?.error || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-lg font-semibold">Prompt Lab</h1>
          </div>
          <Badge variant="outline" className="text-xs ml-2">Visual Product Compiler</Badge>
          {project && (
            <Badge variant="secondary" className="text-xs ml-auto">
              {project.status.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <PhaseStepper
          currentPhase={currentPhase}
          maxReachedPhase={maxReached}
          onPhaseClick={goToPhase}
        />

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* Phase 1: Idea */}
          {currentPhase === 1 && (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-heading font-semibold mb-2">Start with one sentence</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Describe the outcome you want. The system will normalize your idea, extract assumptions, and prepare it for pattern selection.
              </p>
              <Textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="e.g. Build a contractor lead-generation platform with an AI receptionist and CRM"
                rows={4}
                className="text-base"
                autoFocus
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">{idea.length} / 2000</span>
                <Button onClick={handleIdeaNext} disabled={loading || !idea.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-1.5" />}
                  Continue to Pattern Selection
                </Button>
              </div>
            </div>
          )}

          {/* Phase 2: Pattern Selection */}
          {currentPhase === 2 && (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-heading font-semibold">Select a system pattern</h2>
                  <p className="text-sm text-muted-foreground">Choose one of 50 archetypes. Compatible add-ons will be suggested later.</p>
                </div>
                <Button onClick={handlePatternNext} disabled={loading || !selectedPattern}>
                  {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-1.5" />}
                  Continue to Refinement
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PatternGrid selectedSlug={selectedPattern?.slug} onSelect={handlePatternSelect} />
              </div>
            </div>
          )}

          {/* Phase 3: Refinement */}
          {currentPhase === 3 && (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-heading font-semibold">Refined prompt + product spec</h2>
                  <p className="text-sm text-muted-foreground">Compiled from your idea and the "{selectedPattern?.name}" pattern.</p>
                </div>
                {!refineResult && (
                  <Button onClick={handleRefine} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                    Compile
                  </Button>
                )}
              </div>

              {loading && !refineResult && (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Compiling refined prompt and product specification...
                </div>
              )}

              {refineResult && (
                <>
                  {refineResult.assumptions?.length > 0 && (
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="text-sm font-semibold mb-2">Assumptions</div>
                      <ul className="space-y-1">
                        {refineResult.assumptions.map((a, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" /> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <div className="text-sm font-semibold">Refined Prompt</div>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap font-body leading-relaxed text-muted-foreground max-h-64 overflow-y-auto">
                      {refineResult.refined_prompt}
                    </pre>
                  </div>

                  {refineResult.product_spec && (
                    <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                      <div className="text-sm font-semibold">Product Specification</div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Summary</div>
                        <p className="text-sm">{refineResult.product_spec.summary}</p>
                      </div>
                      <SpecSection title="Data Contracts" items={refineResult.product_spec.data_contracts} />
                      <SpecSection title="Acceptance Criteria" items={refineResult.product_spec.acceptance_criteria} />
                      <SpecSection title="Components" items={refineResult.product_spec.components} />
                      <SpecSection title="Integrations" items={refineResult.product_spec.integrations} />
                      <SpecSection title="Risks" items={refineResult.product_spec.risks} variant="risk" />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={advance}>
                      <Shield className="w-4 h-4 mr-1.5" /> Continue to Simulation
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Phase 4: Simulation */}
          {currentPhase === 4 && (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-heading font-semibold">Simulation results</h2>
                  <p className="text-sm text-muted-foreground">Quality assessment, risk flags, and recommendations from the refined prompt.</p>
                </div>
                {!simulateResult && (
                  <Button onClick={handleSimulate} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Shield className="w-4 h-4 mr-1.5" />}
                    Run Simulation
                  </Button>
                )}
              </div>

              {loading && !simulateResult && (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Simulating product behavior, risks, and quality...
                </div>
              )}

              {simulateResult && (
                <>
                  {simulateResult.qa_review && (
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Quality Assessment</div>
                        <Badge variant={simulateResult.qa_review.score >= 70 ? "default" : "destructive"}>
                          Score: {simulateResult.qa_review.score || 0}/100
                        </Badge>
                      </div>
                      {simulateResult.qa_review.issues && (
                        <div className="space-y-1">
                          {simulateResult.qa_review.issues.map((issue, i) => (
                            <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {issue}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {simulateResult.negative_flags?.length > 0 && (
                    <div className="p-4 rounded-lg border border-rose-200 bg-rose-50">
                      <div className="text-sm font-semibold text-rose-700 mb-2">Risk Flags</div>
                      {simulateResult.negative_flags.map((flag, i) => (
                        <div key={i} className="text-sm text-rose-600 flex items-start gap-2 mb-1">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {flag}
                        </div>
                      ))}
                    </div>
                  )}

                  {simulateResult.recommendations?.length > 0 && (
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="text-sm font-semibold mb-2">Recommendations</div>
                      {simulateResult.recommendations.map((rec, i) => (
                        <div key={i} className="text-sm text-muted-foreground flex items-start gap-2 mb-1">
                          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" /> {rec}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 rounded-lg border border-dashed border-border bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Phases 5-11 (Visual Design, App Generation, Testing, Validation, Deployment, Operation, Improvement) are the next implementation tranche.
                    </p>
                    <Link to="/">
                      <Button variant="outline" size="sm">Back to Dashboard</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Phases 5-11: Not yet implemented */}
          {currentPhase > 4 && (
            <div className="p-6 max-w-2xl mx-auto text-center">
              <div className="py-16">
                <div className="text-4xl mb-3 opacity-30">🚧</div>
                <h2 className="text-xl font-heading font-semibold mb-2">Phase {currentPhase} — Coming in the next tranche</h2>
                <p className="text-sm text-muted-foreground">
                  This phase is part of the Digital Domination production factory. It will be implemented in the next build tranche.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecSection({ title, items, variant }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className={`text-sm flex items-start gap-2 ${variant === "risk" ? "text-amber-600" : ""}`}>
            <span className="text-muted-foreground">•</span> {item}
          </div>
        ))}
      </div>
    </div>
  );
}
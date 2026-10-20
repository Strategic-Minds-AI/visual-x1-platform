import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Factory, PanelLeft, PanelRight, History, ShieldCheck } from "lucide-react";
import FactoryLauncher from "@/components/factory/FactoryLauncher";
import LivePreview from "@/components/factory/LivePreview";
import ValidationInspector from "@/components/factory/ValidationInspector";
import BatchHistory from "@/components/factory/BatchHistory";
import { base44 } from "@/api/base44Client";

export default function WebsiteFactory() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [result, setResult] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const handleLaunch = async (payload) => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setHtml("");
    setCurrentStep("fetching_benchmarks");

    // Simulate step progression for UI feedback
    const steps = ["fetching_benchmarks", "converting_prompt", "compiling_spec", "running_qa", "rendering", "validating"];
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) setCurrentStep(steps[stepIdx]);
    }, 3000);

    try {
      const response = await base44.functions.invoke('orchestrateFactory', payload);
      clearInterval(stepInterval);
      setResult(response.data);
      setHtml(response.data.html || "");
      setCurrentStep(response.data.decision === "pass" ? "complete" : "refining");
      setRefreshKey(k => k + 1);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.response?.data?.error || err.message || "Pipeline failed");
      setCurrentStep("");
    } finally {
      setIsRunning(false);
    }
  };

  const handleRepair = async () => {
    if (!result?.validation?.findings || !html) return;
    setIsRunning(true);
    setCurrentStep("refining");
    try {
      const repairRes = await base44.functions.invoke('repairDefects', {
        html,
        findings: result.validation.findings,
        brief: result.prompt?.prompt || "",
        industry: result.prompt?.site_type || "",
        batch_id: result.batch_id,
        repair_round: (result.repair_round || 0) + 1,
      });
      setHtml(repairRes.data.html);
      // Re-validate the repaired HTML
      const valRes = await base44.functions.invoke('independentValidation', {
        html: repairRes.data.html,
        batch_id: result.batch_id,
        brief: result.prompt?.prompt || "",
      });
      setResult(prev => ({
        ...prev,
        validation: valRes.data.validation,
        quality_score: valRes.data.validation.total_score,
        decision: valRes.data.validation.decision,
        repair_round: (prev?.repair_round || 0) + 1,
      }));
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Repair failed");
    } finally {
      setIsRunning(false);
      setCurrentStep("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact Header */}
      <header className="border-b border-border bg-card shrink-0 px-4 py-2 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <div className="flex items-center gap-2">
          <Factory className="w-4 h-4 text-primary" />
          <h1 className="font-semibold text-sm">Visual X Autonomous Factory</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/visual-approval"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-md hover:bg-muted"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Visual Approval
          </Link>
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className={`p-1.5 rounded-md transition ${leftPanelOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            title="Toggle launcher panel"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-md transition ${showHistory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            title="Toggle history"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`p-1.5 rounded-md transition ${rightPanelOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            title="Toggle inspector panel"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Launcher & Controls */}
        {leftPanelOpen && (
          <div className="w-72 border-r border-border bg-card shrink-0 overflow-hidden">
            <FactoryLauncher onLaunch={handleLaunch} isRunning={isRunning} currentStep={currentStep} />
          </div>
        )}

        {/* Center Panel — Live Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <LivePreview html={html} isRendering={isRunning && currentStep === "rendering"} />

          {/* Repair Bar */}
          {result && result.quality_score < 95 && !isRunning && (
            <div className="border-t border-border bg-card px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-600 font-medium">Repair Required</span>
                <span className="text-muted-foreground text-xs">
                  Score {result.quality_score}/100 — {(result.repair_round || 0)} repair round(s) used (max 3)
                </span>
              </div>
              <button
                onClick={handleRepair}
                disabled={(result.repair_round || 0) >= 3}
                className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Repair & Re-validate
              </button>
            </div>
          )}

          {/* Release Approved Banner */}
          {result && result.quality_score >= 95 && !isRunning && (
            <div className="border-t border-green-500/30 bg-green-50/50 px-4 py-2 flex items-center gap-2 shrink-0">
              <span className="text-green-700 font-medium text-sm">Release Gate Passed</span>
              <span className="text-green-600 text-xs">Score {result.quality_score}/100 — independently validated, ready for deployment</span>
            </div>
          )}
        </div>

        {/* Right Panel — Validation Inspector */}
        {rightPanelOpen && (
          <div className="w-80 border-l border-border bg-card shrink-0 overflow-hidden">
            {result ? (
              <ValidationInspector result={result} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-4">
                <PanelRight className="w-8 h-8 opacity-20" />
                <p className="text-xs text-center">Validation results, QA scores, and repair suggestions will appear here after the pipeline runs.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="border-t border-border bg-card max-h-64 overflow-y-auto shrink-0">
          <BatchHistory refreshKey={refreshKey} />
        </div>
      )}
    </div>
  );
}
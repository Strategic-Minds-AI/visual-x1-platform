import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Factory, Zap, Globe, Link2, TrendingUp } from "lucide-react";
import FactoryLauncher from "@/components/factory/FactoryLauncher";
import PipelineResults from "@/components/factory/PipelineResults";
import BatchHistory from "@/components/factory/BatchHistory";
import { base44 } from "@/api/base44Client";

const pipelineSteps = [
  { icon: "search", label: "Fetch Benchmarks", desc: "Top 5 UX references" },
  { icon: "file", label: "Convert Prompt", desc: "Sentence → production prompt" },
  { icon: "settings", label: "Compile Spec", desc: "Full product specification" },
  { icon: "shield", label: "QA Audit", desc: "8-dimension scoring" },
  { icon: "lightbulb", label: "Refinement", desc: "Auto-improve to 95+" },
];

export default function WebsiteFactory() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ totalBatches: 0, passedBatches: 0, avgScore: 0 });

  useEffect(() => {
    (async () => {
      try {
        const total = await base44.entities.FactoryBatch.count({});
        const passed = await base44.entities.FactoryBatch.count({ status: 'ready' });
        const { rows } = await base44.entities.FactoryBatch.aggregate({ groupBy: 'status', sort: '-count' });
        setStats({ totalBatches: total, passedBatches: passed, avgScore: 0 });
      } catch {
        // ignore
      }
    })();
  }, [refreshKey]);

  const handleLaunch = async (payload) => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const response = await base44.functions.invoke('orchestrateFactory', payload);
      setResult(response.data);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Pipeline failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Factory className="w-4 h-4" /> Visual X Autonomous Factory
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Website & System Factory</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          One sentence in. A benchmark-validated, QA-gated, SEO-optimized website out.
          Then mass-generate hundreds of variants and thousands of backlinks across every service industry.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-5 text-center">
          <Factory className="w-6 h-6 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{stats.totalBatches}</div>
          <div className="text-xs text-muted-foreground">Total Runs</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <Zap className="w-6 h-6 mx-auto mb-1 text-green-600" />
          <div className="text-2xl font-bold">{stats.passedBatches}</div>
          <div className="text-xs text-muted-foreground">QA Passed</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <Globe className="w-6 h-6 mx-auto mb-1 text-blue-600" />
          <div className="text-2xl font-bold">75+</div>
          <div className="text-xs text-muted-foreground">Benchmarks</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <Link2 className="w-6 h-6 mx-auto mb-1 text-purple-600" />
          <div className="text-2xl font-bold">25+</div>
          <div className="text-xs text-muted-foreground">Industries</div>
        </CardContent></Card>
      </div>

      {/* Launcher */}
      <FactoryLauncher onLaunch={handleLaunch} isRunning={isRunning} />

      {/* Pipeline Visualization (shown while running) */}
      {isRunning && (
        <Card className="border-2 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Autonomous Pipeline Running</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {pipelineSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border animate-pulse">
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  {i < pipelineSteps.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-2 border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && <PipelineResults result={result} />}

      {/* History */}
      <BatchHistory refreshKey={refreshKey} />
    </div>
  );
}
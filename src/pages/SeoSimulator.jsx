import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Rocket, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StrategyGrid from "@/components/simulator/StrategyGrid";
import SiteProfileForm from "@/components/simulator/SiteProfileForm";
import SimulationRanges from "@/components/simulator/SimulationRanges";
import ScenarioDeltas from "@/components/simulator/ScenarioDeltas";
import VersionCompare from "@/components/simulator/VersionCompare";
import ContentJudgePanel from "@/components/simulator/ContentJudgePanel";

const DEFAULT_PROFILE = {
  industry: "emergency plumbing",
  target_keyword: "emergency plumber near me",
  city: "Miami, FL",
  domain_age_months: 4,
  site_pages: 14,
  images_per_page: 4,
  content_quality: 68,
  page_speed: 72,
  hook: "60-minute response, fixed-price quote, licensed locally since 2016",
  hook_strength: 62,
  promo: "small",
  funnel_type: "quote_request",
  funnel_strength: 60,
  monthly_ad_spend: 0,
  articles_count: 0,
  videos_count: 0,
  networking_events: 0,
  reviews_count: 24,
  backlink_count: 6,
  social_posts_per_week: 0,
};

const strategyPayload = (s) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  tier: s.tier,
  impact: s.impact,
  velocity: s.velocity,
  engagement_lift: s.engagement_lift,
  authority_lift: s.authority_lift,
  cost_tier: s.cost_tier,
});

export default function SeoSimulator() {
  const [strategies, setStrategies] = useState([]);
  const [enabledIds, setEnabledIds] = useState([]);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [versions, setVersions] = useState([]);
  const [contentJudged, setContentJudged] = useState(false);
  const [loading, setLoading] = useState(true);

  const enabledStrategies = useMemo(
    () => strategies.filter((s) => enabledIds.includes(s.id)),
    [strategies, enabledIds]
  );

  const loadVersions = async () => {
    const { items } = await base44.entities.StrategySimulation.filter({}, { sort: "-created_date", limit: 12 });
    setVersions(items || []);
  };

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.StrategyPlaybook.filter(
          { is_active: true },
          { sort: "display_order", limit: 200 }
        );
        const list = items || [];
        setStrategies(list);
        setEnabledIds(list.filter((s) => s.default_on !== false).map((s) => s.id));
        await loadVersions();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-run the simulation whenever the strategy set or the site profile changes.
  useEffect(() => {
    if (loading || !strategies.length) return;
    const timer = setTimeout(async () => {
      setRunning(true);
      setError(null);
      try {
        const res = await base44.functions.invoke("simulateSeoGrowth", {
          profile: { ...profile, content_judged: contentJudged },
          strategies: enabledStrategies.map(strategyPayload),
          catalog: strategies.map(strategyPayload),
          seed: 42,
        });
        if (res.data?.error) setError(res.data.error);
        else setResult(res.data);
      } catch (e) {
        setError(e.response?.data?.error || e.message || "Simulation failed");
      } finally {
        setRunning(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [profile, enabledStrategies, strategies, contentJudged, loading]);

  const toggleStrategy = (id) =>
    setEnabledIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const toggleAll = (on) => setEnabledIds(on ? strategies.map((s) => s.id) : []);

  const addStrategy = async (custom) => {
    const order = 900 + strategies.length;
    const created = await base44.entities.StrategyPlaybook.create({
      ...custom,
      description: custom.description || "Custom strategy added from the simulator.",
      is_active: true,
      default_on: true,
      display_order: order,
      effort: 4,
      cost_tier: "low",
    });
    setStrategies((list) => [...list, created]);
    setEnabledIds((ids) => [...ids, created.id]);
  };

  const saveVersion = async (name) => {
    if (!result) return;
    await base44.entities.StrategySimulation.create({
      name,
      industry: profile.industry,
      target_keyword: profile.target_keyword,
      profile_json: JSON.stringify(profile),
      strategies_json: JSON.stringify(enabledStrategies.map((s) => ({ id: s.id, name: s.name }))),
      results_json: JSON.stringify({
        scores: result.scores,
        days_to_page1: result.days_to_page1,
        ranges: result.ranges,
        totals: result.totals,
      }),
      days_to_page1_p50: result.days_to_page1.p50,
      expected_sessions_12m: result.totals.sessions_12m,
      expected_leads_12m: result.totals.leads_12m,
      overall_score: result.scores.overall,
      confidence: result.confidence,
      notes: `${enabledStrategies.length} strategies enabled`,
    });
    await loadVersions();
  };

  const loadVersion = (version) => {
    try {
      const savedProfile = JSON.parse(version.profile_json || "{}");
      const savedStrategies = JSON.parse(version.strategies_json || "[]");
      setProfile({ ...DEFAULT_PROFILE, ...savedProfile });
      const ids = savedStrategies.map((s) => s.id).filter(Boolean);
      if (ids.length) setEnabledIds(ids);
    } catch {
      setError("That version could not be read back.");
    }
  };

  const deleteVersion = async (version) => {
    await base44.entities.StrategySimulation.delete(version.id);
    await loadVersions();
  };

  const applyHook = (hook, engagementDelta) => {
    setContentJudged(true);
    setProfile((p) => ({
      ...p,
      hook,
      hook_strength: Math.min(100, Math.max(20, Math.round((p.hook_strength || 60) + (Number(engagementDelta) || 6) / 2))),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            <h1 className="font-heading font-semibold text-sm">SEO Growth Simulator</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {running && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {result && (
              <Badge variant="secondary" className="text-[11px]">
                score {Math.round(result.scores.overall)} · {enabledStrategies.length} strategies
              </Badge>
            )}
            <Link to="/analytics" className="text-xs font-medium text-muted-foreground hover:text-foreground transition">
              Analytics
            </Link>
            <Link to="/template-engine" className="text-xs font-medium text-muted-foreground hover:text-foreground transition">
              Templates
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[340px_1fr] items-start">
          <div className="space-y-5">
            <SiteProfileForm profile={profile} onChange={setProfile} />
            <StrategyGrid
              strategies={strategies}
              enabledIds={enabledIds}
              onToggle={toggleStrategy}
              onToggleAll={toggleAll}
              onAdd={addStrategy}
            />
          </div>

          <div className="space-y-5">
            <SimulationRanges result={result} />
            <ScenarioDeltas result={result} />
            <VersionCompare
              versions={versions}
              currentResult={result}
              onSave={saveVersion}
              onLoad={loadVersion}
              onDelete={deleteVersion}
            />
            <ContentJudgePanel
              industry={profile.industry}
              targetKeyword={profile.target_keyword}
              onApplyHook={applyHook}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
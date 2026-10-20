import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlatformNav from "@/components/PlatformNav";
import DiscoverySection from "@/components/discovery/DiscoverySection";
import CompetitorCard from "@/components/discovery/CompetitorCard";
import BenchmarkTable from "@/components/discovery/BenchmarkTable";
import ProposalOptions from "@/components/discovery/ProposalOptions";
import ApprovalGate from "@/components/discovery/ApprovalGate";
import { Loader2, RefreshCw, Wand2, AlertCircle, Users, DollarSign, Target, TrendingUp } from "lucide-react";

const parse = (v, fallback) => {
  try {
    const p = JSON.parse(v || "");
    return p == null ? fallback : p;
  } catch {
    return fallback;
  }
};
const money = (n) => `$${Number(n || 0).toLocaleString()}`;

export default function DiscoveryPackage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reportParam = params.get("report");
  const [reports, setReports] = useState([]);
  const [report, setReport] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [intake, setIntake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState(null);
  const [chosenOptionId, setChosenOptionId] = useState(null);

  const load = async (id) => {
    setLoading(true);
    setError(null);
    try {
      if (!id) {
        const { items } = await base44.entities.DiscoveryReport.filter({}, { sort: "-generated_at", limit: 20 });
        setReports(items || []);
        setReport(null);
        return;
      }
      const r = await base44.entities.DiscoveryReport.get(id);
      setReport(r);
      if (r?.intake_id) {
        let comps = await base44.entities.CompetitorProfile.filter({ report_id: id }, { sort: "-composite_score", limit: 5 });
        // Reports generated before the report_id stamp existed are still linked by intake.
        if (!(comps.items || []).length && r.intake_id) {
          comps = await base44.entities.CompetitorProfile.filter({ intake_id: r.intake_id }, { sort: "-composite_score", limit: 5 });
        }
        const intakeRec = await base44.entities.ClientIntake.get(r.intake_id).catch(() => null);
        setCompetitors(comps.items || []);
        setIntake(intakeRec);
        const proposal = parse(r.proposal_json, null);
        if (proposal?.recommended_option_id) setChosenOptionId(proposal.recommended_option_id);
      }
    } catch (e) {
      setError(e.message || "That report could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(reportParam); }, [reportParam]);

  const generateProposal = async () => {
    setBusy("proposal");
    setError(null);
    try {
      const res = await base44.functions.invoke("generateStrategyProposal", {
        intake_id: report.intake_id, report_id: report.id,
      });
      if (res.data?.error) setError(res.data.error);
      else {
        const fresh = await base44.entities.DiscoveryReport.get(report.id);
        setReport(fresh);
        setChosenOptionId(res.data.recommended_option?.id || null);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "The proposal did not generate.");
    } finally {
      setBusy("");
    }
  };

  const rerunResearch = async () => {
    setBusy("research");
    setError(null);
    try {
      const res = await base44.functions.invoke("clientDiscovery", {
        intake_id: report.intake_id, radius_miles: 75, inner_radius_miles: 25,
      });
      if (res.data?.error) setError(res.data.error);
      else navigate(`/discovery?report=${res.data.report_id}`);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Research failed to run.");
    } finally {
      setBusy("");
    }
  };

  const decide = async (status, notes) => {
    setBusy("gate");
    setError(null);
    try {
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.DiscoveryReport.update(report.id, {
        status,
        approval_notes: notes,
        approved_by: me?.email || "",
        approved_at: new Date().toISOString(),
      });
      await load(report.id);
    } catch (e) {
      setError(e.message || "The decision could not be recorded.");
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-background">
        <PlatformNav />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!reportParam || !report) {
    return (
      <div className="min-h-full bg-background">
        <PlatformNav />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="font-heading text-lg font-semibold">Discovery packages</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Every researched client, with its competitors, benchmark targets and approval state.
              </p>
            </div>
            <Link to="/onboarding"><Button size="sm"><Users className="w-4 h-4 mr-1.5" /> New client intake</Button></Link>
          </div>
          {reports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">No discovery packages yet. Start with a client intake.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <Link
                  key={r.id}
                  to={`/discovery?report=${r.id}`}
                  className="block rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/40 transition"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium">{r.company_name || r.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.industry} · {r.generated_at ? new Date(r.generated_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {parse(r.proposal_json, null) && <Badge variant="outline" className="text-[11px]">proposal ready</Badge>}
                      <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"} className="text-[11px] capitalize">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  const business = parse(report.business_snapshot_json, {});
  const industry = parse(report.industry_intelligence_json, {});
  const pricing = parse(report.pricing_json, []);
  const customer = parse(report.customer_json, {});
  const complaints = parse(report.complaint_themes_json, []);
  const niches = parse(report.niches_json, []);
  const counter = parse(report.counter_strategy_json, {});
  const benchmark = parse(report.dominant_benchmark_json, {});
  const proposal = parse(report.proposal_json, null);
  const prediction = parse(report.prediction_json, null);
  const evidence = parse(report.evidence_notes, {});
  const normalization = parse(report.normalization_json, {});

  return (
    <div className="min-h-full bg-background">
      <PlatformNav />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <header className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Discovery package</p>
              <h1 className="font-heading text-xl font-semibold mt-1">{report.company_name || report.client_name}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {report.industry} · {[intake?.city, intake?.state].filter(Boolean).join(", ") || "location not stated"}
                {report.website_url ? ` · ${report.website_url.replace(/^https?:\/\//, "")}` : " · no site on record"}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Badge variant="outline" className="text-[11px]">confidence {Math.round((report.confidence || 0) * 100)}%</Badge>
                <Badge variant={report.status === "approved" ? "default" : report.status === "rejected" ? "destructive" : "secondary"} className="text-[11px] capitalize">
                  {report.status}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {report.generated_at ? new Date(report.generated_at).toLocaleString() : ""} · engine {report.engine_version}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Button size="sm" variant="outline" disabled={!!busy} onClick={rerunResearch}>
              {busy === "research" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              Re-run research
            </Button>
            <Button size="sm" disabled={!!busy} onClick={generateProposal}>
              {busy === "proposal" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
              {proposal ? "Regenerate strategy options" : "Generate strategy options"}
            </Button>
            {intake && (
              <Link to={`/workflow-map?intake=${intake.id}`}>
                <Button size="sm" variant="outline"><Target className="w-4 h-4 mr-1.5" /> Open project checklist</Button>
              </Link>
            )}
          </div>
        </header>

        {report.summary && (
          <DiscoverySection title="Executive summary" description="What this market looks like and where the openings are.">
            <p className="text-sm">{report.summary}</p>
          </DiscoverySection>
        )}

        {Object.keys(business).length > 0 && (
          <DiscoverySection title="Business snapshot" description="What the open web already says about this business."
            badge={evidence.business_sources?.length ? `${evidence.business_sources.length} sources` : undefined}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Public summary", business.public_summary],
                ["Positioning", business.positioning],
                ["Years in business", business.years_in_business],
                ["Service area", business.service_area],
                ["Reviews", business.review_rating ? `${business.review_rating} across ${business.review_count || 0} reviews` : null],
              ].filter(([, v]) => Boolean(v)).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
                  <p className="text-xs mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              {[["Services found", business.services], ["Trust signals", business.trust_signals], ["Observed gaps", business.observed_gaps]].map(([k, list]) => (
                Array.isArray(list) && list.length > 0 && (
                  <div key={k}>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
                    <ul className="mt-1 space-y-0.5">
                      {list.map((x) => <li key={x} className="text-xs text-muted-foreground">· {x}</li>)}
                    </ul>
                  </div>
                )
              ))}
            </div>
          </DiscoverySection>
        )}

        <DiscoverySection
          title="Competitive field"
          description="Top competitors inside the radius, scored on a fixed rubric by a separate evaluation model."
          badge={`${competitors.length} scored`}
        >
          {competitors.length === 0 ? (
            <p className="text-xs text-muted-foreground">No competitors were confirmed from public sources in this pass.</p>
          ) : (
            <div className="space-y-3">
              {competitors.map((c) => <CompetitorCard key={c.id} competitor={c} />)}
            </div>
          )}
        </DiscoverySection>

        {(complaints.length > 0 || niches.length > 0) && (
          <DiscoverySection title="Gaps, complaints and uncovered areas" description="Where the field is weak, and what nobody is covering.">
            <div className="grid gap-5 sm:grid-cols-2">
              {complaints.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Recurring complaints</p>
                  <ul className="mt-2 space-y-1.5">
                    {complaints.map((c) => (
                      <li key={c.theme} className="text-xs flex items-start gap-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">{c.competitors}x</Badge>
                        <span className="capitalize">{c.theme}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {niches.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Uncovered areas</p>
                  <ul className="mt-2 space-y-1">
                    {niches.map((n) => <li key={n} className="text-xs text-muted-foreground">· {n}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </DiscoverySection>
        )}

        {counter?.moves?.length > 0 && (
          <DiscoverySection title="Counter strategy" description="The moves that exploit what the field is doing badly.">
            <div className="space-y-3">
              {counter.moves.map((m) => (
                <div key={m.move} className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium">{m.move}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.why}</p>
                </div>
              ))}
            </div>
          </DiscoverySection>
        )}

        {benchmark?.targets?.length > 0 && (
          <DiscoverySection
            title="Dominant benchmark"
            description="The bar the new site and offer have to clear to lead this field."
            badge={`+${benchmark.margin_points} pts over best`}
          >
            <BenchmarkTable benchmark={benchmark} compositeTarget={benchmark.composite_target} reviewTarget={benchmark.review_target} />
          </DiscoverySection>
        )}

        {(pricing.length > 0 || Object.keys(customer).length > 0) && (
          <DiscoverySection title="Market intelligence" description="Services, demand, published price ranges and the ideal client.">
            <div className="space-y-5">
              {industry.services_offered?.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Every service and product sold in this trade</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {industry.services_offered.map((s) => <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>)}
                  </div>
                </div>
              )}
              {industry.highest_demand_services?.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Highest demand</p>
                  <ul className="mt-1 space-y-0.5">
                    {industry.highest_demand_services.map((s) => <li key={s} className="text-xs">· {s}</li>)}
                  </ul>
                </div>
              )}
              {pricing.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5"><DollarSign className="w-3 h-3" /> Published price ranges</p>
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Service</th>
                        <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Typical range</th>
                        <th className="py-2 text-[11px] font-medium text-muted-foreground">What moves it</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricing.map((p) => (
                        <tr key={p.service} className="border-b border-border last:border-0">
                          <td className="py-2 pr-3 text-xs">{p.service}</td>
                          <td className="py-2 pr-3 text-xs whitespace-nowrap">
                            {p.low || p.high ? `$${p.low || "?"}–$${p.high || "?"} ${p.unit || ""}` : "not published"}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">{p.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {customer?.description && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ideal client</p>
                  <p className="text-xs">{customer.description}</p>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                    {customer.typical_income_band && <span>Typical income: {customer.typical_income_band}</span>}
                    {customer.buying_power && <span>Buying power: {customer.buying_power}</span>}
                  </div>
                  {customer.buying_habits?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {customer.buying_habits.map((h) => <Badge key={h} variant="secondary" className="text-[11px]">{h}</Badge>)}
                    </div>
                  )}
                  {customer.decision_triggers?.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">Triggers to buy: {customer.decision_triggers.join(" · ")}</p>
                  )}
                </div>
              )}
            </div>
          </DiscoverySection>
        )}

        {proposal?.options?.length > 0 ? (
          <>
            <DiscoverySection
              title="Strategy options"
              description="Short, mid and long horizon at once, each with budget, channels, agents and pricing."
              badge={`${proposal.options.length} options`}
            >
              <ProposalOptions proposal={proposal} chosenOptionId={chosenOptionId} onChoose={(o) => setChosenOptionId(o.id)} />
            </DiscoverySection>

            {proposal.recommendation && (
              <DiscoverySection title="The system's recommendation" description="One option, with the reasoning exposed.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[["Who", proposal.recommendation.who], ["What", proposal.recommendation.what], ["When", proposal.recommendation.when], ["Where", proposal.recommendation.where]].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
                      <p className="text-xs mt-1">{v}</p>
                    </div>
                  ))}
                  <div className="rounded-lg border border-border p-3 sm:col-span-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Why</p>
                    <p className="text-xs mt-1">{proposal.recommendation.why}</p>
                  </div>
                  {proposal.recommendation.why_not_others && (
                    <div className="rounded-lg border border-border p-3 sm:col-span-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Why not the others</p>
                      <p className="text-xs mt-1">{proposal.recommendation.why_not_others}</p>
                    </div>
                  )}
                </div>
              </DiscoverySection>
            )}
          </>
        ) : (
          <DiscoverySection title="Strategy options" description="Generated from the discovery plus the client's own answers.">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Not generated yet. It produces short, mid and long horizon options, launch variants and the predicted ranges.
              </p>
              <Button size="sm" disabled={!!busy} onClick={generateProposal}>
                {busy === "proposal" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
                Generate strategy options
              </Button>
            </div>
          </DiscoverySection>
        )}

        {prediction && !prediction.unavailable && (
          <DiscoverySection
            title="Predicted ranges"
            description="Modeled from declared assumptions and the client's own inputs. Ranges only — nothing is guaranteed."
            badge={prediction.confidence != null ? `confidence ${Math.round(prediction.confidence * 100)}%` : undefined}
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Page 1</p>
                <p className="text-sm font-semibold mt-0.5">{prediction.days_to_page1?.p50} days</p>
                <p className="text-[11px] text-muted-foreground">{prediction.days_to_page1?.p10}–{prediction.days_to_page1?.p90} band</p>
              </div>
              {[["conservative", "Conservative"], ["expected", "Expected"], ["aggressive", "Aggressive"]].map(([k, label]) => (
                <div key={k} className="rounded-lg border border-border p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label} · 12m</p>
                  <p className="text-sm font-semibold mt-0.5">{Number(prediction.ranges?.[k]?.leads_12m || 0).toLocaleString()} leads</p>
                  <p className="text-[11px] text-muted-foreground">{money(prediction.ranges?.[k]?.revenue_12m)} value</p>
                </div>
              ))}
            </div>
            {prediction.data_gaps?.length > 0 && (
              <ul className="mt-4 space-y-0.5">
                {prediction.data_gaps.map((g) => <li key={g} className="text-xs text-muted-foreground">· {g}</li>)}
              </ul>
            )}
            {prediction.assumptions?.length > 0 && (
              <details className="mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer">Assumptions behind these ranges</summary>
                <ul className="mt-2 space-y-0.5">
                  {prediction.assumptions.map((a) => <li key={a} className="text-xs text-muted-foreground">· {a}</li>)}
                </ul>
              </details>
            )}
            {prediction.disclaimer && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2 mt-3">{prediction.disclaimer}</p>
            )}
          </DiscoverySection>
        )}

        <ApprovalGate
          report={report}
          busy={busy === "gate"}
          onApprove={(notes) => decide("approved", notes)}
          onReject={(notes) => decide("rejected", notes)}
        />

        {(normalization.sections?.length > 0 || evidence.call_errors?.length > 0) && (
          <DiscoverySection
            title="Evidence and data gaps"
            description="What this package was built from, and what it could not verify."
            badge={`${normalization.sections?.length || 0} normalized sections`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Normalized sections</p>
                <ul className="mt-1 space-y-0.5">
                  {(normalization.sections || []).map((s) => (
                    <li key={s.id} className="text-xs text-muted-foreground">
                      · {s.title} <span className="opacity-60">({s.kind})</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Open gaps</p>
                <ul className="mt-1 space-y-0.5">
                  {(normalization.gaps || []).length === 0 ? (
                    <li className="text-xs text-muted-foreground">No gaps recorded on this pass.</li>
                  ) : (normalization.gaps || []).map((g) => <li key={g} className="text-xs text-muted-foreground">· {g}</li>)}
                </ul>
                {evidence.radius_miles && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Radius searched: {evidence.radius_miles} miles, inner band {evidence.inner_radius_miles} miles.
                  </p>
                )}
              </div>
            </div>
          </DiscoverySection>
        )}
      </main>
    </div>
  );
}
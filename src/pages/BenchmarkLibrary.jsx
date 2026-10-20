import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Image } from "@/components/ui/image";
import { ChevronLeft, Library, Globe, Award, Search, Sparkles, BarChart3, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const SITE_TYPE_LABELS = {
  ecommerce: "E-commerce", saas_dashboard: "SaaS Dashboard", marketing_site: "Marketing Site",
  real_estate: "Real Estate", restaurant: "Restaurant", healthcare: "Healthcare",
  education: "Education", finance: "Finance", media: "Media", portfolio: "Portfolio",
  landing_page: "Landing Page", marketplace: "Marketplace", social: "Social",
  ai_product: "AI Product", other: "Other"
};

export default function BenchmarkLibrary() {
  const [loading, setLoading] = useState(true);
  const [benchmarks, setBenchmarks] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [images, setImages] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [search, setSearch] = useState("");
  const [scoring, setScoring] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [benchRes, imgRes, scoreRes] = await Promise.all([
        base44.entities.BenchmarkReference.filter({ is_active: true }, { sort: "rank", limit: 100 }),
        base44.entities.BenchmarkImage.filter({}, { sort: "-created_date", limit: 50 }),
        base44.entities.QualityScorecard.filter({}, { sort: "-created_date", limit: 10 })
      ]);
      const benchItems = benchRes.items || [];
      setBenchmarks(benchItems);
      setImages(imgRes.items || []);
      setScorecards(scoreRes.items || []);

      const industryMap = {};
      benchItems.forEach(b => {
        if (!industryMap[b.industry]) industryMap[b.industry] = { name: b.industry, count: 0, subIndustries: new Set() };
        industryMap[b.industry].count++;
        if (b.sub_industry) industryMap[b.industry].subIndustries.add(b.sub_industry);
      });
      setIndustries(Object.values(industryMap).map(ind => ({ ...ind, subIndustries: Array.from(ind.subIndustries) })));
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = benchmarks.filter(b => {
    if (selectedIndustry && b.industry !== selectedIndustry) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.industry.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="min-h-full flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5" />
            <h1 className="font-heading text-lg font-semibold">Benchmark Library</h1>
          </div>
          <Badge variant="outline" className="text-xs ml-2">Visual X Quality System</Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Industry filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={!selectedIndustry ? "default" : "outline"} size="sm" onClick={() => setSelectedIndustry(null)}>
            All Industries
          </Button>
          {industries.map(ind => (
            <Button key={ind.name} variant={selectedIndustry === ind.name ? "default" : "outline"} size="sm" onClick={() => setSelectedIndustry(ind.name)}>
              {ind.name} <Badge variant="secondary" className="ml-1.5 text-[10px]">{ind.count}</Badge>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search benchmarks..." className="pl-9" />
          </div>
        </div>

        {/* Benchmark grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(bench => (
            <Card key={bench.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {bench.desktop_screenshot_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <Image src={bench.desktop_screenshot_url} alt={bench.name} fittingType="fill" className="w-full h-full" />
                </div>
              )}
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{bench.name}</h3>
                    <a href={bench.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                      <Globe className="w-3 h-3" /> {bench.url.replace(/^https?:\/\//, "").split("/")[0]} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  {bench.ux_score && (
                    <Badge variant="secondary" className="text-xs shrink-0"><Award className="w-3 h-3 mr-1" /> {bench.ux_score}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant="outline" className="text-[10px]">{SITE_TYPE_LABELS[bench.site_type] || bench.site_type}</Badge>
                  {bench.sub_industry && <Badge variant="outline" className="text-[10px]">{bench.sub_industry}</Badge>}
                </div>
                {bench.description && <p className="text-xs text-muted-foreground line-clamp-2">{bench.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Library className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No benchmarks found. Add reference sites to build your industry library.</p>
          </div>
        )}

        {/* Generated benchmark images gallery */}
        {images.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Generated Benchmark Images</h2>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {images.map(img => (
                <Card key={img.id} className="overflow-hidden">
                  <div className="aspect-video overflow-hidden bg-muted">
                    <Image src={img.image_url} alt={img.site_name} fittingType="fill" className="w-full h-full" />
                  </div>
                  <CardContent className="pt-3 pb-3">
                    <p className="text-sm font-medium">{img.site_name}</p>
                    <p className="text-xs text-muted-foreground">{img.industry} — {img.image_type}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent scorecards */}
        {scorecards.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Recent Quality Scorecards</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {scorecards.map(sc => (
                <Card key={sc.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={sc.decision === "pass" ? "default" : sc.decision === "repair" ? "secondary" : "destructive"} className="text-xs">{sc.decision}</Badge>
                      <span className="text-2xl font-bold">{sc.total_score}<span className="text-sm text-muted-foreground">/100</span></span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <ScoreBar label="Visual Parity" value={sc.visual_parity} max={25} />
                      <ScoreBar label="Functionality" value={sc.functionality} max={20} />
                      <ScoreBar label="Accessibility" value={sc.accessibility} max={15} />
                      <ScoreBar label="Responsive" value={sc.responsive_ux} max={10} />
                      <ScoreBar label="Performance" value={sc.performance} max={10} />
                      <ScoreBar label="Security" value={sc.security} max={10} />
                      <ScoreBar label="Content/SEO" value={sc.content_trust_seo} max={5} />
                      <ScoreBar label="Reliability" value={sc.reliability} max={5} />
                    </div>
                    {sc.repair_round > 0 && <p className="text-xs text-muted-foreground mt-2">Repair round: {sc.repair_round}/3</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ScoreBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-muted-foreground w-12 text-right shrink-0">{value}/{max}</span>
    </div>
  );
}
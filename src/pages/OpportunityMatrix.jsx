import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Target, MapPin, Shield, TrendingUp, DollarSign, Search, LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function OpportunityMatrix() {
  const [opportunities, setOpportunities] = useState([]);
  const [rules, setRules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("opportunities");

  useEffect(() => {
    (async () => {
      try {
        const [ops, rulesData, locs] = await Promise.all([
          base44.entities.LeadOpportunity.filter({ is_active: true }, { sort: 'rank', limit: 100 }),
          base44.entities.GoogleComplianceRule.filter({}, { sort: 'display_order', limit: 50 }),
          base44.entities.LaunchLocation.filter({ is_active: true }, { sort: 'rank', limit: 50 }),
        ]);
        setOpportunities(ops.items || []);
        setRules(rulesData.items || []);
        setLocations(locs.items || []);
      } catch (e) {
        // entities may not be seeded yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const verticals = [...new Set(opportunities.map(o => o.vertical))];

  const filtered = opportunities.filter(o => {
    const matchesSearch = !search ||
      o.service_intent?.toLowerCase().includes(search.toLowerCase()) ||
      o.nearme_domain?.toLowerCase().includes(search.toLowerCase()) ||
      o.vertical?.toLowerCase().includes(search.toLowerCase());
    const matchesVertical = verticalFilter === "all" || o.vertical === verticalFilter;
    return matchesSearch && matchesVertical;
  });

  const scoreColor = (score, max = 10) => {
    const pct = score / max;
    if (pct >= 0.8) return "text-green-600";
    if (pct >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-semibold">Opportunity Matrix</h1>
        </div>
        <Badge variant="outline" className="text-xs ml-2">{filtered.length} opportunities</Badge>
        <Link
          to="/template-engine"
          className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-md hover:bg-muted"
        >
          <LayoutTemplate className="w-3.5 h-3.5" /> Template Engine
        </Link>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {[
            { id: "opportunities", label: "URL Opportunities", icon: TrendingUp },
            { id: "compliance", label: "Google Compliance", icon: Shield },
            { id: "locations", label: "Launch Locations", icon: MapPin },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Opportunities Tab */}
        {activeTab === "opportunities" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities, domains, verticals..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={verticalFilter} onValueChange={setVerticalFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="All verticals" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verticals</SelectItem>
                  {verticals.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              {filtered.map((opp, i) => (
                <Card key={opp.id} className="hover:shadow-md transition">
                  <CardContent className="py-3 flex items-center gap-4">
                    <div className="text-2xl font-bold text-muted-foreground/40 w-8 text-center">#{opp.rank || i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm truncate">{opp.service_intent}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">{opp.vertical}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">{opp.nearme_domain}</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="font-mono">{opp.nearyou_domain}</span>
                      </div>
                      {opp.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{opp.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">CPC</p>
                        <p className="text-sm font-semibold">${opp.benchmark_cpc?.toFixed(2) || '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">CPL</p>
                        <p className="text-sm font-semibold">${opp.benchmark_cpl?.toFixed(2) || '—'}</p>
                      </div>
                      <div className="flex gap-1">
                        {[
                          { label: "U", val: opp.urgency, title: "Urgency" },
                          { label: "V", val: opp.buyer_value, title: "Buyer Value" },
                          { label: "D", val: opp.buyer_density, title: "Buyer Density" },
                        ].map(s => (
                          <div key={s.label} title={s.title} className={`text-center px-1.5 py-0.5 rounded text-xs font-bold ${scoreColor(s.val || 0)}`}>
                            {s.label}{s.val}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No opportunities found. Import the Lead URL Opportunity Workbook to populate.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Google Programmatic SEO Compliance Gates</h2>
              <Badge variant="outline" className="text-xs">{rules.length} rules</Badge>
            </div>
            {rules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <Badge
                      variant={rule.status === "AVOID" ? "destructive" : rule.status === "SAFE" ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {rule.status}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{rule.rule}</h3>
                        <Badge variant="outline" className="text-xs">{rule.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{rule.operational_requirement}</p>
                      {rule.source_url && (
                        <a href={rule.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                          Official documentation →
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {rules.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No compliance rules loaded. Seeding in progress.</p>
              </div>
            )}
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === "locations" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Priority Launch Locations</h2>
              <Badge variant="outline" className="text-xs">{locations.length} metros</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {locations.map((loc, i) => (
                <Card key={loc.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-muted-foreground/40 w-6 text-center">#{loc.rank || i + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{loc.metro}</h3>
                          <Badge variant={loc.priority === "High" ? "default" : "secondary"} className="text-xs">{loc.priority}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{loc.rationale}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {locations.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No locations loaded. Seeding in progress.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
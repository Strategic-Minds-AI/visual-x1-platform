import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlatformNav from "@/components/PlatformNav";
import { SYSTEM_CAPABILITIES, CAPABILITY_DOMAINS } from "@/data/systemCapabilities";
import {
  Search, Brain, Target, LineChart, Hammer, Bot, ShieldCheck, Presentation,
  CheckCircle2, Clock, ChevronRight,
} from "lucide-react";

const ICONS = { Search, Brain, Target, LineChart, Hammer, Bot, ShieldCheck, Presentation };

const AUTOMATION_TONE = {
  automated: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  manual: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

// What the system can actually do today, grouped by the job it does. Nothing here is claimed
// without pointing at the thing that proves it.
export default function SystemCapabilities() {
  const [domain, setDomain] = useState("all");

  const stats = useMemo(() => ({
    total: SYSTEM_CAPABILITIES.length,
    live: SYSTEM_CAPABILITIES.filter((c) => c.maturity === "live").length,
    planned: SYSTEM_CAPABILITIES.filter((c) => c.maturity !== "live").length,
    automated: SYSTEM_CAPABILITIES.filter((c) => c.automation_level === "automated").length,
  }), []);

  const visible = SYSTEM_CAPABILITIES.filter((c) => domain === "all" || c.domain === domain);

  return (
    <div className="min-h-full bg-background">
      <PlatformNav />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        <header className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-lg font-semibold">System capabilities</h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Every capability in the system, what job it does, whether a person still has to run it, and the evidence behind that claim.
                Planned capabilities stay marked planned until there is something real behind them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/system-benchmarks"><Button size="sm" variant="outline">Benchmarks</Button></Link>
              <Link to="/system-audit"><Button size="sm">Run system audit <ChevronRight className="w-4 h-4 ml-1" /></Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[["Capabilities", stats.total], ["Live", stats.live], ["Planned", stats.planned], ["Automated", stats.automated]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
                <p className="text-lg font-semibold mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setDomain("all")}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition ${domain === "all" ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            All domains
          </button>
          {CAPABILITY_DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDomain(d.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${domain === d.id ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {CAPABILITY_DOMAINS.filter((d) => visible.some((c) => c.domain === d.id)).map((d) => {
            const Icon = ICONS[d.icon] || Brain;
            return (
              <section key={d.id} className="rounded-xl border border-border bg-card">
                <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <h2 className="font-heading text-sm font-semibold">{d.label}</h2>
                  <Badge variant="secondary" className="text-[11px] ml-auto">
                    {visible.filter((c) => c.domain === d.id).length}
                  </Badge>
                </div>
                <div className="divide-y divide-border">
                  {visible.filter((c) => c.domain === d.id).map((c) => (
                    <div key={c.id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className="text-xs font-medium">{c.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${AUTOMATION_TONE[c.automation_level] || "bg-muted text-muted-foreground"}`}>
                            {c.automation_level}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize">{c.maturity}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{c.what_it_does}</p>
                      <p className="text-[11px] mt-1.5 flex items-start gap-1.5">
                        {c.maturity === "live"
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                          : <Clock className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />}
                        <span className="text-muted-foreground">{c.evidence}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
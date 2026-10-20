import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { countRecords, pipelineError, readRecords, when } from "@/lib/adminPipelines";

// Live command deck: real counts across the operating system, the newest runs and
// one-tap entry into each technology.
export default function AdminOverview({ onNavigate }) {
  const [counts, setCounts] = useState(null);
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [chains, clones, batches, intakes, assets, deployments] = await Promise.all([
          countRecords("ChainRun"),
          countRecords("CloneProject"),
          countRecords("FactoryBatch"),
          countRecords("ClientIntake"),
          countRecords("BrandAsset"),
          countRecords("Deployment"),
        ]);
        setCounts({ chains, clones, batches, intakes, assets, deployments });
        setRuns(await readRecords("ChainRun", { limit: 5 }));
      } catch (e) {
        setError(pipelineError(e));
        setCounts({ chains: 0, clones: 0, batches: 0, intakes: 0, assets: 0, deployments: 0 });
      }
    })();
  }, []);

  const metrics = counts
    ? [
        ["Chain runs", counts.chains, "prompt"],
        ["Captured sources", counts.clones, "clone"],
        ["Production batches", counts.batches, "factory"],
        ["Client intakes", counts.intakes, "clients"],
        ["Brand assets", counts.assets, "assets"],
        ["Deployments", counts.deployments, "releases"],
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {counts === null ? (
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">Reading live records…</p>
          </Card>
        ) : (
          metrics.map(([label, value, section]) => (
            <Card key={label} className="p-5">
              <button onClick={() => onNavigate(section)} className="w-full text-left">
                <p className="x1-track text-[10px] font-bold text-muted-foreground">{label}</p>
                <p className="mt-2 font-heading text-2xl font-extrabold text-foreground">{value}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary">
                  Open <ArrowUpRight className="h-3 w-3" />
                </span>
              </button>
            </Card>
          ))
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Card className="p-5">
        <p className="x1-track text-xs font-bold text-muted-foreground">Newest chain runs</p>
        {runs.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No runs yet. Open the prompt system and run a chain to see it recorded here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {runs.map((run) => (
              <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{run.request}</span>
                <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Badge variant="outline">{run.decision || run.status}</Badge>
                  {when(run.created_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
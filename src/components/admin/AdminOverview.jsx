import React, { useEffect, useState } from "react";
import { ArrowUpRight, Activity } from "lucide-react";
import { Panel, Metric, StatusPill, ErrorText } from "@/components/admin/adminUi";
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
        ["Chain Runs", counts.chains, "prompt", "Orchestrated runs recorded"],
        ["Captured Sources", counts.clones, "clone", "Ingested sources on file"],
        ["Production Batches", counts.batches, "factory", "Website factory batches"],
        ["Client Intakes", counts.intakes, "clients", "Onboarding submissions"],
        ["Brand Assets", counts.assets, "assets", "Generated brand artwork"],
        ["Deployments", counts.deployments, "releases", "Recorded releases"],
      ]
    : [];

  return (
    <div className="cp-admin-stack">
      {counts === null ? (
        <Panel kicker="COMMAND DECK">
          <p className="cp-fine">Reading live records…</p>
        </Panel>
      ) : (
        <div className="cp-metrics">
          {metrics.map(([label, value, section, foot], index) => (
            <Metric
              key={label}
              label={label}
              value={String(value)}
              foot={foot}
              icon={index === 0 ? Activity : undefined}
              accent={index === 0}
              onClick={() => onNavigate(section)}
            />
          ))}
        </div>
      )}

      <ErrorText>{error}</ErrorText>

      <Panel
        kicker="NEWEST CHAIN RUNS"
        aside={<span className="cp-fine">Live runs · open a record to inspect</span>}
      >
        {runs.length === 0 ? (
          <p className="cp-empty">
            No runs yet. Open the Prompt System and run a chain to see it recorded here.
          </p>
        ) : (
          <div className="cp-asset-list">
            {runs.map((run) => (
              <div key={run.id}>
                <span className="cp-lead-avatar">RUN</span>
                <div>
                  <h3>{run.request}</h3>
                  <p className="cp-fine">{when(run.created_date)}</p>
                </div>
                <StatusPill>{run.decision || run.status}</StatusPill>
              </div>
            ))}
          </div>
        )}
        <button className="cp-text-link mt-4" onClick={() => onNavigate("prompt")}>
          OPEN PROMPT SYSTEM <ArrowUpRight size={13} />
        </button>
      </Panel>
    </div>
  );
}
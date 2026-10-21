import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2, GitBranch, Database, Cpu, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ConvergenceBlocked from "@/components/convergence/ConvergenceBlocked";

const STATE_STYLE = {
  PASS: "bg-primary/15 text-primary",
  BLOCKED: "bg-destructive/15 text-destructive",
  UNKNOWN: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-[hsl(var(--x1-blue))]/15 text-[hsl(var(--x1-blue))]",
};

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right break-all">{value}</span>
  </div>
);

const Section = ({ icon: Icon, title, children }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">{children}</CardContent>
  </Card>
);

// The convergence feature-parity matrix, read live. A route that merely renders is reported as
// present; only a state backed by a provider read is reported as verified.
export default function ConvergenceMatrix() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("convergenceAudit", {});
      const payload = res.data || {};
      if (payload.error) setError(payload.error);
      else setData(payload);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "The audit could not be read.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const github = data?.sources?.github;
  const staging = data?.sources?.staging;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          X1 convergence audit
          <Badge variant="outline" className="text-xs font-normal ml-auto">
            read-only evidence
          </Badge>
          <Button variant="outline" size="sm" onClick={load} disabled={busy}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Re-read
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {busy && !data && <p className="text-xs text-muted-foreground">Reading GitHub and X1 staging...</p>}

        {data && (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              <Section icon={GitBranch} title="Sources">
                {(github?.repos || []).map((r) => (
                  <Row key={r.repo} label={r.repo.split("/")[1]} value={r.sha ? r.sha.slice(0, 7) + (r.permissions?.push ? " · push" : " · read") : "UNKNOWN"} />
                ))}
                {github?.pr32 && (
                  <Row label="PR #32" value={`${github.pr32.state}${github.pr32.draft ? " draft" : ""} · ${(github.pr32.head_sha || "").slice(0, 7)}`} />
                )}
              </Section>

              <Section icon={Database} title="Staging queue">
                {(staging?.queue?.by_status || []).map((s) => (
                  <Row key={s.status} label={s.status} value={s.n} />
                ))}
                <Row label="Pending" value={staging?.queue?.pending ?? "—"} />
                <Row label="Auth-failure window" value={staging?.queue?.auth_failures?.window?.first_at?.slice(0, 10) || "—"} />
              </Section>

              <Section icon={Cpu} title="Worker and leases">
                {(staging?.workers?.distinct || []).map((w) => (
                  <Row key={w.worker_id} label={w.worker_id} value={String(w.health || "").includes("SENSOR_ONLY") ? "sensor only · no leases" : w.runtime_state || "unknown"} />
                ))}
                {(staging?.leases || []).map((l) => (
                  <Row key={l.status} label={`Leases ${l.status}`} value={l.n} />
                ))}
              </Section>
            </div>

            {(staging?.queue?.auth_failures?.split || []).length > 0 && (
              <Section icon={Database} title="Authorization failures, split by fingerprint">
                {(staging.queue.auth_failures.split || []).map((row) => (
                  <Row key={row.fingerprint} label={row.fingerprint} value={row.n} />
                ))}
                {(staging.capabilities?.required_missing || []).length > 0 && (
                  <Row label="Capability absent" value={staging.capabilities.required_missing.join(", ")} />
                )}
                {staging.capabilities?.negative_control?.length > 0 && (
                  <Row label="Blocked by design" value={staging.capabilities.negative_control.join(", ")} />
                )}
              </Section>
            )}

            {data.sources?.authorizer && (
              <Section icon={ShieldCheck} title="Authorization path and worker contract">
                <Row
                  label="Authorize function"
                  value={`${data.sources.authorizer.function_slug} · ${data.sources.authorizer.reachable ? "reachable" : "UNREACHABLE"}`}
                />
                <Row label="URL the worker needs" value={data.sources.authorizer.url} />
                <Row
                  label="Refuses unregistered callers"
                  value={
                    data.sources.authorizer.fail_closed_without_credential && data.sources.authorizer.fail_closed_with_unknown_credential
                      ? "yes, without and with an unknown credential"
                      : "NOT CONFIRMED"
                  }
                />
                <Row label="Worker entry" value={data.sources.authorizer.worker_contract.entry} />
                <Row label="Required worker config" value={data.sources.authorizer.worker_contract.required_env.join(", ")} />
                <Row label="Hosting" value={data.sources.authorizer.worker_contract.hosting_evidence} />
              </Section>
            )}

            <div className="grid md:grid-cols-2 gap-2">
              {(data.acceptance || []).map((row) => (
                <div key={row.id} className="flex items-start gap-2 rounded-lg p-2 bg-card/40">
                  <Badge className={`text-[10px] ${STATE_STYLE[row.state] || STATE_STYLE.UNKNOWN}`}>{row.state}</Badge>
                  <div>
                    <p className="text-xs">
                      <span className="font-mono text-muted-foreground mr-1">{row.id}</span>
                      {row.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.evidence}</p>
                  </div>
                </div>
              ))}
            </div>

            <ConvergenceBlocked blocked={data.blocked} nextActions={data.next_actions} />
            <p className="text-xs text-muted-foreground">{data.method}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
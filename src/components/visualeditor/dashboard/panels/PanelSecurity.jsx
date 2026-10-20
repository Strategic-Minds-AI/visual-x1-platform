import React from "react";
import { base44 } from "@/api/base44Client";
import { Action, Badge, Failure, Loading, MetricGrid, Note, Row, RowList, Section, useAction, useLoad } from "../dashboardUi";

/**
 * The app's own access scan: which collections the signed-in operator can read, and the
 * gaps the scan looks for — agents without instructions, records that answer nobody. The
 * platform's full security scan, including its findings and headers, runs on the app
 * dashboard; this is the app-level pass the editor can run for itself.
 */
export default function PanelSecurity() {
  const scan = useAction();
  const { data, loading, reload } = useLoad(async () => {
    const res = await base44.functions.invoke("securityAudit", {});
    return res.data || {};
  }, []);

  const findings = data?.findings || [];
  const problems = findings.filter((f) => f.status !== "ok");
  const errors = findings.filter((f) => f.status === "error");

  const run = () =>
    scan.run(async () => {
      const res = await base44.functions.invoke("securityAudit", {});
      const answer = res.data || {};
      if (answer.error) throw new Error(answer.error);
      reload();
      return `Scan finished. ${(answer.findings || []).length} collection(s) examined, ${(answer.findings || []).filter((f) => f.status !== "ok").length} needing attention.`;
    });

  return (
    <Section
      title="Security"
      note="What the app can reach and where it is thin. A finding is stated as the pass found it, with the collection it names."
      actions={
        <>
          <Action label="RUN SCAN" onClick={run} busy={scan.running} />
          <button type="button" className="ve-pop-action" onClick={reload}>
            REFRESH
          </button>
        </>
      }
    >
      <MetricGrid
        items={[
          { label: "COLLECTIONS EXAMINED", value: findings.length || "…", note: "read attempts recorded" },
          { label: "NEEDING ATTENTION", value: problems.length || 0, note: "warnings from the scan" },
          { label: "UNREADABLE", value: errors.length || 0, note: "collections that refused this operator" },
        ]}
      />

      {scan.error && <Failure error={scan.error} />}
      {scan.result && <Note>{scan.result}</Note>}
      {loading && <Loading what="the scan's result" />}

      <RowList>
        {findings.map((f, i) => (
          <Row
            key={`${f.entity}-${i}`}
            name={f.entity}
            detail={f.issue || (f.accessible ? `${f.count ?? 0} record(s) readable by this operator` : f.error || "not readable")}
            meta={f.agents ? f.agents.join(", ") : ""}
          >
            <Badge tone={f.status === "ok" ? "" : f.status === "warning" ? "warn" : "warn"}>{String(f.status || "ok").toUpperCase()}</Badge>
          </Row>
        ))}
        {findings.length === 0 && <Row name="Nothing scanned yet" detail="Run the scan to see what the app can reach." />}
      </RowList>

      <Note>
        {data?.summary ||
          "This scan reads the app's own collections and reports what it found. Access rules themselves (who may read, write or delete each collection) are set on the app dashboard, not from inside the app."}
      </Note>
    </Section>
  );
}
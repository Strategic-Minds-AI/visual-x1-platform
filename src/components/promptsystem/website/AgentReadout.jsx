import React from "react";
import { Panel, StatusPill } from "@/components/admin/adminUi";

// What the agents returned. Each block states only what its run actually produced,
// and what it could not verify is kept beside what passed.
const Line = ({ label, value }) => (
  <div className="flex gap-2 text-xs">
    <span className="cp-kicker shrink-0 w-40">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);

const Block = ({ kicker, title, pill, children }) => (
  <Panel kicker={kicker} title={title} aside={pill ? <StatusPill>{pill}</StatusPill> : null}>
    <div className="space-y-1.5">{children}</div>
  </Panel>
);

const items = (list, limit = 6) => (Array.isArray(list) && list.length ? list.slice(0, limit) : []);

export default function AgentReadout({ simulation, validation, test, content }) {
  if (!simulation && !validation && !test && !content) {
    return (
      <Panel kicker="AGENT READOUTS" title="Nothing run yet">
        <p className="cp-fine">
          Simulate the prompt, preview the artifact, then put the artifact through the validation agent, the test agent and the
          content judge. Each may be run as many times as it takes.
        </p>
      </Panel>
    );
  }

  return (
    <div className="cp-admin-stack">
      {simulation && (
        <Block kicker="QA AGENT · SIMULATION" title="Prompt quality" pill={`SCORE ${simulation.qa_review?.score ?? "—"}/100`}>
          <Line label="Structure validator" value={`${simulation.validation?.structure_score ?? "—"}/100 · ${simulation.validation?.valid ? "structurally complete" : `missing: ${(simulation.validation?.missing_elements || []).join(", ") || "unnamed"}`}`} />
          {items(simulation.qa_review?.issues).map((issue, i) => <Line key={i} label="Issue" value={issue} />)}
          {items(simulation.negative_flags, 5).map((flag, i) => (
            <Line key={i} label={`Flag · ${flag.severity || "low"}`} value={`${flag.pattern || ""} → ${flag.replacement || flag.suggestion || ""}`} />
          ))}
          {!simulation.qa_review?.issues?.length && !simulation.negative_flags?.length && (
            <Line label="Result" value="No quality issue or negative pattern was raised on this pass." />
          )}
        </Block>
      )}

      {simulation && (
        <Block
          kicker="SUGGESTION AGENT"
          title="What would make it stronger"
          pill={`${(simulation.recommendations?.improvements || []).length} SUGGESTIONS`}
        >
          {items(simulation.recommendations?.improvements, 8).map((item, i) => <Line key={i} label="Improvement" value={item} />)}
          {items(simulation.enhancement?.improvements_made, 6).map((item, i) => <Line key={i} label="Enhancer applied" value={item} />)}
          {simulation.recommendations?.related_categories?.length ? (
            <Line label="Related categories" value={simulation.recommendations.related_categories.join(", ")} />
          ) : null}
        </Block>
      )}

      {validation?.validation && (
        <Block
          kicker="VALIDATION AGENT · ARTIFACT"
          title="Independent validation of the rendered artifact"
          pill={`${validation.validation.decision || "—"} · ${validation.validation.total_score ?? "—"}/100`}
        >
          {["visual_parity", "functionality", "accessibility", "responsive_ux", "performance", "security", "content_trust_seo", "reliability"].map(
            (key) => <Line key={key} label={key.replace(/_/g, " ")} value={validation.validation[key] ?? "—"} />
          )}
          {items(validation.validation.findings, 8).map((finding, i) => <Line key={i} label="Finding" value={finding} />)}
          {validation.validation.evidence_summary && <Line label="Evidence" value={validation.validation.evidence_summary} />}
        </Block>
      )}

      {test && (
        <Block kicker="TEST AGENT · DOCUMENT" title="Measured probes" pill={`${test.verdict || test.agent?.verdict || "—"} · ${test.score ?? "—"}%`}>
          <Line label="Passed / failed / not run" value={`${test.passed ?? 0} passed · ${test.failed ?? 0} failed · ${test.not_run ?? 0} not run`} />
          <Line label="Target" value={test.target || "the rendered artifact"} />
          {items((test.probes || []).filter((p) => p.result === "FAIL"), 8).map((p, i) => <Line key={i} label={`FAIL · ${p.id}`} value={`${p.label} — found ${p.found}`} />)}
          {items(test.agent?.could_not_test, 6).map((item, i) => <Line key={i} label="Could not test" value={item} />)}
        </Block>
      )}

      {content && (
        <Block
          kicker="CONTENT JUDGE · SEO / GEO / AEO"
          title="How the copy reads to search and answer engines"
          pill={`OVERALL ${content.overall ?? "—"}`}
        >
          <Line label="SEO" value={`${content.seo_score ?? "—"}/100`} />
          <Line label="GEO" value={`${content.geo_score ?? "—"}/100`} />
          <Line label="AEO" value={`${content.aeo_score ?? "—"}/100`} />
          {content.summary && <Line label="Summary" value={content.summary} />}
          {items(content.findings, 6).map((f, i) => <Line key={i} label={`${f.severity || "issue"} · ${f.area || "content"}`} value={`${f.issue} → ${f.fix}`} />)}
          {items(content.hook_variants, 4).map((h, i) => (
            <Line key={i} label={`Hook ${i + 1}`} value={`${h.hook} (seo ${h.seo_delta}, geo ${h.geo_delta}, aeo ${h.aeo_delta})`} />
          ))}
          {items(content.quick_wins, 4).map((w, i) => <Line key={i} label="Quick win" value={w} />)}
        </Block>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Action, Failure, Loading, MetricGrid, Note, Row, RowList, Section, useLoad, when } from "../dashboardUi";

// The collections a project is actually made of, in the order they are produced: the
// brief, the capture, the checks, the release. Counting and reading them is the server's
// job; this panel never counts a page it happens to be holding.
const COLLECTIONS = [
  { name: "Project", label: "Projects", detail: "brief, phase and tags" },
  { name: "CloneProject", label: "Captured sources", detail: "what was measured and specified" },
  { name: "TestResult", label: "Test results", detail: "probe passes and failures" },
  { name: "ValidationReceipt", label: "Validation receipts", detail: "the decision a validator signed" },
  { name: "Deployment", label: "Releases", detail: "every published artifact" },
  { name: "ChainRun", label: "Chain runs", detail: "whole engineering runs and their decisions" },
  { name: "PromptVersion", label: "Prompt modules", detail: "the system's own prompt library" },
  { name: "Agent", label: "Agents", detail: "the workforce" },
  { name: "SEOVariant", label: "SEO variants", detail: "generated page variants" },
  { name: "SocialPost", label: "Social posts", detail: "staged campaigns" },
];

const HIDDEN = ["id", "created_date", "updated_date", "created_by_id"];
const headline = (r) => r.name || r.title || r.request || r.url || r.project_name || r.id;
const summary = (r) =>
  Object.entries(r)
    .filter(([k, v]) => !HIDDEN.includes(k) && typeof v === "string" && v.length > 0 && v.length <= 70)
    .slice(0, 3)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
    .join(" · ");

/** The records behind this project: what each collection holds, and what is in it. */
export default function PanelData({ ctx }) {
  const [open, setOpen] = useState("");
  const { data, error, loading, reload } = useLoad(async () => {
    const answers = await Promise.all(
      COLLECTIONS.map(async (c) => ({ ...c, count: await base44.entities[c.name].count({}) }))
    );
    return answers;
  }, []);

  const records = useLoad(async () => {
    if (!open) return [];
    const page = await base44.entities[open].list({ sort: "-created_date", limit: 25 });
    return page.items || [];
  }, [open]);

  return (
    <Section
      title="Data"
      note="Every collection this system keeps, with what is actually in it. Counts come from the server, and a collection opens to its newest records."
      actions={<Action label="REFRESH" onClick={reload} />}
    >
      {loading && <Loading what="the collections" />}
      {error && <Failure error={error} />}

      {data && (
        <>
          <MetricGrid items={data.slice(0, 4).map((c) => ({ label: c.label, value: c.count, note: c.detail }))} />
          <RowList>
            {data.map((c) => (
              <Row key={c.name} name={c.label} detail={c.detail} meta={`${c.count} record${c.count === 1 ? "" : "s"}`}>
                <Action label={open === c.name ? "CLOSE" : "OPEN"} onClick={() => setOpen(open === c.name ? "" : c.name)} />
              </Row>
            ))}
          </RowList>
        </>
      )}

      {open && (
        <Section title={COLLECTIONS.find((c) => c.name === open)?.label || open} note="Newest first, twenty-five at a time.">
          {records.loading && <Loading what="the records" />}
          {records.error && <Failure error={records.error} />}
          {records.data && (
            <RowList>
              {records.data.map((r) => (
                <Row key={r.id} name={headline(r)} detail={summary(r) || "no short text fields on this record"} meta={when(r.created_date)} />
              ))}
              {records.data.length === 0 && <Row name="Nothing here yet" detail="This collection has no records." />}
            </RowList>
          )}
        </Section>
      )}

      <Note>
        A count of zero is a real answer: nothing of that kind has been recorded. The collections belong to the whole app,
        so a project's own records are the ones carrying its name.
      </Note>
    </Section>
  );
}
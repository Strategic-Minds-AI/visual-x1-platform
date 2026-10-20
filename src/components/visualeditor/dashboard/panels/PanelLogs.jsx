import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Failure, Loading, Row, RowList, Section, useLoad, when } from "../dashboardUi";

// What the filter can read, and which field the search runs against on the server. A
// search is a new query, never a filter over a page already in hand.
const SOURCES = [
  { id: "ChainRun", label: "Chain runs", field: "request", headline: (r) => r.request || r.project_name || r.mission_id, detail: (r) => `${r.current_stage || "no stage"} · ${String(r.decision || r.status || "").toUpperCase()}` },
  { id: "Deployment", label: "Releases", field: "url", headline: (r) => r.url || "release without a URL", detail: (r) => `${r.environment || "production"} · ${r.provider || "publisher"} · ${String(r.status || "")}` },
  { id: "CloneProject", label: "Captured sources", field: "name", headline: (r) => r.name, detail: (r) => `${r.source_type || "url"} · ${r.source_url || r.source_label || "no address"} · ${r.status || ""}` },
  { id: "AuditLog", label: "Audit log", field: "action", headline: (r) => `${r.action || "action"} on ${r.entity_type || "record"}`, detail: (r) => `${r.user_email || "system"} · ${r.details || r.entity_id || ""}` },
];

/** What the system actually did, newest first, with the search running on the server. */
export default function PanelLogs() {
  const [source, setSource] = useState(SOURCES[0]);
  const [query, setQuery] = useState("");

  const { data, error, loading, reload } = useLoad(async () => {
    const filter = query.trim() ? { [source.field]: { $regex: query.trim() } } : {};
    const page = await base44.entities[source.id].filter(filter, { sort: "-created_date", limit: 30 });
    return page.items || [];
  }, [source.id, query]);

  return (
    <Section
      title="Logs"
      note="The app's own records, read newest first. The platform's runtime logs live on the app dashboard, under Logs."
      actions={
        <button type="button" className="ve-pop-action" onClick={reload}>
          READ AGAIN
        </button>
      }
    >
      <div className="ve-fields ve-fields-row">
        <label className="ve-field">
          <span>Source</span>
          <select value={source.id} onChange={(e) => setSource(SOURCES.find((s) => s.id === e.target.value) || SOURCES[0])}>
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ve-field">
          <span>Search {source.field.replace(/_/g, " ")}</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="exact text, case sensitive" />
        </label>
      </div>

      {loading && <Loading what={`the ${source.label.toLowerCase()}`} />}
      {error && <Failure error={error} />}

      {data && (
        <RowList>
          {data.map((r) => (
            <Row key={r.id} name={source.headline(r)} detail={source.detail(r)} meta={when(r.created_date)} />
          ))}
          {data.length === 0 && (
            <Row name={query ? `Nothing matching “${query}”` : "Nothing recorded here yet"} detail="A search runs against the server, so an empty answer means no record matched." />
          )}
        </RowList>
      )}
    </Section>
  );
}
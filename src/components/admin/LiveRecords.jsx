import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Panel, Empty, StatusPill, ErrorText } from "@/components/admin/adminUi";
import { pipelineError, when } from "@/lib/adminPipelines";

// One live record surface, driven by configuration, so every admin list reads
// from real entities with the same loading and empty behaviour. Rows use the
// portal's own list markup.
export default function LiveRecords({
  title,
  entity,
  columns,
  imageKey,
  pillKey,
  query = {},
  sort = "-created_date",
  limit = 50,
  emptyText = "No live records yet.",
  refreshKey = 0,
}) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setRows(null);
      try {
        const page = await base44.entities[entity].filter(query, { sort, limit });
        if (active) setRows(page?.items || []);
      } catch (e) {
        if (active) {
          setError(pipelineError(e));
          setRows([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [entity, sort, limit, refreshKey, JSON.stringify(query)]);

  const primary = columns.find((column) => column.primary) || columns[0];
  const rest = columns.filter((column) => column !== primary && column.key !== pillKey);

  return (
    <Panel
      kicker={title}
      aside={rows !== null ? <span className="cp-fine">{rows.length} live</span> : null}
    >
      <ErrorText>{error}</ErrorText>
      {rows === null ? (
        <Empty>Loading…</Empty>
      ) : rows.length === 0 ? (
        <Empty>{emptyText}</Empty>
      ) : (
        <div className="cp-asset-list">
          {rows.map((row) => (
            <div key={row.id}>
              {imageKey && row[imageKey] ? (
                <Image src={row[imageKey]} className="h-11 w-11 shrink-0 rounded-xl object-cover" fittingType="fill" />
              ) : (
                <span className="cp-lead-avatar">
                  {String(row[primary.key] || "—").slice(0, 2).toUpperCase()}
                </span>
              )}
              <div>
                <h3>{primary.format ? primary.format(row[primary.key], row) : row[primary.key] || "—"}</h3>
                {rest.map((column) => (
                  <p key={column.key} className="cp-fine">
                    {column.format ? column.format(row[column.key], row) : row[column.key] || "—"}
                  </p>
                ))}
                {row.created_date && <p className="cp-fine">{when(row.created_date)}</p>}
              </div>
              {pillKey && row[pillKey] ? <StatusPill>{row[pillKey]}</StatusPill> : null}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { pipelineError, when } from "@/lib/adminPipelines";

// One live record surface, driven by configuration, so every admin list reads
// from real entities with the same loading and empty behaviour.
export default function LiveRecords({
  title,
  entity,
  columns,
  imageKey,
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

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="x1-track text-xs font-bold text-muted-foreground">{title}</p>
        {rows !== null && <span className="text-[10px] text-muted-foreground">{rows.length} live</span>}
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      {rows === null ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-3">
              {imageKey && row[imageKey] && (
                <Image src={row[imageKey]} className="h-10 w-10 shrink-0 rounded-lg object-cover" fittingType="fill" />
              )}
              <div className="min-w-0 flex-1">
                {columns.map((column) => (
                  <span
                    key={column.key}
                    className={
                      column.primary
                        ? "block truncate text-xs text-foreground"
                        : "block truncate text-[10px] text-muted-foreground"
                    }
                  >
                    {column.format ? column.format(row[column.key], row) : row[column.key] || "—"}
                  </span>
                ))}
              </div>
              {row.created_date && (
                <span className="shrink-0 text-[10px] text-muted-foreground">{when(row.created_date)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
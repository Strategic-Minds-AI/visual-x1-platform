import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANES = [
  { key: "stage", label: "X1 AI Hub Staging" },
  { key: "production", label: "X1 AI Hub (production)" }
];

export default function X1DataPlane() {
  const [plane, setPlane] = useState("stage");
  const [reading, setReading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const read = useCallback(async () => {
    setReading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("x1DataPlane", { scope: "inventory" });
      const d = res.data || {};
      if (d.error) setError(d.error);
      else setData(d);
    } catch (e) {
      setError(e?.response?.data?.error || "Could not read X1's Supabase projects.");
    } finally {
      setReading(false);
    }
  }, []);

  useEffect(() => {
    read();
  }, [read]);

  const current = data?.planes?.[plane];
  const counts = Object.fromEntries((current?.exact_row_counts || []).map((r) => [r.table_name, r.exact_rows]));
  const covered = new Set((current?.x1_table_policies || []).map((p) => p.tablename));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4" /> X1 Supabase data plane
          {reading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={read} disabled={reading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Read again
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {PLANES.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={plane === p.key ? "default" : "outline"}
              onClick={() => setPlane(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        {current && current.error && <p className="text-xs text-rose-600">{current.error}</p>}

        {current && !current.error && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">{current.name}</span>
              <Badge variant="outline" className="font-mono text-[10px]">{current.ref}</Badge>
              <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                {current.table_count} tables
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                resolved by {current.resolved_by}
              </Badge>
            </div>

            <div className="rounded-lg border border-border p-2.5 space-y-1.5">
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground">X1 WORK PLANE · EXACT ROWS</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {current.x1_tables_present.map((t) => (
                  <div key={t} className="rounded-md border border-border px-2 py-1.5">
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{t}</p>
                    <p className={cn("text-sm font-semibold", counts[t] > 0 ? "text-foreground" : "text-muted-foreground")}>
                      {counts[t] ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
              {current.x1_tables_missing?.length > 0 && (
                <p className="text-[10px] text-amber-600">
                  Not present in this project: {current.x1_tables_missing.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {current.policy_count} RLS policies in public
              </span>
              <span className="text-muted-foreground">
                {covered.size} of {current.x1_tables_present.length} X1 tables have policies
              </span>
              <span className="text-muted-foreground">
                functions: {current.x1_routines_present.join(", ") || "none found"}
              </span>
            </div>

            {current.unreadable?.length > 0 && (
              <p className="text-[10px] text-amber-600">Not readable with these scopes: {current.unreadable.join(", ")}</p>
            )}

            <p className="text-[10px] text-muted-foreground">
              Read {new Date(data.read_at).toISOString().slice(0, 19).replace("T", " ")} UTC. {data.access}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
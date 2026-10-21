import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { errorText } from "@/lib/errorText";

const REASONS = {
  NON_PREVIEW_RUNTIME: "X1 refuses to serve this outside its own Vercel preview runtime",
  UNBOUND: "X1's staging adapter is unbound, so it will not serve or dispatch",
  AUTHENTICATION_REQUIRED: "Needs a signed-in X1 session (its email one-time code)",
  BLOCKED: "X1 reports this as blocked"
};

const detail = (body) => {
  try {
    const p = JSON.parse(body || "{}");
    if (REASONS[p.reason]) return REASONS[p.reason];
    if (p.error) return errorText(p.error, "answered without a status body");
    const bits = Object.entries(p)
      .filter(([k]) => k !== "service")
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
    return bits.join(" · ") || "answered without a status body";
  } catch {
    return (body || "").slice(0, 120) || "answered without a status body";
  }
};

const tone = (entry) => { let verified = false; try { const parsed = JSON.parse(entry.body || "{}"); verified = entry.status === 200 && typeof parsed.status === "string" && (parsed.status === "LIVE_DATA_VERIFIED" || parsed.status.endsWith("_READ_VERIFIED") || parsed.status === "WORKER_STATUS_VERIFIED"); } catch {} return verified ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-amber-500/40 bg-amber-500/15 text-amber-300"; };

export default function X1StatusStrip() {
  const [reading, setReading] = useState(true);
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  const read = useCallback(async () => {
    setReading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("x1Bridge", {});
      const data = res.data || {};
      if (data.error) setError(errorText(data.error, "X1 answered with an error."));
      else setState(data);
    } catch (e) {
      setError(errorText(e?.response?.data?.error || e?.message, "Could not reach X1."));
    } finally {
      setReading(false);
    }
  }, []);

  useEffect(() => {
    read();
  }, [read]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" /> X1 live plane
          {reading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : null}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={read} disabled={reading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Read again
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          X1 reports current service and tenant status. Configuration alone is not proof of live connectivity.
        </p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {state && (
          <>
            <div className="space-y-1.5">
              {state.endpoints.map((e) => (
                <div key={e.name} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-2.5 py-2">
                  <Badge variant="outline" className={cn("text-[10px] border shrink-0", tone(e))}>
                    {e.status || "no answer"}
                  </Badge>
                  <span className="text-xs font-medium">{e.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{e.path}</span>
                  <span className="text-xs text-muted-foreground w-full sm:w-auto sm:ml-2">{errorText(e.error) || detail(e.body)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {state.origin} · read {new Date(state.read_at).toISOString().slice(0, 19).replace("T", " ")} UTC. {state.method}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
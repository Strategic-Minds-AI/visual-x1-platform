import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (p.error) return p.error;
    const bits = Object.entries(p)
      .filter(([k]) => k !== "service")
      .map(([k, v]) => `${k}: ${v}`);
    return bits.join(" · ") || "answered without a status body";
  } catch {
    return (body || "").slice(0, 120) || "answered without a status body";
  }
};

const tone = (status) => (status === 200 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700");

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
      if (data.error) setError(data.error);
      else setState(data);
    } catch (e) {
      setError(e?.response?.data?.error || "Could not reach X1.");
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
          Read now from X1's own endpoints. Whatever X1 answers is what is shown, including a refusal.
        </p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {state && (
          <>
            <div className="space-y-1.5">
              {state.endpoints.map((e) => (
                <div key={e.name} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-2.5 py-2">
                  <Badge variant="outline" className={cn("text-[10px] border shrink-0", tone(e.status))}>
                    {e.status || "no answer"}
                  </Badge>
                  <span className="text-xs font-medium">{e.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{e.path}</span>
                  <span className="text-xs text-muted-foreground w-full sm:w-auto sm:ml-2">{e.error || detail(e.body)}</span>
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
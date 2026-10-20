import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play, RefreshCw } from "lucide-react";

const MODELS = [
  { id: "gemini_3_flash", label: "Fast (default)" },
  { id: "claude-sonnet-5", label: "Thorough (higher credit cost)" },
];

export default function ChainRunner({ onRun, running, setRunning, onStatus, error }) {
  const [request, setRequest] = useState("");
  const [model, setModel] = useState("gemini_3_flash");
  const [cycles, setCycles] = useState("3");

  const start = async () => {
    if (request.trim().length < 8) return;
    setRunning(true);
    const poll = setInterval(async () => {
      try {
        const res = await base44.functions.invoke("runPromptChain", { mode: "status" });
        if (res?.data?.run) onStatus(res.data.run);
      } catch {
        /* a polling miss is not a run failure */
      }
    }, 4000);
    try {
      const res = await base44.functions.invoke("runPromptChain", {
        request: request.trim(),
        model,
        max_repair_cycles: Number(cycles),
      });
      onRun(res?.data || null);
    } catch (e) {
      onRun({ error: e.message || "The run could not be started" });
    } finally {
      clearInterval(poll);
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Build and validate</CardTitle>
        <p className="text-xs text-muted-foreground">
          One request runs the whole chain: brief, routing, benchmarks, direction, specification, implementation, render,
          independent validation, bounded repair, release review.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="chain-request">What should it build?</Label>
          <Textarea
            id="chain-request"
            rows={2}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Build a premium AI consulting website that generates qualified leads"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 w-56">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-40">
            <Label>Repair cycles</Label>
            <Select value={cycles} onValueChange={setCycles}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["0", "1", "2", "3"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={start} disabled={running || request.trim().length < 8} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Running the chain…" : "Build and Validate"}
          </Button>
          <Button variant="outline" onClick={() => onRun({ refresh: true })} disabled={running} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Load newest run
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Thorough mode and each repair cycle add model calls, which consume more integration credits. Nothing is deployed by this
          run: a rendered artifact is reviewed by a human before anything reaches production.
        </p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
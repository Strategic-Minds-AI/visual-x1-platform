import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Layers3, Play, Loader2 } from "lucide-react";

export default function BulkQueuePanel() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [industry, setIndustry] = useState("");
  const [locations, setLocations] = useState("");
  const [count, setCount] = useState(300);
  const [backlinkUrl, setBacklinkUrl] = useState("");
  const [batchName, setBatchName] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.SEOTemplate.filter({ is_active: true }, { limit: 30, sort: "-created_date" });
      setTemplates(items || []);
      setSelected((items || []).map((t) => t.id));
      if (items?.[0]?.industry) setIndustry(items[0].industry);
    })().catch(() => setTemplates([]));
  }, []);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("queueBulkBacklinks", {
        industry,
        count,
        locations,
        backlink_url: backlinkUrl,
        batch_name: batchName,
        template_ids: selected,
      });
      if (res.data?.error) setError(res.data.error);
      else setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Bulk queue failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <Layers3 className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm">Bulk Queue</h2>
        <Badge variant="secondary" className="text-[10px]">maps templates → domains</Badge>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Pick the SEO templates to mass-map. Each keyword becomes a nearme / nearyou domain and a queued backlink site.
      </p>

      {templates.length === 0 ? (
        <div className="rounded-md border border-border p-3 text-[11px] text-muted-foreground">
          No active SEO templates yet. Create one on the Template Engine page first.
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground">SEO templates ({selected.length}/{templates.length})</Label>
          {templates.map((t) => (
            <label key={t.id} className="flex items-start gap-2 rounded-md border border-border p-2 cursor-pointer">
              <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} className="mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {t.industry} · {t.domain_strategy} · {String(t.keywords || "").split(",").filter(Boolean).length} keywords
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label className="text-[11px] text-muted-foreground">Industry</Label>
          <Input className="h-8 mt-1 text-sm" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Locations (comma separated, optional)</Label>
          <Input className="h-8 mt-1 text-sm" placeholder="Miami FL, Tampa FL" value={locations} onChange={(e) => setLocations(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-muted-foreground">Sites to queue</Label>
            <Input
              className="h-8 mt-1 text-sm"
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Batch name (optional)</Label>
            <Input className="h-8 mt-1 text-sm" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Backlink target URL</Label>
          <Input
            className="h-8 mt-1 text-sm"
            placeholder="https://yoursite.com"
            value={backlinkUrl}
            onChange={(e) => setBacklinkUrl(e.target.value)}
          />
        </div>
        <Button className="w-full gap-2" onClick={run} disabled={running || !industry.trim() || !selected.length}>
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Queueing..." : `Queue ${count} sites`}
        </Button>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>

      {result && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs">Queued</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[11px]">{result.message}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{result.created} sites</Badge>
              <Badge variant="secondary" className="text-[10px]">{result.domain_count} domains</Badge>
              <Badge variant="secondary" className="text-[10px]">{result.templates_used?.length || 0} templates</Badge>
            </div>
            <div className="flex gap-3 text-[11px]">
              <Link className="text-primary hover:underline" to="/backlink-health">Backlink Health</Link>
              <Link className="text-primary hover:underline" to="/visual-approval">Visual Approval</Link>
            </div>
            {result.domains?.length > 0 && (
              <p className="text-[10px] text-muted-foreground break-words">
                {result.domains.slice(0, 12).join(", ")}{result.domains.length > 12 ? " …" : ""}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, RefreshCw, TrendingUp, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DeployTargetPicker from "@/components/templates/DeployTargetPicker";
import VariantPerformanceTable from "@/components/templates/VariantPerformanceTable";

const WAVE_SIZES = ["4", "8", "12", "25"];

// The mass-launch orchestrator's control surface: launch a wave from a layout, read what
// Search Console says about the pages already out, then expand from the keywords ranking.
export default function MassLaunchPanel({ templates }) {
  const [templateId, setTemplateId] = useState("");
  const [locations, setLocations] = useState("");
  const [waveSize, setWaveSize] = useState("12");
  const [deploy, setDeploy] = useState(true);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState("");
  const [wave, setWave] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(true);

  const selected = templates.find((t) => t.id === templateId);

  const loadVariants = useCallback(async () => {
    setLoadingVariants(true);
    try {
      const { items } = await base44.entities.SEOVariant.filter({}, { sort: "-created_date", limit: 50 });
      setVariants(items);
    } catch {
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  }, []);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  const run = async (kind, payload) => {
    setBusy(kind);
    setNote("");
    setWave(null);
    try {
      const res = await base44.functions.invoke("massLaunch", payload);
      const data = res.data || {};
      if (data.ok === false) {
        setNote(data.reason || data.error || "The orchestrator could not complete this step.");
      } else if (kind === "monitor") {
        const properties = data.properties_read || 0;
        setNote(
          data.pages_updated
            ? `Updated ${data.pages_updated} page${data.pages_updated === 1 ? "" : "s"} across ${properties} Search Console propert${properties === 1 ? "y" : "ies"}.`
            : data.reason || "No page carried measurable search data in the window."
        );
      } else {
        setNote(
          `${data.pages_created} page record${data.pages_created === 1 ? "" : "s"} created across ${data.structures} structure${data.structures === 1 ? "" : "s"}. ${data.deploy_note || ""}`
        );
        setWave(data);
      }
      await loadVariants();
    } catch (error) {
      setNote(error.response?.data?.error || error.message || "The orchestrator call failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mass launch wave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Layout</Label>
              <Select
                value={templateId}
                onValueChange={(value) => {
                  setTemplateId(value);
                  const picked = templates.find((t) => t.id === value);
                  if (picked) setLocations("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a layout" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Locations (optional)</Label>
              <Input
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="Miami, FL; Tampa, FL — empty uses the seeded metros"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pages per wave</Label>
              <Select value={waveSize} onValueChange={setWaveSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAVE_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} structures
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() =>
                run("launch", {
                  action: "launch",
                  template_id: templateId,
                  keywords: selected?.keywords || "",
                  locations,
                  wave_size: Number(waveSize),
                  deploy,
                })
              }
              disabled={!!busy || !selected}
            >
              {busy === "launch" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              Launch wave
            </Button>
            <Button variant="outline" onClick={() => run("monitor", { action: "monitor" })} disabled={!!busy}>
              {busy === "monitor" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync Search Console
            </Button>
            <Button
              variant="outline"
              onClick={() => run("expand", { action: "expand", template_id: templateId, wave_size: Number(waveSize), deploy })}
              disabled={!!busy || !selected}
            >
              {busy === "expand" ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Expand from winners
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <Switch id="deploy-toggle" checked={deploy} onCheckedChange={setDeploy} />
              <Label htmlFor="deploy-toggle" className="text-xs">
                Dispatch the deployment
              </Label>
            </div>
          </div>

          {note && <Badge variant="outline" className="text-xs font-normal whitespace-normal">{note}</Badge>}

          {wave && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Wave batch <span className="font-mono">{wave.batch_id}</span> · keywords {wave.keywords?.join(", ")}
              </p>
              {(wave.sample_urls || []).map((url) => (
                <p key={url} className="text-xs font-mono text-muted-foreground truncate">
                  {url}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && <DeployTargetPicker template={selected} onSaved={loadVariants} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Launched pages and search performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <VariantPerformanceTable variants={variants} loading={loadingVariants} />
        </CardContent>
      </Card>
    </div>
  );
}
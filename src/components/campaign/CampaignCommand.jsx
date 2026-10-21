import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CampaignReceipt from "@/components/campaign/CampaignReceipt";

const WAVE_SIZES = ["6", "12", "25"];

// One button for the whole campaign: site content, backlink strategy and local search launch
// together for the client, and the receipt says exactly what each leg did.
export default function CampaignCommand() {
  const [clientName, setClientName] = useState("Strategic Minds AI");
  const [site, setSite] = useState("https://strategicmindsai.com");
  const [keywords, setKeywords] = useState("");
  const [locations, setLocations] = useState("");
  const [waveSize, setWaveSize] = useState("12");
  const [deploy, setDeploy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState(null);

  const launch = async () => {
    setBusy(true);
    setNote("");
    setReceipt(null);
    try {
      const res = await base44.functions.invoke("campaignLaunch", {
        client_name: clientName,
        site_url: site,
        keywords,
        locations,
        wave_size: Number(waveSize),
        deploy,
      });
      const data = res.data || {};
      if (data.error) setNote(data.error);
      else if (data.ok === false && data.reason) setNote(data.reason);
      else setReceipt(data);
    } catch (error) {
      setNote(error.response?.data?.error || error.message || "The campaign could not be launched.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" />
          Campaign command
          <Badge variant="outline" className="text-xs font-normal ml-auto">
            site content · backlinks · local search
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Client</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Site the campaign optimises</Label>
            <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://strategicmindsai.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Keywords (optional)</Label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Comma separated — empty uses the layout's keywords"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Locations (optional)</Label>
            <Input
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="Semicolon separated — empty uses the seeded metros"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={launch} disabled={busy} className="x1-pill-primary">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Launch campaign
          </Button>
          <div className="space-y-1.5">
            <Select value={waveSize} onValueChange={setWaveSize}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WAVE_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} pages
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Switch id="campaign-deploy" checked={deploy} onCheckedChange={setDeploy} />
            <Label htmlFor="campaign-deploy" className="text-xs">
              Dispatch a deployment
            </Label>
          </div>
        </div>

        {note && <p className="text-xs text-muted-foreground">{note}</p>}

        <CampaignReceipt receipt={receipt} />
      </CardContent>
    </Card>
  );
}
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Network } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BacklinkGenerator({ onCreated }) {
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState("");
  const [locations, setLocations] = useState("");
  const [backlinkUrl, setBacklinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!industry.trim() || !keywords.trim()) {
      setError("Industry and keywords are required");
      return;
    }
    setSaving(true);
    setError(null);
    setNote("");
    try {
      const res = await base44.functions.invoke("generateBacklinkSites", {
        industry: industry.trim(),
        keywords,
        locations,
        backlink_url: backlinkUrl.trim(),
      });
      const data = res.data || {};
      setNote(data.message || "");
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not create backlink sites");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">Build a backlink set</p>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Emergency Plumbing" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Keywords (comma separated)</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="emergency plumber, drain cleaning" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Locations (optional)</Label>
            <Input value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="Miami, FL, Tampa, FL" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Link back to (optional)</Label>
            <Input value={backlinkUrl} onChange={(e) => setBacklinkUrl(e.target.value)} placeholder="https://yoursite.com" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={generate} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
            Create backlink sites
          </Button>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
          <p className="text-xs text-muted-foreground">Up to 200 sites per run, one per keyword and location.</p>
        </div>
      </CardContent>
    </Card>
  );
}
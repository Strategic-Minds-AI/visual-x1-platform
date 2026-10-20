import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CalendarClock, Loader2, Wand2 } from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "google_business", label: "Google Business" }
];

export default function ScheduleGenerator({ onGenerated }) {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState("30");
  const [platforms, setPlatforms] = useState(["instagram", "facebook", "linkedin"]);
  const [updates, setUpdates] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await base44.entities.ClientIntake.filter({}, { sort: "-created_date", limit: 50 });
      setClients(res.items || []);
    };
    load();
  }, []);

  const togglePlatform = (id) => {
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleGenerate = async () => {
    if (!clientId) {
      setError("Pick the client profile this schedule serves.");
      return;
    }
    if (!platforms.length) {
      setError("Choose at least one platform.");
      return;
    }
    setWorking(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("generateSocialSchedule", {
        client_id: clientId,
        campaign_name: campaignName.trim(),
        start_date: startDate,
        days: Number(days),
        platforms,
        business_updates: updates.trim()
      });
      const data = res.data || {};
      if (data.error) setError(data.error);
      else {
        setResult(data);
        onGenerated?.(clientId);
      }
    } catch (e) {
      setError(e?.response?.data?.error || "The schedule could not be drafted.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="w-4 h-4" /> Schedule builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Client profile</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Choose a client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Campaign name (optional)</Label>
            <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Fall service push" />
          </div>
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Length</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Platforms</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <Button key={p.id} size="sm" variant={platforms.includes(p.id) ? "default" : "outline"} onClick={() => togglePlatform(p.id)}>
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Business updates to work in (optional)</Label>
          <Textarea
            value={updates}
            onChange={(e) => setUpdates(e.target.value)}
            rows={3}
            className="text-sm"
            placeholder="New crew starting Monday, seasonal maintenance offer live, two five-star reviews this week…"
          />
        </div>

        <Button onClick={handleGenerate} disabled={working || !clientId}>
          {working ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
          {working ? "Drafting the schedule…" : "Draft and stage the schedule"}
        </Button>
        {working && <p className="text-xs text-muted-foreground">Drafting every post and staging it on the calendar. This takes a moment.</p>}
        {error && (
          <p className="flex items-start gap-1.5 text-xs text-rose-500">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </p>
        )}
        {result && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium">{result.created} posts staged for {result.campaign_name}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs">from {result.start_date}</Badge>
              <Badge variant="outline" className="text-xs">{result.days} days</Badge>
              <Badge variant="outline" className="text-xs">{result.used_discovery ? "discovery used" : "no discovery report"}</Badge>
              <Badge variant="outline" className="text-xs">{result.used_business_updates ? "your updates used" : "no updates supplied"}</Badge>
            </div>
            {result.seo_sources?.length > 0 && (
              <p className="text-xs text-muted-foreground">Drafted against: {result.seo_sources.join(", ")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
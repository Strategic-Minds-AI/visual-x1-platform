import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2 } from "lucide-react";

const FUNNELS = [
  { value: "click_to_call", label: "Click to call" },
  { value: "quote_request", label: "Quote request" },
  { value: "booking", label: "Online booking" },
  { value: "emergency_contact", label: "Emergency contact" },
  { value: "consultation", label: "Consultation" },
];

function SliderRow({ label, value, onChange, min = 0, max = 100, step = 1, hint }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        <span className="text-[11px] font-medium">{value}</span>
      </div>
      <Slider
        className="mt-1.5"
        min={min}
        max={max}
        step={step}
        value={[Number(value) || 0]}
        onValueChange={([v]) => onChange(v)}
      />
      {hint && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{hint}</p>}
    </div>
  );
}

function NumRow({ label, value, onChange, hint }) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        className="h-8 mt-1 text-sm"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      {hint && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function SiteProfileForm({ profile, onChange }) {
  const set = (key, value) => onChange({ ...profile, [key]: value });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Site + Market Inputs
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Everything you enter here feeds the simulation. Measured values beat guesses.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[520px] overflow-y-auto pr-3">
        <div>
          <Label className="text-[11px] text-muted-foreground">Industry</Label>
          <Input className="h-8 mt-1 text-sm" value={profile.industry} onChange={(e) => set("industry", e.target.value)} />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Target keyword</Label>
          <Input
            className="h-8 mt-1 text-sm"
            value={profile.target_keyword}
            onChange={(e) => set("target_keyword", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-muted-foreground">City / market</Label>
            <Input className="h-8 mt-1 text-sm" value={profile.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <NumRow label="Domain age (months)" value={profile.domain_age_months} onChange={(v) => set("domain_age_months", v)} />
        </div>

        <SliderRow
          label="Keyword difficulty"
          value={profile.keyword_difficulty}
          onChange={(v) => set("keyword_difficulty", v)}
          min={5}
          hint="5 = easy local term, 90 = national money term"
        />
        <SliderRow label="Content quality" value={profile.content_quality} onChange={(v) => set("content_quality", v)} />
        <SliderRow label="Page speed score" value={profile.page_speed} onChange={(v) => set("page_speed", v)} />

        <div>
          <Label className="text-[11px] text-muted-foreground">Homepage hook / headline</Label>
          <Textarea
            className="mt-1 text-sm min-h-[64px]"
            value={profile.hook}
            onChange={(e) => set("hook", e.target.value)}
            placeholder="Same-day service, 60-minute response, fixed-price quote"
          />
        </div>
        <SliderRow label="Hook strength" value={profile.hook_strength} onChange={(v) => set("hook_strength", v)} hint="Scored by the content judge" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-muted-foreground">Promo / discount</Label>
            <Select value={profile.promo} onValueChange={(v) => set("promo", v)}>
              <SelectTrigger className="h-8 mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="small">Small ($25-$50)</SelectItem>
                <SelectItem value="strong">Strong (10%+ / free consult)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Funnel</Label>
            <Select value={profile.funnel_type} onValueChange={(v) => set("funnel_type", v)}>
              <SelectTrigger className="h-8 mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUNNELS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SliderRow label="Funnel strength" value={profile.funnel_strength} onChange={(v) => set("funnel_strength", v)} />

        <div className="grid grid-cols-2 gap-3">
          <NumRow label="Info articles published" value={profile.articles_count} onChange={(v) => set("articles_count", v)} hint="Search-question content" />
          <NumRow label="Videos on site" value={profile.videos_count} onChange={(v) => set("videos_count", v)} />
          <NumRow label="Images per page" value={profile.images_per_page} onChange={(v) => set("images_per_page", v)} />
          <NumRow label="Pages on site" value={profile.site_pages} onChange={(v) => set("site_pages", v)} />
          <NumRow label="Reviews collected" value={profile.reviews_count} onChange={(v) => set("reviews_count", v)} />
          <NumRow label="Placed backlinks" value={profile.backlink_count} onChange={(v) => set("backlink_count", v)} />
          <NumRow label="Social posts / week" value={profile.social_posts_per_week} onChange={(v) => set("social_posts_per_week", v)} />
          <NumRow label="Networking events / month" value={profile.networking_events} onChange={(v) => set("networking_events", v)} />
          <NumRow label="Ad spend / month ($)" value={profile.monthly_ad_spend} onChange={(v) => set("monthly_ad_spend", v)} />
        </div>
      </CardContent>
    </Card>
  );
}
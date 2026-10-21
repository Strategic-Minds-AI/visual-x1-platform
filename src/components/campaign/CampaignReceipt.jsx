import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Link2, MapPin, Info } from "lucide-react";

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right break-all">{value}</span>
  </div>
);

const Leg = ({ icon: Icon, title, tone, children }) => (
  <Card className="h-full">
    <CardContent className="py-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${tone}`} />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {children}
    </CardContent>
  </Card>
);

// What the campaign actually did, leg by leg, including what is still gated.
export default function CampaignReceipt({ receipt }) {
  if (!receipt) return null;
  const content = receipt.site_content || {};
  const links = receipt.backlink_strategy || {};
  const local = receipt.local_search || {};

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={receipt.ok ? "default" : "outline"} className="text-xs">
          {receipt.ok ? "Campaign launched" : "Campaign incomplete"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {receipt.client} · {receipt.site} · {receipt.template?.name}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Leg icon={FileText} title="Site content" tone="text-primary">
          <Row label="Pages generated" value={content.pages_created ?? 0} />
          <Row label="Locations" value={(content.locations || []).join(" · ")} />
          <Row label="Wave batch" value={content.batch_id || "—"} />
          <Row label="Deployment" value={content.deployment ? "dispatched" : "not dispatched"} />
          {content.reason && <p className="text-xs text-muted-foreground pt-1">{content.reason}</p>}
        </Leg>

        <Leg icon={Link2} title="Backlink strategy" tone="text-[hsl(var(--x1-blue))]">
          <Row label="Sites planned" value={links.created ?? 0} />
          <Row label="Pointing at" value={links.backlink_url || "—"} />
          <Row label="Site types" value={(links.site_types || []).length || 0} />
          {links.error && <p className="text-xs text-muted-foreground pt-1">{links.error}</p>}
        </Leg>

        <Leg icon={MapPin} title="Local search" tone="text-[hsl(var(--action))]">
          <Row label="Metros tracked" value={local.locations_created ?? 0} />
          <Row label="Already tracked" value={local.locations_already_tracked ?? 0} />
          <Row label="Search Console" value={local.verified ? "verified" : "not measuring"} />
          <Row label="Sitemaps" value={local.sitemaps ?? "—"} />
        </Leg>
      </div>

      {(receipt.next || []).length > 0 && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <ul className="space-y-1">
            {receipt.next.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {(content.sample_urls || []).length > 0 && (
        <div className="space-y-1">
          {content.sample_urls.map((url) => (
            <p key={url} className="text-xs font-mono text-muted-foreground truncate">
              {url}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{receipt.method}</p>
    </div>
  );
}
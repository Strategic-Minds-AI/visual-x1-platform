import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image } from "@/components/ui/image";
import { AlertTriangle, Loader2, Palette, Shirt, CreditCard, Wand2 } from "lucide-react";

const parse = (v) => {
  try {
    return JSON.parse(v || "{}") || {};
  } catch {
    return {};
  }
};

export default function BrandAssetStudio() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [assetTypes, setAssetTypes] = useState(["business_card", "apparel"]);
  const [perType, setPerType] = useState("2");
  const [generating, setGenerating] = useState(false);
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [missing, setMissing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.entities.ClientIntake.filter({}, { sort: "-created_date", limit: 50 });
        setClients(res.items || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadAssets = useCallback(async (id) => {
    if (!id) {
      setAssets([]);
      return;
    }
    const res = await base44.entities.BrandAsset.filter({ client_id: id }, { sort: "-created_date", limit: 24 });
    setAssets(res.items || []);
  }, []);

  const selectClient = (id) => {
    setClientId(id);
    setError("");
    setNote("");
    loadAssets(id);
  };

  const client = clients.find((c) => c.id === clientId) || null;
  const colors = (client?.brand_colors || "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => /^#?[0-9a-f]{3,8}$/i.test(c));

  const toggleType = (t) => {
    setAssetTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleGenerate = async () => {
    if (!clientId) {
      setError("Pick the client profile first — the brand identity comes from it.");
      return;
    }
    if (!assetTypes.length) {
      setError("Choose at least one asset type.");
      return;
    }
    setGenerating(true);
    setError("");
    setNote("");
    try {
      const res = await base44.functions.invoke("generateBrandAssets", {
        client_id: clientId,
        asset_types: assetTypes,
        per_type: Number(perType)
      });
      const data = res.data || {};
      if (data.error) setError(data.error);
      else {
        setMissing(data.missing || []);
        setNote(data.note || "");
        await loadAssets(clientId);
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Palette className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-heading text-xl font-semibold">Brand Assets</h2>
          <p className="text-sm text-muted-foreground">
            Business card layouts and apparel mockups built from the brand identity saved on the client profile.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Client profile</Label>
              <Select value={clientId} onValueChange={selectClient}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading…" : "Choose a client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Variants per type</Label>
              <Select value={perType} onValueChange={setPerType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {client && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium">Brand identity in use</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">{client.company_name}</Badge>
                {client.industry && <Badge variant="outline" className="text-xs">{client.industry}</Badge>}
                {client.tagline && <Badge variant="outline" className="text-xs">“{client.tagline}”</Badge>}
                {client.brand_fonts && <Badge variant="outline" className="text-xs">{client.brand_fonts}</Badge>}
                {!client.tagline && <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40">no tagline saved</Badge>}
                {!client.brand_colors && <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40">no brand colors saved</Badge>}
                {!client.logo_url && <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40">no logo URL saved</Badge>}
              </div>
              {colors.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {colors.slice(0, 8).map((c, i) => (
                    <span
                      key={i}
                      title={c}
                      className="w-5 h-5 rounded border border-border"
                      style={{ background: c.startsWith("#") ? c : `#${c}` }}
                    />
                  ))}
                </div>
              )}
              {(!client.brand_colors || !client.tagline) && (
                <p className="text-xs text-muted-foreground">
                  Add colors and a tagline on the client profile first: without them the designer has to invent a palette, and it will say so.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={assetTypes.includes("business_card") ? "default" : "outline"} onClick={() => toggleType("business_card")}>
              <CreditCard className="w-3.5 h-3.5 mr-1" /> Business cards
            </Button>
            <Button size="sm" variant={assetTypes.includes("apparel") ? "default" : "outline"} onClick={() => toggleType("apparel")}>
              <Shirt className="w-3.5 h-3.5 mr-1" /> Apparel mockups
            </Button>
            <Button size="sm" onClick={handleGenerate} disabled={generating || !clientId}>
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
              {generating ? "Designing…" : "Generate assets"}
            </Button>
          </div>

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-rose-500">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </p>
          )}
          {missing.length > 0 && (
            <p className="text-xs text-amber-500">Not on the profile, so chosen for you: {missing.join(", ")}.</p>
          )}
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </CardContent>
      </Card>

      {assets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => {
            const spec = parse(a.spec_json);
            return (
              <Card key={a.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="rounded-lg overflow-hidden border border-border bg-muted/20">
                    <Image src={a.image_url} alt={a.variant_name} className="w-full h-44" fittingType="fit" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {a.asset_type === "apparel" ? <Shirt className="w-3 h-3 mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                      {a.asset_type === "apparel" ? "apparel" : "card"}
                    </Badge>
                    <p className="text-sm font-medium truncate">{a.variant_name}</p>
                  </div>
                  {spec.concept && <p className="text-xs text-muted-foreground">{spec.concept}</p>}
                  {spec.colors?.length > 0 && (
                    <div className="flex items-center gap-1">
                      {spec.colors.slice(0, 6).map((c, i) => (
                        <span key={i} title={c} className="w-4 h-4 rounded border border-border" style={{ background: c }} />
                      ))}
                    </div>
                  )}
                  {spec.layout_spec && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Layout spec</summary>
                      <p className="mt-1.5 whitespace-pre-wrap">{spec.layout_spec}</p>
                      {spec.print_notes && <p className="mt-1.5 text-muted-foreground">Print: {spec.print_notes}</p>}
                    </details>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {clientId && !generating && assets.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing generated for this client yet.</p>
      )}
    </section>
  );
}
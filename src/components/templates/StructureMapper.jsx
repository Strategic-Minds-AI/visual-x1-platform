import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wand2, Save, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StructureMapper({ templates }) {
  const [templateId, setTemplateId] = useState("");
  const [keywords, setKeywords] = useState("");
  const [locations, setLocations] = useState("");
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const selected = templates.find((t) => t.id === templateId);

  const generate = async () => {
    const kws = keywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (!selected || kws.length === 0) {
      setError("Pick a template and enter at least one keyword");
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await base44.functions.invoke("buildProgrammaticStructure", {
        template_id: selected.id,
        keywords: kws,
        locations: locations.split(",").map((s) => s.trim()).filter(Boolean),
        domain_strategy: selected.domain_strategy,
      });
      setStructures(res.data.structures || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Mapping failed");
    } finally {
      setLoading(false);
    }
  };

  const saveVariants = async () => {
    setSaving(true);
    setError(null);
    try {
      const records = structures.flatMap((s) => {
        const rows = [
          {
            batch_id: s.template_id,
            target_keyword: s.keyword,
            target_location: s.location,
            content: s.title,
            status: "generated",
            url: s.nearme_url,
            funnel_type: s.funnel_type,
          },
        ];
        if (s.nearyou_url) {
          rows.push({
            batch_id: s.template_id,
            target_keyword: s.keyword,
            target_location: s.location,
            content: s.h1,
            status: "generated",
            url: s.nearyou_url,
            funnel_type: s.funnel_type,
          });
        }
        return rows;
      });
      await base44.entities.SEOVariant.bulkCreate(records);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Could not save variants");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Map Keywords to Programmatic Structures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Template</Label>
            <Select
              value={templateId}
              onValueChange={(value) => {
                setTemplateId(value);
                const picked = templates.find((t) => t.id === value);
                if (picked && !keywords.trim()) setKeywords(picked.keywords || "");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select a layout" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Keywords</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="emergency plumber, drain cleaning" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Locations (optional)</Label>
            <Input value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="Miami, FL, Tampa, FL" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={generate} disabled={loading || !selected}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Generate Structures
          </Button>
          {structures.length > 0 && (
            <Button variant="outline" onClick={saveVariants} disabled={saving || saved}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved as Variants" : "Save as SEO Variants"}
            </Button>
          )}
          {structures.length > 0 && <Badge variant="outline" className="text-xs">{structures.length} structures</Badge>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {structures.length > 0 && (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Keyword</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">NearMe URL</TableHead>
                  <TableHead className="text-xs">NearYou URL</TableHead>
                  <TableHead className="text-xs">Layout Sections</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-medium">{s.keyword}</TableCell>
                    <TableCell className="text-xs">{s.location || "National"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{s.nearme_url || "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{s.nearyou_url || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.layout_sections?.length
                        ? `${s.layout_sections.length} sections · ${s.layout_source === "file" ? "from uploaded layout" : "from template"}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
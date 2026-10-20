import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileJson } from "lucide-react";
import { base44 } from "@/api/base44Client";

const BLANK = {
  name: "",
  industry: "",
  keywords: "",
  layout_json: "",
  url_pattern: "/{region}/{city}/{service}/",
  domain_strategy: "both",
  funnel_type: "quote_request",
  notes: "",
};

export default function TemplateForm({ onCreated }) {
  const [form, setForm] = useState(BLANK);
  const [fileUri, setFileUri] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setFileUri(file_uri);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.industry.trim() || !form.keywords.trim()) {
      setError("Name, industry, and keywords are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await base44.entities.SEOTemplate.create({ ...form, layout_file_uri: fileUri });
      onCreated(created);
      setForm(BLANK);
      setFileUri("");
    } catch (err) {
      setError(err.message || "Could not save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add Industry Layout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Template name</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Emergency Plumber Layout" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Industry</Label>
            <Input value={form.industry} onChange={(e) => update("industry", e.target.value)} placeholder="Emergency Plumbing" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Input keywords (comma separated)</Label>
          <Input
            value={form.keywords}
            onChange={(e) => update("keywords", e.target.value)}
            placeholder="emergency plumber, burst pipe repair, drain cleaning"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Domain strategy</Label>
            <Select value={form.domain_strategy} onValueChange={(v) => update("domain_strategy", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="both">NearMe + NearYou</SelectItem>
                <SelectItem value="nearme">NearMe only</SelectItem>
                <SelectItem value="nearyou">NearYou only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Funnel type</Label>
            <Select value={form.funnel_type} onValueChange={(v) => update("funnel_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="click_to_call">Click to call</SelectItem>
                <SelectItem value="quote_request">Quote request</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="emergency_contact">Emergency contact</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">URL pattern</Label>
            <Input value={form.url_pattern} onChange={(e) => update("url_pattern", e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Layout structure (JSON)</Label>
          <Textarea
            value={form.layout_json}
            onChange={(e) => update("layout_json", e.target.value)}
            placeholder='[{"section":"hero","components":["h1","cta","trust_badge"]},{"section":"services"}]'
            className="font-mono text-xs min-h-[90px]"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer hover:bg-muted transition">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload layout file
            <input type="file" accept=".json,.html,.htm,.txt,.md" className="hidden" onChange={handleFile} />
          </label>
          {fileUri && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileJson className="w-3.5 h-3.5" /> Layout file attached (stored privately)
            </span>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={submit} disabled={saving || uploading}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Save Template
        </Button>
      </CardContent>
    </Card>
  );
}
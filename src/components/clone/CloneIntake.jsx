import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Loader2, Upload, Link2, Code2, Eye } from "lucide-react";

const SOURCES = [
  { id: "url", label: "Live URL", Icon: Link2 },
  { id: "markup", label: "Paste markup", Icon: Code2 },
  { id: "file", label: "Upload file", Icon: Upload }
];

const parse = (v) => {
  try {
    return JSON.parse(v || "{}") || {};
  } catch {
    return {};
  }
};

export default function CloneIntake({ onCaptured }) {
  const [sourceType, setSourceType] = useState("url");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [markup, setMarkup] = useState("");
  const [file, setFile] = useState(null);
  const [industry, setIndustry] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [project, setProject] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  const runCapture = async () => {
    if (!name.trim()) {
      setError("Give the clone a name first.");
      return;
    }
    setCapturing(true);
    setError("");
    try {
      let file_url = "";
      if (sourceType === "file" && file) {
        const up = await base44.integrations.Core.UploadPrivateFile({ file });
        const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: up.file_uri, expires_in: 900 });
        file_url = signed.signed_url;
      }
      const res = await base44.functions.invoke("ingestClone", {
        name: name.trim(),
        source_type: sourceType,
        url: url.trim(),
        content: sourceType === "markup" ? markup : "",
        file_url,
        industry: industry.trim()
      });
      if (res.data?.error) setError(res.data.error);
      else {
        setProject(res.data.project);
        onCaptured?.(res.data.project);
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Capture failed.");
    } finally {
      setCapturing(false);
    }
  };

  const runRender = async () => {
    if (!project?.build_prompt) return;
    setRendering(true);
    setError("");
    try {
      const res = await base44.functions.invoke("renderPreview", {
        prompt: project.build_prompt,
        context: (project.capture_text || "").slice(0, 4000)
      });
      const rendered = res.data.html || "";
      setHtml(rendered);
      const updated = await base44.entities.CloneProject.update(project.id, {
        rendered_html_length: rendered.length,
        status: "rendered"
      });
      const next = { ...project, ...updated, build_prompt: project.build_prompt, __html: rendered };
      setProject(next);
      onCaptured?.(next);
    } catch (e) {
      setError(e?.response?.data?.error || "Render failed.");
    } finally {
      setRendering(false);
    }
  };

  const signature = parse(project?.capture_json);
  const spec = parse(project?.spec_json);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Copy className="w-4 h-4" /> Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <Button key={s.id} size="sm" variant={sourceType === s.id ? "default" : "outline"} onClick={() => setSourceType(s.id)}>
                <s.Icon className="w-3.5 h-3.5 mr-1" /> {s.label}
              </Button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Clone name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Faultline marketing site" />
            </div>
            <div className="space-y-1.5">
              <Label>Industry (optional)</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Home services" />
            </div>
          </div>

          {sourceType === "url" && (
            <div className="space-y-1.5">
              <Label>Source URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
            </div>
          )}
          {sourceType === "markup" && (
            <div className="space-y-1.5">
              <Label>Markup or text</Label>
              <Textarea value={markup} onChange={(e) => setMarkup(e.target.value)} rows={6} className="text-xs" placeholder="<html>…" />
            </div>
          )}
          {sourceType === "file" && (
            <div className="space-y-1.5">
              <Label>HTML or text file</Label>
              <Input type="file" accept=".html,.htm,.txt,.md" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground">Read once for the capture, then stored privately (stored privately).</p>
            </div>
          )}

          <Button size="sm" onClick={runCapture} disabled={capturing}>
            {capturing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Copy className="w-3.5 h-3.5 mr-1" />} Capture and spec
          </Button>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </CardContent>
      </Card>

      {project && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Captured — {project.source_label || project.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs">{signature.status ? `HTTP ${signature.status}` : "no HTTP status"}</Badge>
              <Badge variant="outline" className="text-xs">{Math.round((signature.html_length || 0) / 1024)} KB captured</Badge>
              <Badge variant="outline" className="text-xs">{signature.headings?.h1?.length || 0} h1</Badge>
              <Badge variant="outline" className="text-xs">{signature.forms?.count || 0} forms</Badge>
              <Badge variant="outline" className="text-xs">{signature.images?.count || 0} images</Badge>
              <Badge variant="secondary" className="text-xs">{project.status}</Badge>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">{signature.title || "Untitled"}</p>
              {signature.description && <p className="text-xs text-muted-foreground">{signature.description}</p>}
            </div>
            {spec.regions?.length ? (
              <div>
                <p className="text-xs font-medium mb-1">Extracted regions, in order</p>
                <div className="flex flex-wrap gap-1">
                  {spec.regions.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{r.name || r}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Build prompt ({project.build_prompt?.length || 0} characters)</summary>
              <pre className="mt-2 whitespace-pre-wrap max-h-64 overflow-y-auto bg-muted/50 rounded p-2">{project.build_prompt}</pre>
            </details>
            <Button size="sm" variant="outline" onClick={runRender} disabled={rendering}>
              {rendering ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-1" />} Render the clone
            </Button>
            {html && (
              <div className="border border-border rounded-md overflow-hidden">
                <iframe srcDoc={html} title="Clone preview" className="w-full h-[420px] border-0 bg-white" sandbox="allow-scripts" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
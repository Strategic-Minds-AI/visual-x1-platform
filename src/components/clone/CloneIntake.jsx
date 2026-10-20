import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Loader2, Upload, Link2, Code2, Eye, Server, GitBranch, Settings2, FolderTree, FileText, Image as ImageIcon
} from "lucide-react";

const SOURCES = [
  { id: "url", label: "Live URL", Icon: Link2 },
  { id: "ip", label: "Host / IP", Icon: Server },
  { id: "markup", label: "Paste markup", Icon: Code2 },
  { id: "file", label: "Upload file", Icon: Upload },
  { id: "repo", label: "Repository", Icon: GitBranch },
  { id: "config", label: "Configuration", Icon: Settings2 },
  { id: "folder", label: "Folder listing", Icon: FolderTree },
  { id: "document", label: "Document", Icon: FileText },
  { id: "image", label: "Image", Icon: ImageIcon }
];

const BINARY_SOURCES = ["document", "image"];
const NOTE_SOURCES = ["config", "folder"];

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
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [industry, setIndustry] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [project, setProject] = useState(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  const isSite = (project?.source_kind || "site") === "site";

  const runCapture = async () => {
    if (!name.trim()) {
      setError("Give the capture a name first.");
      return;
    }
    setError("");
    setCapturing(true);
    try {
      let file_url = "";
      let file_uri = "";
      if (file && (sourceType === "file" || BINARY_SOURCES.includes(sourceType))) {
        const up = await base44.integrations.Core.UploadPrivateFile({ file });
        file_uri = up.file_uri;
        const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: up.file_uri, expires_in: 900 });
        file_url = signed.signed_url;
      }
      const res = await base44.functions.invoke("ingestClone", {
        name: name.trim(),
        source_type: sourceType,
        url: url.trim(),
        content: sourceType === "markup" ? markup : NOTE_SOURCES.includes(sourceType) ? notes : "",
        file_url,
        file_uri,
        industry: industry.trim()
      });
      if (res.data?.error) setError(res.data.error);
      else {
        setProject(res.data.project);
        setHtml("");
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

  const measured = [];
  if (signature.host?.server) measured.push(`server: ${signature.host.server}`);
  if (signature.host?.["x-powered-by"]) measured.push(`powered by: ${signature.host["x-powered-by"]}`);
  if (signature.repo) {
    measured.push(`${signature.repo.file_count} files`);
    if (signature.repo.primary_language) measured.push(signature.repo.primary_language);
    if (signature.repo.frameworks?.length) measured.push(signature.repo.frameworks.join(", "));
    if (signature.repo.config_files?.length) measured.push(`${signature.repo.config_files.length} config files`);
  }
  if (signature.config) measured.push(`${signature.config.key_count || signature.config.key_names?.length || 0} keys`, `${signature.config.format}`);
  if (signature.folder) measured.push(`${signature.folder.entry_count} entries`, `${signature.folder.dir_count} folders`);
  if (signature.document) measured.push(`${signature.document.headings?.length || 0} headings`, `${signature.document.line_count || 0} lines`);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Copy className="w-4 h-4" /> Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={sourceType === s.id ? "default" : "outline"}
                onClick={() => {
                  setSourceType(s.id);
                  setError("");
                }}
              >
                <s.Icon className="w-3.5 h-3.5 mr-1" /> {s.label}
              </Button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
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

          {sourceType === "ip" && (
            <div className="space-y-1.5">
              <Label>Host or IP address</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="203.0.113.10 or app.example.com" />
              <p className="text-xs text-muted-foreground">The response headers are captured as the host fingerprint alongside whatever page it serves.</p>
            </div>
          )}

          {sourceType === "repo" && (
            <div className="space-y-1.5">
              <Label>Repository URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repo" />
              <p className="text-xs text-muted-foreground">Public repositories are read through the GitHub API. A private one needs the GitHub connector first.</p>
            </div>
          )}

          {sourceType === "markup" && (
            <div className="space-y-1.5">
              <Label>Markup or text</Label>
              <Textarea value={markup} onChange={(e) => setMarkup(e.target.value)} rows={6} className="text-xs" placeholder="<html>…" />
            </div>
          )}

          {sourceType === "config" && (
            <div className="space-y-1.5">
              <Label>Configuration to duplicate</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="text-xs"
                placeholder={'{ "env": "production", "services": { … } }  — JSON, YAML or an env block'}
              />
              <p className="text-xs text-muted-foreground">The key map, depth and anything that looks like an environment variable are measured, not guessed.</p>
            </div>
          )}

          {sourceType === "folder" && (
            <div className="space-y-1.5">
              <Label>Folder listing</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="text-xs"
                placeholder={"paste the output of  ls -R  or  tree"}
              />
            </div>
          )}

          {(sourceType === "file" || BINARY_SOURCES.includes(sourceType)) && (
            <div className="space-y-1.5">
              <Label>
                {sourceType === "image" ? "Image" : sourceType === "document" ? "Document" : "HTML or text file"}
              </Label>
              <Input
                type="file"
                accept={sourceType === "image" ? "image/png,image/jpeg,image/webp" : sourceType === "document" ? ".pdf,.doc,.docx,.txt,.md" : ".html,.htm,.txt,.md,.json,.yml,.yaml"}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                {sourceType === "image"
                  ? "The image is read as a build specification and kept as the visual reference for verification (stored privately)."
                  : "Read once for the capture, then stored privately (stored privately)."}
              </p>
            </div>
          )}

          <Button size="sm" onClick={runCapture} disabled={capturing}>
            {capturing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Copy className="w-3.5 h-3.5 mr-1" />} Capture and spec
          </Button>
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </CardContent>
      </Card>

      {project && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Captured — {project.source_label || project.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs">{project.source_kind || "site"}</Badge>
              <Badge variant="outline" className="text-xs">{project.source_type}</Badge>
              {signature.status ? <Badge variant="outline" className="text-xs">HTTP {signature.status}</Badge> : null}
              <Badge variant="outline" className="text-xs">{Math.round((signature.html_length || 0) / 1024)} KB read</Badge>
              {isSite && <Badge variant="outline" className="text-xs">{signature.headings?.h1?.length || 0} h1</Badge>}
              {isSite && <Badge variant="outline" className="text-xs">{signature.forms?.count || 0} forms</Badge>}
              {isSite && <Badge variant="outline" className="text-xs">{signature.images?.count || 0} images</Badge>}
              {signature.read_by === "vision" && <Badge variant="outline" className="text-xs">read by vision</Badge>}
              <Badge variant="secondary" className="text-xs">{project.status}</Badge>
            </div>

            {measured.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {measured.map((m, i) => <Badge key={i} variant="outline" className="text-xs text-muted-foreground">{m}</Badge>)}
              </div>
            )}

            <div className="text-sm space-y-1">
              <p className="font-medium">{signature.title || project.name}</p>
              {signature.description && <p className="text-xs text-muted-foreground">{signature.description}</p>}
            </div>

            {spec.regions?.length ? (
              <div>
                <p className="text-xs font-medium mb-1">{isSite ? "Extracted regions, in order" : "Modules and files, in order"}</p>
                <div className="flex flex-wrap gap-1">
                  {spec.regions.map((r, i) => <Badge key={i} variant="outline" className="text-xs">{r.name || r}</Badge>)}
                </div>
              </div>
            ) : null}

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                {isSite ? "Build prompt" : "Reproduction and integration plan"} ({project.build_prompt?.length || 0} characters)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap max-h-72 overflow-y-auto bg-muted/50 rounded p-2">{project.build_prompt}</pre>
            </details>

            {isSite ? (
              <>
                <Button size="sm" variant="outline" onClick={runRender} disabled={rendering}>
                  {rendering ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-1" />} Render the clone
                </Button>
                {html && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <iframe srcDoc={html} title="Clone preview" className="w-full h-[420px] border-0 bg-white" sandbox="allow-scripts" />
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                This source is a {project.source_kind}, so the output is a reproduction and integration plan rather than a rendered page.
                Verification still requires every operational check to pass.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, Upload, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const RESULT_STYLES = {
  PASS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  FAIL: "bg-rose-100 text-rose-700 border-rose-200",
  "NOT RUN": "bg-slate-100 text-slate-600 border-slate-200"
};

const parse = (v, fallback) => {
  try {
    const p = JSON.parse(v || "");
    return p ?? fallback;
  } catch {
    return fallback;
  }
};

export default function CloneVerifyPanel({ project, cloneHtml, onUpdated }) {
  const [referenceFile, setReferenceFile] = useState(null);
  const [cloneFile, setCloneFile] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const checks = parse(project?.operational_checks_json, []);
  const visual = parse(project?.visual_check_json, null);
  const qa = parse(project?.qa_json, null);
  const validation = parse(project?.validation_json, null);
  const defects = parse(project?.defects_json, []);
  const evidence = parse(project?.evidence_notes, []);

  const upload = async (file) => {
    const up = await base44.integrations.Core.UploadPrivateFile({ file });
    const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: up.file_uri, expires_in: 1800 });
    return { file_uri: up.file_uri, signed_url: signed.signed_url };
  };

  const attachEvidence = async () => {
    if (!project) return;
    setBusy(true);
    setError("");
    try {
      const patch = {};
      if (referenceFile) {
        const r = await upload(referenceFile);
        patch.reference_image_uri = r.file_uri;
        patch._reference_url = r.signed_url;
      }
      if (cloneFile) {
        const c = await upload(cloneFile);
        patch.clone_image_uri = c.file_uri;
        patch._clone_url = c.signed_url;
      }
      const { _reference_url, _clone_url, ...persistable } = patch;
      if (Object.keys(persistable).length) await base44.entities.CloneProject.update(project.id, persistable);
      onUpdated?.({ ...project, ...persistable, _reference_url, _clone_url });
      setReferenceFile(null);
      setCloneFile(null);
    } catch (e) {
      setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!project) return;
    if (!cloneHtml) {
      setError("Render the clone first — operational verification runs against the rendered artifact.");
      return;
    }
    setRunning(true);
    setError("");
    try {
      const payload = { project_id: project.id, clone_html: cloneHtml };
      if (project._reference_url) payload.reference_image_url = project._reference_url;
      if (project._clone_url) payload.clone_image_url = project._clone_url;
      if (!payload.reference_image_url && project.reference_image_uri) {
        const s = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: project.reference_image_uri, expires_in: 1800 });
        payload.reference_image_url = s.signed_url;
      }
      if (!payload.clone_image_url && project.clone_image_uri) {
        const s = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: project.clone_image_uri, expires_in: 1800 });
        payload.clone_image_url = s.signed_url;
      }
      const res = await base44.functions.invoke("verifyClone", payload);
      if (res.data?.error) setError(res.data.error);
      else onUpdated?.(res.data.project);
    } catch (e) {
      setError(e?.response?.data?.error || "Verification failed.");
    } finally {
      setRunning(false);
    }
  };

  const accept = async () => {
    if (!project || project.operational_gate !== "passed" || project.visual_gate !== "passed") return;
    setBusy(true);
    try {
      const me = await base44.auth.me();
      const updated = await base44.entities.CloneProject.update(project.id, {
        human_approved: true,
        approved_by: me?.email || "",
        approved_at: new Date().toISOString(),
        status: "verified"
      });
      onUpdated?.({ ...project, ...updated });
    } catch (e) {
      setError("Could not record acceptance.");
    } finally {
      setBusy(false);
    }
  };

  if (!project) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Capture a source to start a clone project.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Mandatory gates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={cn("rounded-lg border p-3", RESULT_STYLES[project.operational_gate === "passed" ? "PASS" : project.operational_gate === "failed" ? "FAIL" : "NOT RUN"])}>
              <p className="text-xs">Operational</p>
              <p className="text-lg font-semibold">{project.operational_score || 0}%</p>
              <p className="text-xs">every required check must pass</p>
            </div>
            <div className={cn("rounded-lg border p-3", RESULT_STYLES[project.visual_gate === "passed" ? "PASS" : project.visual_gate === "failed" ? "FAIL" : "NOT RUN"])}>
              <p className="text-xs">Visual</p>
              <p className="text-lg font-semibold">{project.visual_score || 0}%</p>
              <p className="text-xs">zero open visual defects</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Both gates must pass and you must accept the result yourself. Neither happens automatically, and no score substitutes for the gates.
          </p>
          <Button size="sm" onClick={verify} disabled={running || !cloneHtml}>
            {running ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />} Run QA and validation
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={accept}
            disabled={busy || project.operational_gate !== "passed" || project.visual_gate !== "passed" || project.human_approved}
          >
            <Check className="w-3.5 h-3.5 mr-1" /> {project.human_approved ? `Accepted by ${project.approved_by || "you"}` : "Accept clone"}
          </Button>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Visual evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            This environment cannot capture screenshots, so attach one image of the source and one of your rendered clone. The comparison runs on those two images.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Source screenshot {project.reference_image_uri ? "· attached" : ""}</p>
              <Input type="file" accept="image/*" onChange={(e) => setReferenceFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Clone screenshot {project.clone_image_uri ? "· attached" : ""}</p>
              <Input type="file" accept="image/*" onChange={(e) => setCloneFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Stored privately (stored privately).</p>
          <Button size="sm" variant="outline" onClick={attachEvidence} disabled={busy || (!referenceFile && !cloneFile)}>
            {busy ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />} Attach
          </Button>
          {visual && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Visual comparison</p>
                <Badge variant="outline" className="text-xs">{visual.status || (visual.defects?.length ? "defects found" : "clean")}</Badge>
              </div>
              {visual.summary && <p className="text-xs text-muted-foreground">{visual.summary}</p>}
              {(visual.regions || []).map((r, i) => (
                <p key={i} className="text-xs">
                  <span className="font-medium">{r.name}</span> <span className="text-muted-foreground">— {r.verdict}</span>
                  {r.differences ? <span className="text-muted-foreground"> · {r.differences}</span> : null}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {checks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Operational checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {checks.map((c) => (
              <div key={c.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                <Badge variant="outline" className={cn("text-xs shrink-0 border", RESULT_STYLES[c.result] || RESULT_STYLES["NOT RUN"])}>{c.result}</Badge>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">expected {c.expected} · found {c.found}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {defects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /> Open defects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {defects.map((d, i) => (
              <div key={i} className="text-xs border-b border-border last:border-0 pb-2">
                <p className="font-medium">{d.source} · {d.severity}</p>
                <p className="text-muted-foreground">{d.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(qa || validation) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">QA and validating agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {qa && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">QA agent</Badge>
                  <span className="text-xs text-muted-foreground">confidence {qa.confidence ?? "—"}</span>
                </div>
                <p className="text-xs">{qa.verdict}</p>
                {(qa.claims || []).map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground">· {c.claim} <span className="opacity-70">({c.severity})</span></p>
                ))}
              </div>
            )}
            {validation && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Validating agent</Badge>
                  <Badge variant="outline" className="text-xs">{validation.decision}</Badge>
                </div>
                {(validation.claims || []).map((c, i) => (
                  <p key={i} className="text-xs">
                    <span className="font-medium">{c.verdict}</span> — <span className="text-muted-foreground">{c.claim}</span>
                  </p>
                ))}
                {(validation.could_not_verify || []).map((c, i) => (
                  <p key={`n${i}`} className="text-xs text-muted-foreground flex items-start gap-1">
                    <X className="w-3 h-3 mt-0.5 shrink-0" /> {c}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {evidence.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Evidence and limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {evidence.map((e, i) => (
              <p key={i} className="text-xs text-muted-foreground">· {typeof e === "string" ? e : e.note}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
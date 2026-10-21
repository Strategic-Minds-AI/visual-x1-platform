import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Rocket } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Where a launched wave ships. Until a project is bound here, the orchestrator records the
// wave and dispatches nothing.
export default function DeployTargetPicker({ template, onSaved }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [project, setProject] = useState("");
  const [branch, setBranch] = useState("");

  useEffect(() => {
    setProject(template?.vercel_project || "");
    setBranch(template?.deploy_branch || "");
  }, [template?.id, template?.vercel_project, template?.deploy_branch]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("vercelConsole", { action: "list_projects" });
        setProjects(res.data?.projects || []);
      } catch (error) {
        setNote(error.response?.data?.error || error.message || "Could not read the Vercel projects.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setNote("");
    try {
      await base44.entities.SEOTemplate.update(template.id, { vercel_project: project, deploy_branch: branch });
      setNote(project ? `Waves from this layout now ship to ${project}.` : "Saved. Waves will be recorded and not dispatched.");
      onSaved?.();
    } catch (error) {
      setNote(error.message || "Could not save the deploy target.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Deploy target for this layout</p>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Vercel project</Label>
            <Select value={project || "none"} onValueChange={(v) => setProject(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Reading projects..." : "Not bound"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not bound — record only</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id || p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Branch (optional)</Label>
            <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={save} disabled={saving || !template}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save target
            </Button>
          </div>
        </div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
        <p className="text-xs text-muted-foreground">
          A branch deploys that commit; leaving it empty rebuilds the project's existing build.
        </p>
      </CardContent>
    </Card>
  );
}
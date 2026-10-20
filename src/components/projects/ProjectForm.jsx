import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const EMPTY = {
  name: "",
  stack_type: "static_site",
  description: "",
  github_repo: "",
  vercel_url: "",
  deployment_url: "",
  railway_url: "",
  railway_service_id: "",
  supabase_staging_ref: "",
  supabase_production_ref: "",
  drive_folder_url: "",
  domain: "",
  domain_status: "pending",
  provision_status: "pending"
};

const STACKS = ["static_site", "vite_app", "fullstack", "backend_api", "mobile_app"];
const DOMAIN_STATUS = ["pending", "available", "configured", "purchased", "failed"];
const PROVISION = [
  "pending",
  "github_ready",
  "vercel_ready",
  "railway_ready",
  "supabase_ready",
  "domain_ready",
  "complete",
  "failed"
];

const label = (v) => String(v).replace(/_/g, " ");

function Field({ title, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{title}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// One system's record: where its code, deployment, worker, data and documents live.
// These fields point at things; the indicators on the card are what read them.
export default function ProjectForm({ open, record, saving, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(record ? { ...EMPTY, ...record } : EMPTY);
  }, [record, open]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record?.id ? "Edit system" : "New system"}</DialogTitle>
          <DialogDescription>
            Point this system at the repository, deployment, worker, database and folder that hold it. Nothing is assumed
            from a filled-in field: each service is read for itself.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          <Field title="Name">
            <Input value={form.name} onChange={set("name")} placeholder="acme-plumbing-site" className="h-9 text-sm" />
          </Field>

          <Field title="Kind of system">
            <Select value={form.stack_type} onValueChange={(v) => setForm((f) => ({ ...f, stack_type: v }))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STACKS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {label(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field title="GitHub repository" hint="owner/repo, matched against the connected GitHub account">
            <Input value={form.github_repo} onChange={set("github_repo")} placeholder="owner/repo" className="h-9 text-sm" />
          </Field>

          <Field title="Vercel project" hint="the project name the deployment is read and published by">
            <Input value={form.vercel_url} onChange={set("vercel_url")} placeholder="project-name" className="h-9 text-sm" />
          </Field>

          <Field title="Live address">
            <Input value={form.deployment_url} onChange={set("deployment_url")} placeholder="https://example.com" className="h-9 text-sm" />
          </Field>

          <Field title="Custom domain">
            <Input value={form.domain} onChange={set("domain")} placeholder="example.com" className="h-9 text-sm" />
          </Field>

          <Field title="Domain status">
            <Select value={form.domain_status} onValueChange={(v) => setForm((f) => ({ ...f, domain_status: v }))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAIN_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field title="Provisioning">
            <Select value={form.provision_status} onValueChange={(v) => setForm((f) => ({ ...f, provision_status: v }))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVISION.map((s) => (
                  <SelectItem key={s} value={s}>
                    {label(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field title="Railway service id" hint="the worker or API on Railway">
            <Input value={form.railway_service_id} onChange={set("railway_service_id")} placeholder="service id" className="h-9 text-sm" />
          </Field>

          <Field title="Railway project address">
            <Input value={form.railway_url} onChange={set("railway_url")} placeholder="https://railway.app/project/…" className="h-9 text-sm" />
          </Field>

          <Field title="Supabase staging ref" hint="the project ref acting as staging">
            <Input value={form.supabase_staging_ref} onChange={set("supabase_staging_ref")} placeholder="staging project ref" className="h-9 text-sm" />
          </Field>

          <Field title="Supabase production ref" hint="the project ref acting as production">
            <Input value={form.supabase_production_ref} onChange={set("supabase_production_ref")} placeholder="production project ref" className="h-9 text-sm" />
          </Field>

          <Field title="Google Drive folder">
            <Input value={form.drive_folder_url} onChange={set("drive_folder_url")} placeholder="https://drive.google.com/drive/folders/…" className="h-9 text-sm" />
          </Field>

          <Field title="Notes">
            <Input value={form.description} onChange={set("description")} placeholder="what runs on this system" className="h-9 text-sm" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={saving || form.name.trim().length < 2}>
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
            {record?.id ? "Save system" : "Add system"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
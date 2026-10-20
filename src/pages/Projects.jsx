import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Boxes, Download, Loader2, Plus, RefreshCw } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectForm from "@/components/projects/ProjectForm";
import useInfrastructure from "@/hooks/useInfrastructure";
import { vercelName } from "@/lib/projectIndicators";

// What each framework on Vercel maps to when a project is imported.
const STACK_FOR = {
  nextjs: "fullstack",
  remix: "fullstack",
  sveltekit: "fullstack",
  nuxtjs: "fullstack",
  vite: "vite_app",
  "create-react-app": "vite_app",
  astro: "static_site"
};

function ServiceChip({ name, state, detail }) {
  const tone =
    state === "live"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
      : state === "attention"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
        : "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className={`rounded-xl border px-3 py-2 ${tone}`}>
      <p className="x1-track text-[9px] text-muted-foreground">{name}</p>
      <p className="text-[11px] leading-snug">{detail}</p>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // Every Supabase environment the records point at is what gets read — not the
  // whole account, and never a ref this page was not given.
  const refs = useMemo(() => {
    const set = new Set();
    projects.forEach((p) =>
      [p.supabase_staging_ref, p.supabase_production_ref, p.supabase_ref].forEach((r) => {
        if (r && String(r).trim()) set.add(String(r).trim());
      })
    );
    return [...set];
  }, [projects]);

  const { live, loading: liveLoading, notes, reload } = useInfrastructure(refs);

  const load = async () => {
    setLoading(true);
    const page = await base44.entities.ClientInfrastructure.filter({}, { sort: "-created_date", limit: 100 });
    setProjects(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (form) => {
    setSaving(true);
    setError("");
    const payload = { ...form, name: form.name.trim() };
    if (editing?.id) await base44.entities.ClientInfrastructure.update(editing.id, payload);
    else await base44.entities.ClientInfrastructure.create(payload);
    setSaving(false);
    setFormOpen(false);
    setEditing(null);
    await load();
  };

  const remove = async (project) => {
    if (!window.confirm(`Delete ${project.name} from the ledger? This removes the record only.`)) return;
    await base44.entities.ClientInfrastructure.delete(project.id);
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
  };

  // Bring in what Vercel already holds, so the indicators have something real to
  // read on the first visit. Nothing already tracked is added twice.
  const importFromVercel = async () => {
    setBusy("import");
    setError("");
    try {
      const tracked = new Set(projects.map((p) => vercelName(p)).filter(Boolean));
      const rows = (live?.vercel?.projects || [])
        .filter((p) => !tracked.has(String(p.name).toLowerCase()))
        .map((p) => ({
          name: p.name,
          vercel_url: p.name,
          vercel_id: p.id,
          deployment_url: p.url || "",
          github_repo: p.git?.org && p.git?.repo ? `${p.git.org}/${p.git.repo}` : "",
          github_url: p.git?.org && p.git?.repo ? `https://github.com/${p.git.org}/${p.git.repo}` : "",
          stack_type: STACK_FOR[String(p.framework || "").toLowerCase()] || "static_site",
          description: `Imported from Vercel${p.framework ? ` · ${p.framework}` : ""}`
        }));
      if (!rows.length) {
        setError("Every Vercel project this token can see is already in the ledger.");
      } else {
        await base44.entities.ClientInfrastructure.bulkCreate(rows);
        await load();
      }
    } catch (e) {
      setError(e?.message || "The Vercel projects could not be brought in.");
    }
    setBusy("");
  };

  const strip = live
    ? [
        {
          name: "GitHub",
          state: live.github.connected ? "live" : "attention",
          detail: live.github.connected
            ? `${live.github.account?.login || "account"} · ${live.github.repos.length} repositories readable`
            : live.github.error || "not connected"
        },
        {
          name: "Vercel",
          state: live.vercel.connected ? "live" : "attention",
          detail: live.vercel.connected
            ? `${live.vercel.projects.length} projects on the token`
            : live.vercel.error || "not connected"
        },
        {
          name: "Supabase",
          state: live.supabase.connected ? (refs.length ? "live" : "attention") : "attention",
          detail: live.supabase.connected
            ? live.supabase.projects.length
              ? `${live.supabase.projects.length} projects · ${refs.length} environment(s) read here`
              : "connected · no projects visible"
            : live.supabase.error || "not connected"
        },
        {
          name: "Drive",
          state: live.drive.connected ? "live" : "attention",
          detail: live.drive.connected ? "connected · folders can be linked" : "not connected to this app yet"
        },
        {
          name: "Railway",
          state: live.railway.token_present ? "live" : "attention",
          detail: live.railway.token_present ? "token stored · health read from the control room" : "no token stored yet"
        }
      ]
    : [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Boxes className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Projects</h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={reload} disabled={liveLoading}>
              {liveLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Recheck services
            </Button>
            <Button size="sm" variant="outline" onClick={importFromVercel} disabled={busy === "import" || !live?.vercel?.connected}>
              {busy === "import" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
              Import from Vercel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New system
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground max-w-3xl">
          Every system this operation runs, with what each service actually answers for it. The chips below are read live
          from GitHub, Vercel, Supabase, Drive and Railway; a system's own indicators say which of them it is wired to and
          what was found there.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {liveLoading && !live ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2 col-span-full">
              <Loader2 className="w-4 h-4 animate-spin" /> Reading the services this app is wired to…
            </p>
          ) : (
            strip.map((s) => <ServiceChip key={s.name} {...s} />)
          )}
        </div>

        {error ? (
          <p className="text-sm rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-200 px-3 py-2">{error}</p>
        ) : null}
        {notes?.map((n) => (
          <p key={n} className="text-sm rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-200 px-3 py-2">
            {n}
          </p>
        ))}

        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Reading the ledger…
          </p>
        ) : !projects.length ? (
          <div className="x1-glass rounded-2xl p-8 text-center space-y-2">
            <p className="font-heading font-semibold">No systems in the ledger yet</p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Import what Vercel already holds, or add a system by hand and point it at its repository, deployment, worker,
              database and folder.
            </p>
          </div>
        ) : (
          <div className="grid xl:grid-cols-2 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                live={live}
                onEdit={(p) => {
                  setEditing(p);
                  setFormOpen(true);
                }}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectForm
        open={formOpen}
        record={editing}
        saving={saving}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        onSubmit={save}
      />
    </div>
  );
}
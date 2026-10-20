import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// One read of every service this app is wired to, shared by the whole page: the
// repositories GitHub will show, the Vercel projects, which connectors and secrets
// this app really holds, and the catalog of each Supabase environment in use.
// Answers come back as they are — a refusal is reported as a refusal.

const call = async (name, payload) => {
  const res = await base44.functions.invoke(name, payload);
  return res.data || {};
};

const settled = (result) => (result.status === "fulfilled" ? result.value : {});

export default function useInfrastructure(refs) {
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const refKey = (refs || []).join(",");

  const load = useCallback(async () => {
    setLoading(true);
    const list = refKey ? refKey.split(",") : [];
    const [gh, vc, pc, sb] = await Promise.allSettled([
      call("githubRepo", { action: "list_repos" }),
      call("vercelConsole", { action: "list_projects" }),
      call("projectConsole", { action: "status" }),
      call("supabaseEnvironments", { action: "overview", refs: list })
    ]);

    const github = settled(gh);
    const vercel = settled(vc);
    const console_ = settled(pc);
    const supabase = settled(sb);

    const connectors = (console_.connectors || []).reduce((acc, c) => ({ ...acc, [c.type]: c.connected }), {});
    const secrets = (console_.secrets || []).reduce((acc, s) => ({ ...acc, [s.name]: s.present }), {});

    setLive({
      github: {
        connected: Boolean(github.ok),
        account: github.account || null,
        repos: github.repos || [],
        error: github.ok ? "" : github.error || ""
      },
      vercel: {
        connected: Boolean(vercel.ok),
        projects: vercel.projects || [],
        error: vercel.ok ? "" : vercel.error || ""
      },
      drive: { connected: Boolean(connectors.googledrive) },
      railway: { token_present: Boolean(secrets.RAILWAY_TOKEN) },
      supabase: {
        connected: Boolean(supabase.ok),
        projects: supabase.projects || [],
        environments: supabase.environments || [],
        error: supabase.ok ? "" : supabase.error || ""
      }
    });

    setNotes(
      [
        github.ok ? null : github.error && `GitHub: ${github.error}`,
        vercel.ok ? null : vercel.error && `Vercel: ${vercel.error}`,
        supabase.ok ? null : supabase.error && `Supabase: ${supabase.error}`
      ].filter(Boolean)
    );
    setLoading(false);
  }, [refKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { live, loading, notes, reload: load };
}
import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const call = async (payload) => {
  const res = await base44.functions.invoke("vercelConsole", payload);
  const data = res.data || {};
  if (!data.ok) throw new Error(data.error || "Vercel did not answer.");
  return data;
};

/**
 * The Vercel side of the editor: the operator's own account, read through the stored
 * VERCEL_TOKEN, the projects on it, and the two actions that belong here — deploy the
 * project that is selected, and roll it back to the deployment before the current
 * one. Opening a project on the canvas is the editor's own capture pipeline.
 */
export default function useVercelEditor({ say, openSource }) {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [busy, setBusy] = useState("");
  const [loaded, setLoaded] = useState(false);

  const find = useCallback(async (term) => {
    setBusy("projects");
    try {
      const data = await call({ action: "list_projects", search: term || undefined });
      setProjects(data.projects || []);
    } catch (e) {
      setError(e.message);
      setProjects([]);
    } finally {
      setBusy("");
    }
  }, []);

  const load = useCallback(async () => {
    setBusy("account");
    setError("");
    try {
      const status = await call({ action: "status" });
      setAccount(status.account);
      const list = await call({ action: "list_projects" });
      setProjects(list.projects || []);
    } catch (e) {
      setError(e.message);
      setAccount(null);
      setProjects([]);
    } finally {
      setLoaded(true);
      setBusy("");
    }
  }, []);

  const pick = useCallback(async (project) => {
    setSelected(project);
    setDeployments([]);
    try {
      const data = await call({ action: "project", project: project.id || project.name });
      setSelected(data.project || project);
      setDeployments(data.deployments || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const deploy = useCallback(
    async (project = selected) => {
      if (!project) {
        say("VERCEL", "Pick a Vercel project in the Vercel menu first.", "error");
        return;
      }
      setBusy("deploy");
      try {
        const data = await call({ action: "deploy", project: project.id || project.name });
        const deployment = data.deployment || {};
        say("VERCEL", `Vercel accepted the deployment of ${project.name}: ${deployment.url || "queued"} — state ${deployment.state || "unknown"}, mode ${data.mode || "unknown"}.`);
        await pick(project);
      } catch (e) {
        say("VERCEL", e.message, "error");
      } finally {
        setBusy("");
      }
    },
    [selected, say, pick]
  );

  const rollback = useCallback(async () => {
    if (!selected) {
      say("VERCEL", "Pick a Vercel project in the Vercel menu first.", "error");
      return;
    }
    setBusy("rollback");
    try {
      const data = await call({ action: "rollback", project: selected.id || selected.name });
      say("VERCEL", `Rolled ${selected.name} back to ${data.rolled_back_to?.url || "the previous deployment"} — Vercel answered: ${data.answer || "accepted"}.`);
      await pick(selected);
    } catch (e) {
      say("VERCEL", e.message, "error");
    } finally {
      setBusy("");
    }
  }, [selected, say, pick]);

  const open = useCallback(
    (project) => {
      if (!project?.url) {
        say("VERCEL", `${project?.name || "That project"} has no live URL on Vercel, so there is nothing to capture.`, "error");
        return;
      }
      openSource({ url: project.url, name: project.name, sourceType: "url", label: `${project.name} on Vercel` });
    },
    [openSource, say]
  );

  // Typing in the menu searches Vercel itself, debounced, so the list is the account's
  // own answer rather than a filter over a stale page of results.
  useEffect(() => {
    if (!loaded || error || !search.trim()) return;
    const timer = setTimeout(() => find(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search, loaded, error, find]);

  return {
    account,
    error,
    projects,
    search,
    setSearch,
    selected,
    pick,
    deployments,
    deploy,
    rollback,
    open,
    busy,
    load,
    loaded
  };
}
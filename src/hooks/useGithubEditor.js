import { useCallback, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * The GitHub side of the editor: the connected account, the repositories it can see,
 * creating a new one, and opening a repository in the editor through the app's own
 * capture pipeline. Every answer comes from GitHub through the app's connection.
 */
export default function useGithubEditor({ say, openSource }) {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [repos, setRepos] = useState([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [loaded, setLoaded] = useState(false);

  const invoke = useCallback(async (payload) => {
    const res = await base44.functions.invoke("githubRepo", payload);
    const data = res.data || {};
    if (!data.ok) throw new Error(data.error || "GitHub did not answer.");
    return data;
  }, []);

  const list = useCallback(async () => {
    setBusy("repos");
    try {
      const data = await invoke({ action: "list_repos" });
      setRepos(data.repos || []);
    } catch (e) {
      setError(e.message);
      setRepos([]);
    } finally {
      setBusy("");
    }
  }, [invoke]);

  const load = useCallback(async () => {
    setBusy("account");
    setError("");
    try {
      const status = await invoke({ action: "status" });
      setAccount(status.account);
      await list();
    } catch (e) {
      setError(e.message);
      setAccount(null);
      setRepos([]);
    } finally {
      setLoaded(true);
      setBusy("");
    }
  }, [invoke, list]);

  const create = useCallback(
    async (name, isPrivate) => {
      if (!name.trim()) return;
      setBusy("create");
      try {
        const data = await invoke({ action: "create_repo", name, private: Boolean(isPrivate) });
        say("GITHUB", `Created ${data.repo.full_name} (${data.repo.private ? "private" : "public"}) at ${data.repo.url}.`);
        await list();
      } catch (e) {
        say("GITHUB", e.message, "error");
      } finally {
        setBusy("");
      }
    },
    [invoke, list, say]
  );

  const open = useCallback(
    (repo) => {
      openSource({ url: repo.url, name: repo.full_name, sourceType: "repo", label: `the repository ${repo.full_name}` });
    },
    [openSource]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return repos;
    return repos.filter((repo) => `${repo.full_name} ${repo.description}`.toLowerCase().includes(term));
  }, [repos, search]);

  return { account, error, repos: visible, count: repos.length, search, setSearch, busy, load, loaded, create, open };
}
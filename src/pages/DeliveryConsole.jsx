import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Rocket } from "lucide-react";
import VercelStatus from "@/components/delivery/VercelStatus";
import ProjectBrowser from "@/components/delivery/ProjectBrowser";
import ProjectDetail from "@/components/delivery/ProjectDetail";

const call = async (payload) => {
  const res = await base44.functions.invoke("vercelConsole", payload);
  return res.data || {};
};

const SETTLED = ["READY", "ERROR", "CANCELED"];

export default function DeliveryConsole() {
  const [team, setTeam] = useState("");
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [live, setLive] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [creating, setCreating] = useState(false);

  const check = useCallback(async (t) => {
    setChecking(true);
    setError("");
    const data = await call({ action: "status", team: t });
    if (!data.ok) {
      setStatus(null);
      setError(data.error || "Could not reach Vercel.");
    } else {
      setStatus(data);
    }
    setChecking(false);
  }, []);

  const loadProjects = useCallback(async (t, q) => {
    setLoading(true);
    const data = await call({ action: "list_projects", team: t, search: q });
    if (!data.ok) setError(data.error || "Could not list projects.");
    else setError("");
    setProjects(data.projects || []);
    setLoading(false);
  }, []);

  const openProject = useCallback(async (project, t) => {
    setSelected(project);
    setDetail(null);
    setDeployments([]);
    setLive(null);
    const data = await call({ action: "project", team: t, project: project.name });
    if (!data.ok) {
      setError(data.error || "Could not read that project.");
      return;
    }
    setDetail(data.project);
    setDeployments(data.deployments || []);
    setLive((data.deployments || [])[0] || null);
  }, []);

  useEffect(() => {
    check("");
  }, [check]);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => loadProjects(team, search), 350);
    return () => clearTimeout(t);
  }, [status, team, search, loadProjects]);

  const refreshDetail = useCallback(async () => {
    if (!selected) return;
    const data = await call({ action: "project", team, project: selected.name });
    if (data.ok) {
      setDetail(data.project);
      setDeployments(data.deployments || []);
    }
  }, [selected, team]);

  // A deployment in flight is polled until Vercel reports a settled state. The poll
  // stops on its own, and the state shown is always Vercel's own answer.
  useEffect(() => {
    if (!live || !live.id || SETTLED.includes(live.state)) return;
    const t = setTimeout(async () => {
      const data = await call({ action: "deployment", team, deployment_id: live.id });
      if (data.ok && data.deployment) {
        setLive(data.deployment);
        if (SETTLED.includes(data.deployment.state)) refreshDetail();
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [live, team, refreshDetail]);

  const deploy = async (ref) => {
    if (!selected) return;
    setDeploying(true);
    setError("");
    const data = await call({ action: "deploy", team, project: selected.name, ref });
    if (!data.ok) setError(data.error || "The deployment was refused.");
    else {
      setLive(data.deployment);
      setDeployments((prev) => [data.deployment, ...prev]);
    }
    setDeploying(false);
  };

  const createProject = async (name) => {
    setCreating(true);
    setError("");
    const data = await call({ action: "create_project", team, name });
    if (!data.ok) setError(data.error || "Could not create the project.");
    else {
      setProjects((prev) => [data.project, ...prev]);
      openProject(data.project, team);
    }
    setCreating(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Delivery Console</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
          Your Vercel account, driven from here. Every number and state on this page is what Vercel answered for your token.
        </p>

        <div className="space-y-5">
          <VercelStatus
            status={status}
            checking={checking}
            error={error && !status ? error : ""}
            team={team}
            onTeam={(t) => {
              setTeam(t);
              check(t);
            }}
            onRecheck={() => check(team)}
          />

          {error && status ? (
            <p className="text-sm text-rose-600 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">{error}</p>
          ) : null}

          {status ? (
            <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-5 items-start">
              <ProjectBrowser
                projects={projects}
                loading={loading}
                search={search}
                onSearch={setSearch}
                selectedId={selected?.name}
                onSelect={(p) => openProject(p, team)}
                onCreate={createProject}
                creating={creating}
              />
              <ProjectDetail
                project={detail}
                deployments={deployments}
                live={live}
                deploying={deploying}
                onDeploy={deploy}
                onRefresh={refreshDetail}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
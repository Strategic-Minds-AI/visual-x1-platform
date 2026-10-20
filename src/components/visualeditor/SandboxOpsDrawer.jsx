import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Bot, CheckCircle2, ChevronRight, Cloud, Code2, Cpu, ExternalLink, GitBranch, Globe, RefreshCw, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import "@/styles/x1-sandbox-ops.css";

// This is a telemetry viewer, NOT a second control plane. Only the existing
// authenticated, administrator-only x1Bridge performs server-side reads.
const SURFACES = [
  { id: "operator_status", name: "X1 Control Plane", sub: "Worker and scheduler authority", Icon: Activity },
  { id: "worker_status", name: "Coding Workers", sub: "Existing queue and leases", Icon: Code2 },
  { id: "agent_sessions", name: "Super Agents", sub: "Actual reported sessions", Icon: Bot },
  { id: "work_items", name: "Build Queue", sub: "Durable work items", Icon: GitBranch },
  { id: "browser_health", name: "Cloud Browser", sub: "Authenticated browser gateway", Icon: Globe },
  { id: "health", name: "API Health", sub: "Backend probe (not E2E proof)", Icon: Cloud },
  { id: "agent_config", name: "Agent Registry", sub: "Reported roles and policy", Icon: Cpu },
];
const PIPELINE = ["Intake", "Architect", "Implement", "Test", "Independent Guardian", "Preview", "Release gate"];
function classify(entry) {
  if (!entry) return { label: "NOT CHECKED", tone: "unknown", summary: "No response received." };
  if (entry.status === 401 || entry.status === 403) return { label: "AUTH BLOCKED", tone: "blocked", summary: "The upstream service rejected the current scope." };
  if (entry.status === 0) return { label: "UNREACHABLE", tone: "blocked", summary: "Upstream did not respond." };
  if (entry.status >= 200 && entry.status < 300) return { label: "RESPONDED", tone: "responded", summary: "HTTP response received; functional operation is not established." };
  return { label: "HTTP " + entry.status, tone: "blocked", summary: "Upstream request failed." };
}
export default function SandboxOpsDrawer({ open, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("operator_status");
  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("x1Bridge", { routes: SURFACES.map((s) => s.id) });
      const data = res?.data;
      if (!data?.ok || !Array.isArray(data?.endpoints)) throw new Error("The X1 status bridge returned no valid inventory.");
      setSnapshot(data);
    } catch (e) {
      setSnapshot(null);
      setError(e?.response?.data?.error || e?.message || "Status request failed.");
    } finally { setBusy(false); }
  }, []);
  useEffect(() => { if (open) refresh(); }, [open, refresh]);
  const entries = useMemo(() => new Map((snapshot?.endpoints || []).map((e) => [e.name, e])), [snapshot]);
  if (!open) return null;
  const current = SURFACES.find((s) => s.id === selected) || SURFACES[0];
  const entry = entries.get(current.id);
  const status = classify(entry);
  return (
    <div className="x1-ops-backdrop">
      <button className="x1-ops-scrim" type="button" aria-label="Close sandbox monitoring" onClick={onClose} />
      <aside className="x1-ops-drawer" role="dialog" aria-modal="true" aria-label="X1 Visual Sandbox operations">
        <div className="x1-ops-header">
          <div><div className="x1-ops-kicker">X1 / VISUAL SANDBOX</div><h2>Autonomous Coding Command</h2><p>Live evidence from the existing X1 control plane. No simulated jobs or fabricated agent activity.</p></div>
          <button type="button" className="x1-ops-close" aria-label="Close operations" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="x1-ops-actions">
          <button type="button" onClick={refresh} disabled={busy}><RefreshCw size={14} className={busy ? "x1-ops-spin" : ""} /> {busy ? "Checking…" : "Refresh X1 evidence"}</button>
          <span>{snapshot?.read_at ? "Read " + new Date(snapshot.read_at).toLocaleString() : "No verified snapshot"}</span>
        </div>
        {error && <p className="x1-ops-error" role="alert">{error}</p>}
        <div className="x1-ops-layout">
          <nav className="x1-ops-roster" aria-label="Sandbox components">
            {SURFACES.map(({ id, name, sub, Icon }) => {
              const s = classify(entries.get(id));
              return <button key={id} className={selected === id ? "x1-ops-item active" : "x1-ops-item"} type="button" onClick={() => setSelected(id)} aria-pressed={selected === id}>
                <Icon size={16}/><span><strong>{name}</strong><small>{sub}</small></span><i className={"x1-ops-light " + s.tone} aria-label={s.label} />
              </button>;
            })}
            <div className="x1-ops-separator" />
            <div className="x1-ops-static"><Cpu size={16}/><span><strong>Local Docker + Ollama</strong><small>Requires a verified JARVIS telemetry bridge. Never expose Docker or port 11434 to the public.</small></span><i className="x1-ops-light unknown" aria-label="Not connected" /></div>
          </nav>
          <div className="x1-ops-detail">
            <div className="x1-ops-detail-head"><current.Icon size={20}/><h3>{current.name}</h3><span className={"x1-ops-status " + status.tone}>{status.label}</span></div>
            <p>{status.summary}</p>
            <dl>
              <div><dt>Read source</dt><dd>{entry?.path || "Not returned"}</dd></div>
              <div><dt>HTTP result</dt><dd>{entry?.status ?? "Not checked"}</dd></div>
              <div><dt>Evidence level</dt><dd>{entry?.status >= 200 && entry.status < 300 ? "Transport only — tests and Guardian receipt required" : "Not proven"}</dd></div>
            </dl>
            <h4>Execution pipeline</h4>
            <ol className="x1-ops-pipeline">
              {PIPELINE.map((stage, i) => <li key={stage}><span>{i + 1}</span><strong>{stage}</strong><small>Awaiting task-specific receipt</small>{i < PIPELINE.length - 1 && <ChevronRight size={13}/>}</li>)}
            </ol>
            <div className="x1-ops-note"><ShieldCheck size={18}/><span>A pipeline stage is accepted only with matching task ID, source SHA, result evidence and independent Guardian validation. This panel never dispatches or approves work.</span></div>
            <h4>Go to existing workspaces</h4>
            <div className="x1-ops-links">
              <Link to="/admin/coding-kanban" onClick={onClose}><GitBranch size={14}/> Coding board <ExternalLink size={12}/></Link>
              <Link to="/admin/agent" onClick={onClose}><Bot size={14}/> Agent activity <ExternalLink size={12}/></Link>
              <Link to="/admin/parity" onClick={onClose}><CheckCircle2 size={14}/> QA / parity <ExternalLink size={12}/></Link>
            </div>
          </div>
        </div>
        <footer className="x1-ops-footer">LOCAL OLLAMA = PRIVATE INFERENCE · CHATGPT = PLANNING/PLUGIN SKILLS · EXISTING X1 QUEUE = EXECUTION AUTHORITY</footer>
      </aside>
    </div>
  );
}

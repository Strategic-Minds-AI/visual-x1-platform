import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Copy, Cpu, Play, RefreshCw, Terminal, XCircle } from "lucide-react";

// The local bridge: Docker and Ollama run on the operator's own machine, so this
// panel is one half of a two-half system. Here the work is queued and watched;
// the worker script (bridge/worker.mjs) on that machine pulls it over HTTPS, runs
// it locally and reports exactly what came back. Nothing here pretends to have
// reached that machine — every row shows a real status a worker wrote.
const KINDS = [
  { id: "ollama", label: "Ollama — a local model", example: '{"model":"llama3.2","prompt":"Say hello in one line."}' },
  { id: "docker", label: "Docker — a container", example: '{"image":"alpine","args":["echo","hello from docker"]}' },
  { id: "http", label: "HTTP — a local service", example: '{"url":"http://localhost:3000/health"}' },
];

const STATUS_STYLE = {
  queued: "text-muted-foreground",
  claimed: "text-primary",
  done: "text-emerald-300",
  failed: "text-rose-300",
};

const StatusIcon = ({ status }) =>
  status === "done" ? (
    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
  ) : status === "failed" ? (
    <XCircle className="h-3.5 w-3.5 text-rose-300" />
  ) : (
    <Play className="h-3.5 w-3.5 text-muted-foreground" />
  );

export default function LocalBridgePanel() {
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState(null);
  const [kind, setKind] = useState("ollama");
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const [page, queued, claimed, done, failed] = await Promise.all([
      base44.entities.BridgeJob.list("-created_date", 25),
      base44.entities.BridgeJob.count({ status: "queued" }),
      base44.entities.BridgeJob.count({ status: "claimed" }),
      base44.entities.BridgeJob.count({ status: "done" }),
      base44.entities.BridgeJob.count({ status: "failed" }),
    ]);
    setJobs(Array.isArray(page) ? page : page.items || []);
    setCounts({ queued, claimed, done, failed });
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
    const timer = setInterval(() => load().catch(() => {}), 8000);
    return () => clearInterval(timer);
  }, []);

  const selected = KINDS.find((k) => k.id === kind);
  const endpoint = `${window.location.origin}/functions/localBridge`;
  const command = `BRIDGE_TOKEN=<your LOCAL_BRIDGE_TOKEN value> node bridge/worker.mjs`;

  const queue = async () => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const text = payload.trim() || selected.example;
      JSON.parse(text); // a payload that is not JSON would fail on the worker, so it fails here instead
      await base44.entities.BridgeJob.create({
        title: title.trim() || `${selected.label} job`,
        kind,
        payload_json: text,
        status: "queued",
        requested_by: "operator console",
      });
      setTitle("");
      setPayload("");
      setNote("Queued. The worker on your machine picks it up on its next pull.");
      await load();
    } catch (e) {
      setError(e.message.includes("JSON") ? "That payload is not valid JSON." : e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed — select the command and copy it by hand.");
    }
  };

  const card = "x1-glass rounded-2xl p-5";

  return (
    <div className="cp-admin-stack">
      <div className={card}>
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="x1-track text-xs text-foreground">LOCAL BRIDGE — DOCKER AND OLLAMA</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing hosted can open a connection into your machine, so the worker on that machine comes to the app.
          Queue work here, run the worker once, and it pulls each job, executes it locally against Ollama or Docker,
          and reports the real result back into this list.
        </p>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-muted/60 px-2 py-1 text-xs text-foreground">{command}</code>
            <Button variant="outline" size="sm" onClick={copyCommand}>
              <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Endpoint the worker calls: <span className="text-foreground">{endpoint}</span> · it reads models from{" "}
            <span className="text-foreground">http://localhost:11434</span> unless you set OLLAMA_URL.
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <h3 className="x1-track text-xs text-foreground">QUEUE LOCAL WORK</h3>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Select value={kind} onValueChange={(v) => setKind(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input className="md:col-span-2" placeholder="What is this job?" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <Textarea
          className="mt-3 font-mono text-xs"
          rows={3}
          placeholder={selected.example}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={queue} disabled={busy}>
            <Play className="h-3.5 w-3.5" /> {busy ? "Queuing…" : "Queue it"}
          </Button>
          {note && <span className="text-xs text-muted-foreground">{note}</span>}
          {error && (
            <span className="flex items-center gap-1 text-xs text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </span>
          )}
        </div>
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="x1-track text-xs text-foreground">THE QUEUE</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {counts && (
              <span>
                {counts.queued} queued · {counts.claimed} running · {counts.done} done · {counts.failed} failed
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => load().catch((e) => setError(e.message))}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing queued yet. A worker that has never connected means this list stays empty — that is the honest state.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusIcon status={job.status} />
                  <span className="text-foreground">{job.title}</span>
                  <span className={`x1-track text-[10px] ${STATUS_STYLE[job.status] || ""}`}>{job.status}</span>
                  <span className="text-xs text-muted-foreground">
                    {job.kind}
                    {job.worker_id ? ` · ${job.worker_id}` : ""}
                    {job.duration_ms ? ` · ${job.duration_ms} ms` : ""}
                  </span>
                </div>
                {job.error && <p className="mt-1 text-xs text-rose-300">{job.error}</p>}
                {job.result_json && (
                  <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {job.result_json.slice(0, 600)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
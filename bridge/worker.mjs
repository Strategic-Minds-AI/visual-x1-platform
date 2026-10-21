#!/usr/bin/env node
// Visual X local bridge worker.
//
// Runs on the machine that has Docker and/or Ollama. It pulls one queued job at a
// time from the published app, runs it locally, and reports back what actually
// happened. Nothing reaches into this machine: the connection is always outbound.
//
//   BRIDGE_TOKEN=<the LOCAL_BRIDGE_TOKEN value> node bridge/worker.mjs
//
// Environment:
//   BRIDGE_TOKEN  required — the value you put in the app's Secrets page
//   BRIDGE_URL    default https://visual-x1.base44.app/functions/localBridge
//   OLLAMA_URL    default http://localhost:11434
//   WORKER_ID     default this machine's hostname
//   IDLE_MS       default 5000 — how long to wait when the queue is empty
import os from "node:os";
import { spawn } from "node:child_process";

const BRIDGE_URL = process.env.BRIDGE_URL || "https://visual-x1.base44.app/functions/localBridge";
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || "";
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/$/, "");
const WORKER_ID = process.env.WORKER_ID || os.hostname();
const IDLE_MS = Number(process.env.IDLE_MS || 5000);

if (!BRIDGE_TOKEN) {
  console.error("BRIDGE_TOKEN is required. Set it to the LOCAL_BRIDGE_TOKEN value from the app's Secrets page.");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function call(action, payload = {}) {
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-bridge-token": BRIDGE_TOKEN },
    body: JSON.stringify({ action, worker_id: WORKER_ID, ...payload }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  if (!res.ok) throw new Error(`${action} rejected (${res.status}): ${data.error || text.slice(0, 200)}`);
  return data;
}

async function runOllama(payload) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: payload.model, prompt: payload.prompt, stream: false }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ollama answered ${res.status}`);
  return {
    model: data.model,
    response: String(data.response || "").slice(0, 12000),
    eval_count: data.eval_count || 0,
    total_duration_ms: data.total_duration ? Math.round(data.total_duration / 1e6) : null,
  };
}

function runDocker(payload) {
  return new Promise((resolve, reject) => {
    if (!payload.image) return reject(new Error("payload.image is required for a docker job"));
    const args = ["run", "--rm", ...(Array.isArray(payload.args) ? payload.args : []), payload.image];
    const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => reject(new Error(`docker could not start: ${error.message}`)));
    child.on("close", (code) =>
      resolve({
        exit_code: code,
        image: payload.image,
        args,
        stdout: stdout.slice(-8000),
        stderr: stderr.slice(-4000),
      })
    );
  });
}

async function runHttp(payload) {
  if (!payload.url) throw new Error("payload.url is required for an http job");
  const res = await fetch(payload.url, {
    method: payload.method || "GET",
    headers: payload.headers || {},
    body: payload.body ? JSON.stringify(payload.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 12000) };
}

async function execute(job) {
  const started = Date.now();
  try {
    let result;
    if (job.kind === "ollama") result = await runOllama(job.payload);
    else if (job.kind === "docker") result = await runDocker(job.payload);
    else if (job.kind === "http") result = await runHttp(job.payload);
    else throw new Error(`unknown job kind: ${job.kind}`);
    const report = await call("report", { job_id: job.id, status: "done", result, duration_ms: Date.now() - started });
    console.log(`[bridge] ${job.kind} "${job.title}" done -> ${report.status}`);
  } catch (error) {
    await call("report", {
      job_id: job.id,
      status: "failed",
      error: String(error.message || error).slice(0, 800),
      duration_ms: Date.now() - started,
    });
    console.error(`[bridge] ${job.kind} "${job.title}" failed: ${error.message}`);
  }
}

async function main() {
  const hello = await call("handshake");
  console.log(`[bridge] worker ${WORKER_ID} connected to ${BRIDGE_URL}`);
  console.log(`[bridge] ollama at ${OLLAMA_URL} | queue: ${hello.queued} waiting, ${hello.claimed} claimed`);
  for (;;) {
    try {
      const { job } = await call("pull");
      if (!job) {
        await sleep(IDLE_MS);
        continue;
      }
      console.log(`[bridge] claimed ${job.kind} "${job.title}"`);
      await execute(job);
    } catch (error) {
      console.error(`[bridge] ${error.message} — retrying in ${IDLE_MS}ms`);
      await sleep(IDLE_MS);
    }
  }
}

main().catch((error) => {
  console.error(`[bridge] stopped: ${error.message}`);
  process.exit(1);
});
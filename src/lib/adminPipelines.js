import { base44 } from "@/api/base44Client";

// Every Visual X action in the operator admin runs through this module, so the
// prompt system, clone pipeline and website factory share one error contract and
// one way of reading a page of live records.
export function pipelineError(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "The pipeline call failed."
  );
}

export async function runPipeline(name, payload) {
  const res = await base44.functions.invoke(name, payload);
  return res?.data ?? {};
}

export async function readRecords(entity, { sort = "-created_date", limit = 50, query = {} } = {}) {
  const page = await base44.entities[entity].filter(query, { sort, limit });
  return page?.items || [];
}

export async function countRecords(entity, query = {}) {
  return await base44.entities[entity].count(query);
}

export function when(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function money(cents, currency = "usd") {
  if (cents === null || cents === undefined) return "—";
  return `${(Number(cents) / 100).toFixed(2)} ${String(currency).toUpperCase()}`;
}
import {
  ALL_EDIT_ITEMS,
  COLOR_EFFECTS,
  COLOR_ROLES,
  DEFAULT_COLORS,
  MANDATORIES,
  PROMPT_SYSTEM_TYPES,
  RESTRICTIONS,
  STUDIO_AGENTS,
} from "@/data/websiteEditCatalog";

// Assembles the Website Self-Edit prompt from what the operator chose. One place,
// so the studio, the simulation and the preview all read the same text.
const pick = (list, ids) => list.filter((item) => ids.includes(item.id));

export const byId = (list, id) => list.find((item) => item.id === id);

export function emptySelection() {
  return {
    brief: "",
    capabilities: [],
    promptType: "transform",
    benchmark: { mode: "page", route: "/", url: "", reference: null },
    colors: { ...DEFAULT_COLORS },
    effect: "soft_gradient",
    mandatories: ["mobile_first", "wcag_aa", "working_js", "honest_copy"],
    restrictions: ["no_break_working", "keep_routes", "no_filler", "no_auto_deploy"],
    agents: STUDIO_AGENTS.map((a) => a.id),
  };
}

export function benchmarkLine(benchmark, siteUrl) {
  const evidence = benchmark.evidence ? `\n${benchmark.evidence}` : "";
  if (benchmark.mode === "url")
    return benchmark.url
      ? `Benchmark: the live page at ${benchmark.url} — compare it region by region and match or beat it.${evidence}`
      : "Benchmark: no URL supplied yet.";
  if (benchmark.mode === "library")
    return benchmark.reference
      ? `Benchmark: ${benchmark.reference.name} (${benchmark.reference.url}), library UX score ${benchmark.reference.ux_score || "unrated"}. Patterns to implement: ${benchmark.reference.key_patterns || benchmark.reference.description || "as documented"}.${evidence}`
      : "Benchmark: no library reference selected yet.";
  return `Benchmark: this site's own page ${benchmark.route}${siteUrl ? ` (${siteUrl}${benchmark.route})` : ""} — treat its structure, spacing and copy as the baseline to improve on.${evidence}`;
}

export function colorLines(state) {
  const effect = byId(COLOR_EFFECTS, state.effect);
  const lines = COLOR_ROLES.map((role) => `${role.label}: ${state.colors[role.id]} (${role.hint}).`);
  if (effect) {
    lines.push(`Colour effect: ${effect.label} — ${effect.hint}`);
    lines.push(`Effect implementation sketch: ${effect.swatch(state.colors)}`);
  }
  return lines;
}

export function buildWebsiteEditPrompt(state, { siteUrl, iterations } = {}) {
  const chosen = pick(ALL_EDIT_ITEMS, state.capabilities);
  const type = byId(PROMPT_SYSTEM_TYPES, state.promptType);
  const agents = pick(STUDIO_AGENTS, state.agents);
  const mandatory = pick(MANDATORIES, state.mandatories);
  const restrictions = pick(RESTRICTIONS, state.restrictions);

  const sections = [
    "ROLE: You are the senior product engineer who maintains THIS website — the site below, not a new one. You work inside the Visual X / X1 Operating System, whose prompt system, simulator, preview, QA agent, validation agent and test agent this brief routes through.",

    "OBJECTIVE: " + (state.brief.trim() || "Improve this website."),

    `TARGET SITE: ${siteUrl || "this site"} — edit this site in place.`,

    "PROMPT SYSTEM: " + (type ? `${type.label} — ${type.description}\nThis run must: ${type.writes}` : "Prompt Transform."),

    chosen.length
      ? "EDIT CAPABILITIES REQUESTED (every one of these must be implemented, not summarised):\n" + chosen.map((c, i) => `${i + 1}. ${c.label} — ${c.line}`).join("\n")
      : "EDIT CAPABILITIES REQUESTED: none ticked yet — implement only what the objective names.",

    "COLOUR SYSTEM (authoritative — use exactly these):\n" + colorLines(state).join("\n"),

    "BENCHMARK: " + benchmarkLine(state.benchmark),

    mandatory.length ? "MANDATORY RULES (non-negotiable):\n" + mandatory.map((m) => `- ${m[1]}: ${m[2]}`).join("\n") : "MANDATORY RULES: none set.",

    restrictions.length ? "RESTRICTIONS (do not cross these):\n" + restrictions.map((r) => `- ${r[1]}: ${r[2]}`).join("\n") : "RESTRICTIONS: none set.",

    agents.length
      ? "AGENTS REQUIRED BEFORE THIS IS ACCEPTED:\n" + agents.map((a) => `- ${a.label}: ${a.hint}.`).join("\n") +
        "\nWork the loop: build, simulate, preview, validate, test and judge the content — and keep looping until the validator passes at 95 or above with no hard-gate failure. Simulation and preview may be run as many times as it takes."
      : "AGENTS: the operator has not required an agent pass on this run.",

    "DELIVERABLES:\n1. The changed code and content, in full.\n2. A short list of what changed, page by page, and what you deliberately left alone.\n3. The agent readouts: QA score, validator decision and score, test-agent probes and what could not be tested, and the content judge's SEO / GEO / AEO scores.\n4. Anything you could not evidence — stated as unverified, never implied as passing.",

    "OUTPUT FORMAT: implementation first, then the change list, then the readouts. No preamble, no restating this brief.",
  ];

  if (iterations && iterations.trim()) {
    sections.splice(2, 0, "ITERATION NOTES (from the operator, on top of the objective):\n" + iterations.trim());
  }

  return sections.join("\n\n");
}

// The one-sentence brief handed to the prompt transformer, which rejects anything
// over 2000 characters — so the brief is compressed to fit before it is sent.
export function transformerBrief(state, prompt) {
  const chosen = pick(ALL_EDIT_ITEMS, state.capabilities);
  const type = byId(PROMPT_SYSTEM_TYPES, state.promptType);
  const head = [
    state.brief.trim() || "Improve this website",
    chosen.length ? `Capabilities: ${chosen.map((c) => c.label).join(", ")}.` : "",
    `Prompt system: ${type ? type.label : "Prompt Transform"}.`,
    benchmarkLine(state.benchmark),
    `Palette: main ${state.colors.main}, accent ${state.colors.accent}, third ${state.colors.third}, text ${state.colors.font}, background ${state.colors.background}; effect ${(byId(COLOR_EFFECTS, state.effect) || {}).label || "flat"}.`,
  ]
    .filter(Boolean)
    .join(" ");
  const budget = 1900 - head.length;
  const tail = budget > 200 ? prompt.slice(0, budget) : "";
  return tail ? `${head}\n\nFull brief:\n${tail}` : head.slice(0, 1900);
}

// A colour effect's CSS declaration string, as a React style object, so the same
// text that goes into the prompt also paints the swatch in the dropdown.
export function cssTextToStyle(css) {
  return String(css || "")
    .split(";")
    .reduce((style, declaration) => {
      const at = declaration.indexOf(":");
      if (at === -1) return style;
      const name = declaration.slice(0, at).trim();
      const value = declaration.slice(at + 1).trim();
      if (!name || !value) return style;
      const key = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      style[key] = value;
      return style;
    }, {});
}

// The visible text of a rendered artifact, so the content judge can read copy
// rather than markup.
export function artifactText(html) {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, noscript").forEach((node) => node.remove());
    return (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
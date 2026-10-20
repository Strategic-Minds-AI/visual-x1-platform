// Shared source capture: used by the browser reader, the clone intake and the
// repository/config readers, so no two places keep their own copy of the parsing rules.

export function visibleText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function allMatches(html, re) {
  const out = [];
  let m;
  const rx = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  while ((m = rx.exec(html)) !== null) {
    out.push(m);
    if (out.length > 400) break;
  }
  return out;
}

export function extractSignature(html, url) {
  const source = String(html || "");
  const titleMatch = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = source.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const canonicalMatch = source.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const viewportMatch = source.match(/<meta[^>]+name=["']viewport["']/i);
  const langMatch = source.match(/<html[^>]*lang=["']([^"']*)["']/i);
  const ogTitleMatch = source.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["']/i);

  const headingRows = allMatches(source, /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi).map((m) => ({ tag: `h${m[1]}`, text: visibleText(m[2]).slice(0, 220) })).filter((h) => h.text);
  const headings = { h1: [], h2: [], h3: [] };
  headingRows.forEach((h) => headings[h.tag].push(h.text));

  const links = allMatches(source, /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)
    .map((m) => ({ href: m[1], text: visibleText(m[2]).slice(0, 120) }))
    .filter((l) => l.text);

  const navBlock = source.match(/<nav[\s\S]*?<\/nav>/i);
  const navLinks = navBlock
    ? allMatches(navBlock[0], /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi).map((m) => visibleText(m[2])).filter(Boolean).slice(0, 20)
    : links.slice(0, 12).map((l) => l.text);

  const formBlocks = allMatches(source, /<form\b[\s\S]*?<\/form>/gi);
  const fieldNames = [];
  formBlocks.forEach((f) => {
    allMatches(f[0], /<(?:input|select|textarea)\b[^>]*>/gi).forEach((m) => {
      const nameMatch = m[0].match(/name=["']([^"']+)["']/i);
      const typeMatch = m[0].match(/type=["']([^"']+)["']/i);
      if (nameMatch && (!typeMatch || !["hidden", "submit"].includes(typeMatch[1].toLowerCase()))) fieldNames.push(nameMatch[1]);
    });
  });

  const imgTags = allMatches(source, /<img\b[^>]*>/gi).map((m) => m[0]);
  const alts = imgTags.map((t) => (t.match(/alt=["']([^"']*)["']/i) || [])[1]).filter(Boolean).slice(0, 25);

  const ctaLabels = allMatches(source, /<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi)
    .map((m) => visibleText(m[1]))
    .filter((t) => t && t.length < 46)
    .filter((t) => /call|book|get|start|quote|contact|buy|order|schedule|request|learn|try|subscribe|sign/i.test(t))
    .slice(0, 12);

  const colors = Array.from(new Set((source.match(/#[0-9a-f]{6}\b/gi) || []).map((c) => c.toLowerCase()))).slice(0, 14);
  const fonts = Array.from(new Set((source.match(/font-family\s*:\s*([^;"'}]+)/gi) || []).map((f) => f.split(":")[1].trim()))).slice(0, 8);

  const sectionCount = (source.match(/<section\b/gi) || []).length || headings.h2.length;

  return {
    url: url || "",
    status: null,
    html_length: source.length,
    title: titleMatch ? visibleText(titleMatch[1]) : ogTitleMatch ? ogTitleMatch[1] : "",
    description: descMatch ? descMatch[1].trim() : "",
    canonical: canonicalMatch ? canonicalMatch[1] : "",
    lang: langMatch ? langMatch[1] : "",
    viewport_meta: Boolean(viewportMatch),
    headings,
    heading_count: headingRows.length,
    nav_links: navLinks,
    links_count: links.length,
    links_sample: links.slice(0, 40),
    forms: { count: formBlocks.length, fields: Array.from(new Set(fieldNames)).slice(0, 20) },
    images: { count: imgTags.length, alts },
    sections_estimate: sectionCount,
    stylesheets: (source.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length,
    scripts: (source.match(/<script[^>]+src=/gi) || []).length,
    inline_style_tags: (source.match(/<style\b/gi) || []).length,
    cta_labels: ctaLabels,
    colors,
    fonts,
    text_length: visibleText(source).length
  };
}

export async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; VisualXCapture/1.0; +https://visual-x1.base44.app)",
      accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000)
  });
  const raw = await res.text();
  const headers = {};
  res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  return { status: res.status, ok: res.ok, final_url: res.url || url, html: raw.slice(0, 600000), headers };
}

// What the host itself says it is running on — the measurable half of an IP/host capture.
export function hostFingerprint(headers) {
  const h = headers || {};
  const keys = ["server", "via", "x-powered-by", "content-type", "x-vercel-id", "cf-ray", "x-cache", "cache-control", "strict-transport-security", "x-frame-options", "content-security-policy", "location"];
  const found = {};
  keys.forEach((k) => { if (h[k]) found[k] = String(h[k]).slice(0, 200); });
  return found;
}

function topLevel(path) {
  return String(path || "").split("/")[0];
}

function extensionOf(path) {
  const m = String(path || "").match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "(none)";
}

function histogram(values) {
  const counts = {};
  values.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

// A configuration is judged on its shape: which keys exist, how deep, what has to be supplied.
export function configSignature(raw) {
  const source = String(raw || "");
  const envNames = Array.from(new Set(source.match(/\b[A-Z][A-Z0-9_]{3,}\b/g) || [])).slice(0, 40);
  const trimmed = source.trim();
  let parsed = null;
  try { parsed = JSON.parse(trimmed); } catch { parsed = null; }

  if (parsed && typeof parsed === "object") {
    const paths = [];
    const walk = (node, prefix, depth) => {
      if (depth > 6 || paths.length > 400) return;
      if (Array.isArray(node)) {
        paths.push(`${prefix}[] (${node.length} items)`);
        if (node.length) walk(node[0], `${prefix}[]`, depth + 1);
        return;
      }
      if (node && typeof node === "object") {
        Object.entries(node).forEach(([k, v]) => {
          const path = prefix ? `${prefix}.${k}` : k;
          if (v && typeof v === "object") walk(v, path, depth + 1);
          else paths.push(`${path}: ${v === null ? "null" : typeof v}`);
        });
        return;
      }
      paths.push(`${prefix}: ${typeof node}`);
    };
    walk(parsed, "", 0);
    return {
      format: "json",
      bytes: source.length,
      top_level_keys: Array.isArray(parsed) ? [`(array of ${parsed.length})`] : Object.keys(parsed).slice(0, 60),
      key_paths: paths.slice(0, 200),
      key_count: paths.length,
      env_names: envNames,
      text: source.slice(0, 6000)
    };
  }

  const lines = trimmed ? trimmed.split(/\r?\n/) : [];
  const sections = lines.filter((l) => /^[A-Za-z0-9_.\- ]+:\s*$/.test(l)).map((l) => l.replace(/:$/, "").trim()).slice(0, 60);
  const assignments = lines.filter((l) => /^[\w.\-]+\s*[:=]\s*\S/.test(l)).map((l) => l.split(/[:=]/)[0].trim()).slice(0, 120);
  return {
    format: "text",
    bytes: source.length,
    line_count: lines.length,
    section_names: sections,
    key_names: assignments,
    env_names: envNames,
    text: source.slice(0, 6000)
  };
}

// A folder listing is an inventory: what exists, how deep, and what is configuration.
export function folderSignature(raw) {
  const paths = String(raw || "").split(/\r?\n/).map((l) => l.replace(/^[\s|+\-\\]+/, "").trim()).filter(Boolean);
  const files = paths.filter((p) => p.includes(".") && !p.endsWith("/"));
  const dirs = paths.filter((p) => p.endsWith("/") || !p.includes("."));
  const notable = files.filter((p) => /(^|\/)(package\.json|vercel\.json|next\.config|docker-compose|Dockerfile|\.env|requirements\.txt|pyproject\.toml|tsconfig|vite\.config|composer\.json|Gemfile|\.github)/i.test(p));
  return {
    entry_count: paths.length,
    file_count: files.length,
    dir_count: dirs.length,
    max_depth: paths.reduce((max, p) => Math.max(max, p.split("/").length), 0),
    top_level: Array.from(new Set(paths.map(topLevel))).slice(0, 40),
    extensions: histogram(files.map(extensionOf)),
    notable_files: notable.slice(0, 40),
    sample_paths: paths.slice(0, 120)
  };
}

// A repository is a system: stack, structure, configuration surface, entry points.
export function repoSignature(meta, entries, files) {
  const list = Array.isArray(entries) ? entries : [];
  const filePaths = list.map((e) => e.path).filter(Boolean);
  const configFiles = filePaths.filter((p) => /(^|\/)(package\.json|vercel\.json|next\.config\.[jt]s|vite\.config\.[jt]s|docker-compose\.ya?ml|Dockerfile|tsconfig\.json|\.env\.example|requirements\.txt|pyproject\.toml|composer\.json|Gemfile)$/i.test(p));
  const manifests = Object.keys(files || {});
  const pkgRaw = (files || {})["package.json"] || "";
  let deps = {};
  let scripts = {};
  try {
    const pkg = JSON.parse(pkgRaw);
    deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    scripts = pkg.scripts || {};
  } catch { deps = {}; }

  const depNames = Object.keys(deps);
  const frameworks = [];
  const detect = (needle, label) => { if (depNames.includes(needle) || filePaths.some((p) => p.includes(needle))) frameworks.push(label); };
  detect("next", "Next.js");
  detect("react", "React");
  detect("vite", "Vite");
  detect("vue", "Vue");
  detect("svelte", "Svelte");
  detect("express", "Express");
  detect("fastapi", "FastAPI");
  detect("django", "Django");
  detect("tailwindcss", "Tailwind CSS");
  detect("prisma", "Prisma");
  detect("@base44/sdk", "Base44 SDK");
  if (configFiles.some((p) => /vercel\.json$/.test(p))) frameworks.push("Vercel configuration present");
  if (configFiles.some((p) => /docker-compose|Dockerfile/i.test(p))) frameworks.push("Containerised");
  if (filePaths.some((p) => p.startsWith(".github/workflows/"))) frameworks.push("GitHub Actions CI");

  return {
    full_name: meta?.full_name || "",
    description: meta?.description || "",
    primary_language: meta?.language || "",
    default_branch: meta?.default_branch || "",
    stars: meta?.stargazers_count || 0,
    license: meta?.license?.spdx_id || "",
    file_count: filePaths.length,
    top_level: Array.from(new Set(filePaths.map(topLevel))).slice(0, 40),
    extensions: histogram(filePaths.map(extensionOf)),
    frameworks,
    dependencies: depNames.slice(0, 80),
    entry_scripts: scripts,
    config_files: configFiles.slice(0, 40),
    manifests,
    sample_paths: filePaths.slice(0, 120)
  };
}

// A document is a written system: its own headings and sections are the structure.
export function documentSignature(raw) {
  const source = String(raw || "");
  const headings = allMatches(source, /^(#{1,4})\s+(.+)$/gm).map((m) => `${"#".repeat(m[1].length)} ${m[2].trim()}`).slice(0, 60);
  const numbered = allMatches(source, /^\s*(\d+[.)]\s+.+)$/gm).map((m) => m[1].trim()).slice(0, 60);
  const tables = (source.match(/^\|.+\|$/gm) || []).length;
  return {
    bytes: source.length,
    line_count: source.split(/\r?\n/).length,
    headings,
    numbered_steps: numbered,
    table_rows: tables,
    text: source.slice(0, 12000)
  };
}

export async function fetchJson(url, headers) {
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "VisualXCapture/1.0", ...(headers || {}) },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

function decodeBase64(b64) {
  try {
    const clean = String(b64 || "").replace(/\s/g, "");
    return new TextDecoder().decode(Uint8Array.from(atob(clean), (ch) => ch.charCodeAt(0)));
  } catch {
    return "";
  }
}

// Reads a repository. Given an access token it reads through the authenticated GitHub
// API, so a private repository is readable; without one it reads the public API only
// and says so rather than reporting the repository as empty.
export async function fetchRepo(repoUrl, accessToken) {
  const m = String(repoUrl || "").match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+)/i);
  if (!m) throw new Error("Only a github.com repository URL (owner/repo) can be read.");
  const owner = m[1];
  const repo = m[2].replace(/\.git$/i, "");
  const auth = accessToken ? { authorization: `Bearer ${accessToken}` } : {};
  const meta = await fetchJson(`https://api.github.com/repos/${owner}/${repo}`, auth);
  const branch = meta.default_branch || "main";
  let entries = [];
  try {
    const tree = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, auth);
    entries = (tree.tree || []).filter((e) => e.type === "blob").slice(0, 600).map((e) => ({ path: e.path, size: e.size }));
  } catch {
    entries = [];
  }
  const keyNames = ["README.md", "readme.md", "package.json", "vercel.json", "next.config.js", "vite.config.js", "docker-compose.yml", "Dockerfile", "requirements.txt", "pyproject.toml", ".env.example"];
  const files = {};
  for (const key of keyNames) {
    if (!entries.some((e) => e.path === key) && key !== "package.json") continue;
    try {
      if (accessToken) {
        const content = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/contents/${key}?ref=${encodeURIComponent(branch)}`, auth);
        if (content?.content) files[key] = decodeBase64(content.content).slice(0, 8000);
      } else {
        const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${key}`, { signal: AbortSignal.timeout(12000) });
        if (raw.ok) files[key] = (await raw.text()).slice(0, 8000);
      }
    } catch { /* a missing manifest is not a capture failure */ }
  }
  return { owner, repo, branch, meta, entries, files, authenticated: Boolean(accessToken) };
}
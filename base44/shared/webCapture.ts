// Shared page capture: used by the browser reader and by the clone intake, so both
// read a page the same way and neither keeps its own copy of the parsing rules.

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
  return { status: res.status, ok: res.ok, final_url: res.url || url, html: raw.slice(0, 600000) };
}
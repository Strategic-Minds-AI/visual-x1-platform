// One implementation of "keywords x locations -> programmatic URL structures", shared by
// buildProgrammaticStructure (the operator mapping the template engine offers) and massLaunch
// (the wave orchestrator). Kept here so the two can never drift apart.

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const titleCase = (value) =>
  String(value || '')
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');

// Words too generic to identify a service on their own.
const GENERIC_TOKENS = [
  'emergency',
  'repair',
  'service',
  'services',
  'near',
  'local',
  'best',
  'cost',
  'price',
  'cheap',
  'company',
  'contractor',
  'installation',
  'replacement',
  'same',
];

const OPPORTUNITY_FIELDS = ['nearme_domain', 'nearyou_domain', 'service_intent', 'vertical', 'funnel_type', 'benchmark_cpl'];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function queryOpportunity(base44, scoped, pattern) {
  const client = scoped ? base44.entities : base44.asServiceRole.entities;
  try {
    const { items } = await client.LeadOpportunity.filter(
      {
        is_active: true,
        $or: [
          { service_intent: { $regex: pattern, $options: 'i' } },
          { vertical: { $regex: pattern, $options: 'i' } },
          { nearme_domain: { $regex: pattern, $options: 'i' } },
        ],
      },
      { limit: 1, fields: OPPORTUNITY_FIELDS }
    );
    return items && items.length ? items[0] : null;
  } catch {
    return null;
  }
}

// Prefer a match on the full service phrase; only fall back to a single distinctive word.
async function findOpportunity(base44, scoped, term) {
  const words = String(term || '')
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 3);
  if (words.length === 0) return null;

  if (words.length > 1) {
    const phraseMatch = await queryOpportunity(base44, scoped, words.map(escapeRegex).join('.*'));
    if (phraseMatch) return phraseMatch;
  }

  const distinctive = words
    .filter((word) => !GENERIC_TOKENS.includes(word))
    .sort((a, b) => b.length - a.length);

  for (const word of distinctive) {
    const match = await queryOpportunity(base44, scoped, escapeRegex(word));
    if (match) return match;
  }
  return null;
}

// An uploaded layout may be a bare array of sections or an object wrapping one.
const toSections = (parsed) => {
  const raw = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray(parsed.sections)
      ? parsed.sections
      : [];
  return raw
    .map((entry) => {
      if (typeof entry === 'string') return { section: entry, components: [] };
      if (!entry || typeof entry !== 'object') return null;
      const name = entry.section || entry.name || entry.role || '';
      if (!name) return null;
      return {
        section: String(name),
        components: Array.isArray(entry.components) ? entry.components.map(String) : [],
      };
    })
    .filter(Boolean);
};

export const parseSections = (json) => {
  if (!json) return [];
  try {
    return toSections(JSON.parse(json));
  } catch {
    return [];
  }
};

// Reads the layout the user uploaded, so an uploaded file drives the mapping too.
async function loadSectionsFromFile(base44, fileUri) {
  try {
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
    const res = await fetch(signed_url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    return toSections(JSON.parse(await res.text()));
  } catch {
    return [];
  }
}

// The layout drives section order: inline JSON first, else the uploaded layout file.
export async function loadLayout(base44, template) {
  if (!template) return { sections: [], source: 'none' };
  const inline = parseSections(template.layout_json);
  if (inline.length) return { sections: inline, source: 'inline' };
  if (template.layout_file_uri) {
    const fromFile = await loadSectionsFromFile(base44, template.layout_file_uri);
    if (fromFile.length) return { sections: fromFile, source: 'file' };
  }
  return { sections: [], source: 'none' };
}

export async function buildStructures(base44, options) {
  const { template, pattern, strategy, funnel, scoped = true } = options;
  // A campaign can map its pages onto the client's own site (the GEO leg) instead of the
  // paired lead-generation domains.
  const siteUrl = String(options.siteUrl || '').trim().replace(/\/+$/, '');

  const rawKeywords = Array.isArray(options.keywords)
    ? options.keywords
    : String(options.keywords || (template && template.keywords) || '').split(',');
  const keywords = rawKeywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 15);

  // Locations are separated by ";" or a newline, never by a comma: "Miami, FL" is one
  // location, and splitting it on the comma produced a junk /us/fl/ page.
  const rawLocations = Array.isArray(options.locations)
    ? options.locations
    : String(options.locations || '').split(/[;\n]/);
  const locations = rawLocations.map((l) => String(l).trim()).filter(Boolean).slice(0, 10);

  const urlPattern = pattern || (template && template.url_pattern) || '/{region}/{city}/{service}/';
  const domainStrategy = strategy || (template && template.domain_strategy) || 'both';
  const funnelType = funnel || (template && template.funnel_type) || 'quote_request';

  const layout = await loadLayout(base44, template);

  // Look up matching lead opportunities in small concurrent batches (never one await per item).
  const opportunities = [];
  for (let i = 0; i < keywords.length; i += 6) {
    const chunk = keywords.slice(i, i + 6);
    const settled = await Promise.allSettled(chunk.map((keyword) => findOpportunity(base44, scoped, keyword)));
    settled.forEach((result) => opportunities.push(result.status === 'fulfilled' ? result.value : null));
  }

  const locationList = locations.length ? locations : [''];
  const structures = [];

  keywords.forEach((keyword, index) => {
    const opportunity = opportunities[index];
    const service = slugify(keyword) || 'service';
    const domainSlug = service.replace(/-/g, '');
    const nearmeDomain = (opportunity && opportunity.nearme_domain) || `${domainSlug}nearme.com`;
    const nearyouDomain = (opportunity && opportunity.nearyou_domain) || `${domainSlug}nearyou.com`;

    locationList.forEach((location) => {
      const parts = location.split(',').map((part) => part.trim());
      const city = parts[0] || '';
      const region = parts[1] || '';

      const path = location
        ? urlPattern
            .replace('{country}', 'us')
            .replace('{region}', slugify(region) || 'us')
            .replace('{city}', slugify(city) || 'local')
            .replace('{service}', service)
            .replace(/\/{2,}/g, '/')
        : `/${service}/`;

      const place = city ? `${titleCase(city)}${region ? ', ' + region : ''}` : 'Your Area';

      structures.push({
        template_id: (template && template.id) || null,
        keyword,
        location,
        service,
        place,
        title: `${titleCase(keyword)} in ${place} | Verified Local Pros`,
        h1: `Find a Trusted ${titleCase(keyword)} in ${place}`,
        nearme_domain: nearmeDomain,
        nearyou_domain: nearyouDomain,
        site_url: siteUrl ? `${siteUrl}${path}` : '',
        site_path: siteUrl ? path : '',
        nearme_url: siteUrl || domainStrategy === 'nearyou' ? '' : `https://${nearmeDomain}${path}`,
        nearyou_url: siteUrl || domainStrategy === 'nearme' ? '' : `https://${nearyouDomain}${path}`,
        funnel_type: funnelType,
        layout_source: layout.source,
        layout_sections: layout.sections.map((s) => s.section),
        layout_component_count: layout.sections.reduce((total, s) => total + s.components.length, 0),
        matched_vertical: (opportunity && opportunity.vertical) || null,
        benchmark_cpl: (opportunity && opportunity.benchmark_cpl) || null,
      });
    });
  });

  return { structures, keywords, locations };
}
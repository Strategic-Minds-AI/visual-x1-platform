import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const slugify = (value) =>
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

async function queryOpportunity(base44, pattern) {
  try {
    const { items } = await base44.entities.LeadOpportunity.filter(
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
async function findOpportunity(base44, term) {
  const words = String(term || '')
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 3);
  if (words.length === 0) return null;

  if (words.length > 1) {
    const phraseMatch = await queryOpportunity(base44, words.map(escapeRegex).join('.*'));
    if (phraseMatch) return phraseMatch;
  }

  const distinctive = words
    .filter((word) => !GENERIC_TOKENS.includes(word))
    .sort((a, b) => b.length - a.length);

  for (const word of distinctive) {
    const match = await queryOpportunity(base44, escapeRegex(word));
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

const parseSections = (json) => {
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

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    let template = null;
    if (body.template_id) {
      template = await base44.entities.SEOTemplate.get(body.template_id).catch(() => null);
    }

    const rawKeywords = Array.isArray(body.keywords)
      ? body.keywords
      : String(body.keywords || (template && template.keywords) || '').split(',');
    const keywords = rawKeywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 15);
    if (keywords.length === 0) {
      return Response.json({ error: 'At least one keyword is required' }, { status: 400 });
    }

    const rawLocations = Array.isArray(body.locations)
      ? body.locations
      : String(body.locations || '').split(',');
    const locations = rawLocations.map((l) => String(l).trim()).filter(Boolean).slice(0, 10);

    const pattern = (template && template.url_pattern) || body.url_pattern || '/{region}/{city}/{service}/';
    const strategy = body.domain_strategy || (template && template.domain_strategy) || 'both';
    const funnel = (template && template.funnel_type) || 'quote_request';

    // The layout drives section order: inline JSON first, else the uploaded layout file.
    let layoutSections = [];
    let layoutSource = 'none';
    if (template) {
      layoutSections = parseSections(template.layout_json);
      if (layoutSections.length) {
        layoutSource = 'inline';
      } else if (template.layout_file_uri) {
        layoutSections = await loadSectionsFromFile(base44, template.layout_file_uri);
        if (layoutSections.length) layoutSource = 'file';
      }
    }

    // Look up matching lead opportunities in small concurrent batches (never one await per item).
    const opportunities = [];
    for (let i = 0; i < keywords.length; i += 6) {
      const chunk = keywords.slice(i, i + 6);
      const settled = await Promise.allSettled(chunk.map((keyword) => findOpportunity(base44, keyword)));
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
          ? pattern
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
          nearme_url: strategy === 'nearyou' ? '' : `https://${nearmeDomain}${path}`,
          nearyou_url: strategy === 'nearme' ? '' : `https://${nearyouDomain}${path}`,
          funnel_type: funnel,
          layout_source: layoutSource,
          layout_sections: layoutSections.map((s) => s.section),
          layout_component_count: layoutSections.reduce((total, s) => total + s.components.length, 0),
          matched_vertical: (opportunity && opportunity.vertical) || null,
          benchmark_cpl: (opportunity && opportunity.benchmark_cpl) || null,
        });
      });
    });

    return Response.json({ structures, count: structures.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
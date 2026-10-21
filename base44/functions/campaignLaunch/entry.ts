import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildBacklinkPlan } from '../../shared/backlinks.ts';

// The campaign command: one execution that puts a client's SEO and GEO campaign into the
// world in three linked legs — the site content that ranks, the backlink plan that feeds it,
// and the local search registration that measures it. Each leg reports what it actually did
// and what is still gated. Nothing here claims a page is live.

const GSC_API = 'https://www.googleapis.com/webmasters/v3';
const MAX_LOCATIONS = 8;
const MAX_KEYWORDS = 6;
const MAX_STRUCTURES = 25;
const MAX_BACKLINKS = 60;

const toArray = (value) =>
  (Array.isArray(value) ? value : String(value || '').split(/[;\n]/)).map((item) => String(item).trim()).filter(Boolean);

const hostOf = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');

// A property is either a URL prefix or an sc-domain: entry covering the whole host.
const propertyHost = (siteUrl) => {
  const raw = String(siteUrl || '').trim().toLowerCase().replace(/\/+$/, '');
  if (raw.startsWith('sc-domain:')) return raw.slice('sc-domain:'.length);
  return raw.replace(/^https?:\/\//, '').replace(/^www\./, '');
};

// The local leg's registration: the metros this campaign targets become tracked launch
// locations, so the next wave and the local reporting both know where it is fighting.
async function registerLocations(base44, locations, site, clientName) {
  const { items: existing } = await base44.asServiceRole.entities.LaunchLocation.filter(
    {},
    { limit: 300, fields: ['metro', 'rank'] }
  );
  const known = new Set((existing || []).map((row) => String(row.metro || '').trim().toLowerCase()));
  let nextRank = (existing || []).reduce((top, row) => Math.max(top, Number(row.rank) || 0), 0) + 1;

  const created = [];
  for (const metro of locations.slice(0, MAX_LOCATIONS)) {
    if (known.has(metro.toLowerCase())) continue;
    created.push({
      metro,
      priority: 'High',
      rank: nextRank,
      status: 'piloting',
      rationale: `${clientName} campaign on ${site}: in the launch wave, validated before scaling.`,
      validation_rule: 'Validate Search Console impressions and local conversions before adding the next wave.',
      is_active: true,
    });
    nextRank += 1;
  }
  if (created.length) await base44.asServiceRole.entities.LaunchLocation.bulkCreate(created);

  return {
    metros: locations.slice(0, MAX_LOCATIONS),
    locations_created: created.length,
    locations_already_tracked: locations.slice(0, MAX_LOCATIONS).length - created.length,
  };
}

// Whether the campaign's site is actually measurable: a Search Console property the
// connected account can read, and whether it is verified.
async function localSearchReadiness(base44, site) {
  const host = hostOf(site);
  try {
    const connection = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const token = connection && connection.accessToken ? connection.accessToken : null;
    if (!token) {
      return { connected: false, verified: false, reason: 'Google Search Console is not connected, so this campaign cannot be measured locally yet.' };
    }

    const res = await fetch(`${GSC_API}/sites`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return { connected: true, verified: false, reason: `Search Console answered ${res.status} for the property list, so readiness could not be read.` };
    }
    const data = await res.json();
    const match = (data.siteEntry || []).find((entry) => {
      const property = propertyHost(entry.siteUrl);
      return property && (host === property || host.endsWith(`.${property}`));
    });
    if (!match) {
      return {
        connected: true,
        property: null,
        verified: false,
        reason: `${host} is not a Search Console property on the connected account, so no local performance can be read for it until it is added and verified.`,
      };
    }

    const verified = match.permissionLevel !== 'siteUnverifiedUser';
    let sitemaps = null;
    try {
      const sm = await fetch(`${GSC_API}/sites/${encodeURIComponent(match.siteUrl)}/sitemaps`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      });
      if (sm.ok) {
        const list = await sm.json();
        sitemaps = (list.sitemap || []).length;
      }
    } catch {
      sitemaps = null;
    }

    return {
      connected: true,
      property: match.siteUrl,
      permission: match.permissionLevel,
      verified,
      sitemaps,
      reason: verified
        ? 'Search Console is verified for this site, so the local leg can be measured here.'
        : 'The property is granted but unverified, which limits the data it returns.',
    };
  } catch (error) {
    return { connected: false, verified: false, reason: error.message };
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only an administrator can launch a campaign.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const clientName = String(body.client_name || 'Strategic Minds AI').trim().slice(0, 120);
    const site = String(body.site_url || '').trim().replace(/\/+$/, '');
    if (!/^https?:\/\/[\w.-]+\.[a-z]{2,}/i.test(site)) {
      return Response.json({
        ok: false,
        reason: 'A campaign needs the client site it is optimising, for example https://strategicmindsai.com.',
      });
    }
    const deploy = body.deploy === true;
    const waveSize = Math.min(Math.max(Number(body.wave_size) || 12, 1), MAX_STRUCTURES);

    const { items: templates } = await base44.asServiceRole.entities.SEOTemplate.filter(
      { is_active: true },
      { sort: '-created_date', limit: 1 }
    );
    const template = (templates && templates[0]) || null;
    if (!template) {
      return Response.json({ ok: false, reason: 'No active layout template exists yet, so there is no structure to generate from.' });
    }

    const keywords = (
      Array.isArray(body.keywords) ? body.keywords : String(body.keywords || template.keywords || '').split(',')
    )
      .map((k) => String(k).trim())
      .filter(Boolean)
      .slice(0, MAX_KEYWORDS);
    if (!keywords.length) {
      return Response.json({ ok: false, reason: 'This campaign has no keyword to target. Add keywords to the layout, or name them here.' });
    }

    let locations = toArray(body.locations).slice(0, MAX_LOCATIONS);
    if (!locations.length) {
      const { items: metros } = await base44.asServiceRole.entities.LaunchLocation.filter(
        { is_active: true },
        { sort: 'rank', limit: 40, fields: ['metro'] }
      );
      locations = (metros || []).map((m) => m.metro).filter(Boolean).slice(0, 4);
    }
    if (!locations.length) {
      return Response.json({ ok: false, reason: 'No launch location exists yet, so there is nowhere to launch to.' });
    }

    // Leg 1 — site content. The wave writer is reused rather than reimplemented, so a campaign
    // and a hand-run wave produce identical page records.
    let content = { ok: false, reason: 'The wave writer did not answer.' };
    try {
      const res = await base44.functions.invoke('massLaunch', {
        action: 'launch',
        template_id: template.id,
        keywords,
        locations,
        site_url: site,
        wave_size: waveSize,
        deploy,
      });
      content = (res && res.data) || content;
    } catch (error) {
      content = { ok: false, reason: error.message };
    }

    // Leg 2 — backlink strategy: the plan that feeds those pages, on the same wave batch.
    let backlinks = { created: 0, capped: false };
    try {
      const { records, capped } = buildBacklinkPlan({
        industry: template.industry || clientName,
        keywords,
        locations,
        backlinkUrl: `${site}/`,
        batchId: content.batch_id || '',
        limit: MAX_BACKLINKS,
      });
      if (records.length) await base44.asServiceRole.entities.BacklinkSite.bulkCreate(records);
      backlinks = {
        created: records.length,
        capped,
        backlink_url: `${site}/`,
        site_types: [...new Set(records.map((row) => row.site_type))],
      };
    } catch (error) {
      backlinks = { created: 0, capped: false, error: error.message };
    }

    // Leg 3 — local search: register where the campaign fights, then confirm the local
    // measurement is wired for this site.
    const local = await registerLocations(base44, locations, site, clientName);
    const readiness = await localSearchReadiness(base44, site);

    const next = [];
    if (content.ok !== true) next.push(content.reason || 'The content wave did not run.');
    if (content.deploy_note) next.push(content.deploy_note);
    if (!readiness.verified) next.push(readiness.reason);
    if (backlinks.capped) next.push('The backlink plan reached its per-run limit; run the campaign again for the next batch of sites.');

    const receipt = {
      ok: content.ok === true,
      client: clientName,
      site,
      at: new Date().toISOString(),
      template: { id: template.id, name: template.name, industry: template.industry || null },
      site_content: {
        ok: content.ok === true,
        batch_id: content.batch_id || null,
        structures: content.structures || 0,
        pages_created: content.pages_created || 0,
        keywords: content.keywords || keywords,
        locations: content.locations || locations,
        deployment: content.deployment || null,
        deploy_note: content.deploy_note || null,
        sample_urls: content.sample_urls || [],
        reason: content.reason || null,
      },
      backlink_strategy: backlinks,
      local_search: { ...local, ...readiness },
      next,
      method:
        'Three legs run in one pass: pages are generated as records on the client site, a backlink plan is written against the same batch, and the metros are registered with a live read of whether Search Console can measure the site. A dispatched deployment builds asynchronously and is not proof that anything is live.',
    };

    await base44.asServiceRole.entities.AuditLog.create({
      action: 'campaign_launch',
      target: `FactoryBatch:${content.batch_id || '—'}`,
      detail: JSON.stringify(receipt).slice(0, 1800),
    }).catch(() => null);

    return Response.json(receipt);
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
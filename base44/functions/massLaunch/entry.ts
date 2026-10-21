import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildStructures } from '../../shared/programmatic.ts';

// The mass-launch orchestrator: it reads real Search Console performance for every page a
// wave has shipped, and turns the keywords that are already ranking into the next wave of
// programmatic pages. It records what it created and dispatches a deployment; it never
// claims a page is live.

const GSC_API = 'https://www.googleapis.com/webmasters/v3';
const WINDOW_DAYS = 28;
const MAX_WAVE = 25;
const MAX_PAGES = 200;

const dayOffset = (offsetDays) => new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);

// "https://www.Example.com/miami-fl/" and "example.com/miami-fl" have to be comparable.
const normalizeUrl = (value) =>
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

const siteForUrl = (sites, url) => {
  const host = normalizeUrl(url).split('/')[0];
  if (!host) return null;
  let best = null;
  for (const site of sites) {
    const property = propertyHost(site.siteUrl);
    if (!property) continue;
    if (host === property || host.endsWith(`.${property}`)) {
      if (!best || property.length > propertyHost(best.siteUrl).length) best = site;
    }
  }
  return best;
};

const searchConsoleToken = async (base44) => {
  const connection = await base44.asServiceRole.connectors.getConnection('google_search_console');
  return connection && connection.accessToken ? connection.accessToken : null;
};

const gscGet = async (token, path, timeout = 15000) => {
  const res = await fetch(`${GSC_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`Search Console returned ${res.status} for ${path}`);
  return res.json();
};

// One request per property for the whole window: rows arrive per page and query, and are
// folded into one measurement per page here. Never one request per page.
const measureProperty = async (token, siteUrl) => {
  const res = await fetch(`${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: dayOffset(WINDOW_DAYS),
      endDate: dayOffset(0),
      dimensions: ['page', 'query'],
      rowLimit: 500,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Search Console returned ${res.status} for the performance of ${siteUrl}`);
  const data = await res.json();

  const pages = new Map();
  for (const row of data.rows || []) {
    const page = normalizeUrl((row.keys || [])[0]);
    if (!page) continue;
    const query = (row.keys || [])[1] || '';
    const impressions = Number(row.impressions || 0);
    const current = pages.get(page) || { clicks: 0, impressions: 0, positionWeight: 0, topQuery: '', topImpressions: -1 };
    current.clicks += Number(row.clicks || 0);
    current.impressions += impressions;
    current.positionWeight += Number(row.position || 0) * impressions;
    if (impressions > current.topImpressions) {
      current.topImpressions = impressions;
      current.topQuery = query;
    }
    pages.set(page, current);
  }
  return pages;
};

const sitemapHealth = async (token, siteUrl) => {
  try {
    const data = await gscGet(token, `/sites/${encodeURIComponent(siteUrl)}/sitemaps`);
    return (data.sitemap || []).map((entry) => ({
      path: entry.path || '',
      last_downloaded: entry.lastDownloaded || null,
      errors: Number(entry.errors || 0),
      warnings: Number(entry.warnings || 0),
      submitted: (entry.contents || []).reduce((total, c) => total + Number(c.submitted || 0), 0),
    }));
  } catch (error) {
    return [{ path: '—', error: error.message }];
  }
};

async function monitor(base44) {
  let token = null;
  try {
    token = await searchConsoleToken(base44);
  } catch {
    token = null;
  }
  if (!token) {
    return { ok: false, not_connected: true, reason: 'Google Search Console is not connected, so no performance can be read.', pages_updated: 0 };
  }

  const sites = (await gscGet(token, '/sites')).siteEntry?.map((s) => ({ siteUrl: s.siteUrl, permission: s.permissionLevel })) || [];
  if (!sites.length) {
    return { ok: false, reason: 'The connected Google account has no Search Console property yet.', pages_updated: 0 };
  }

  const [variantsPage, variationsPage] = await Promise.all([
    base44.asServiceRole.entities.SEOVariant.filter({}, { limit: MAX_PAGES, sort: '-created_date' }),
    base44.asServiceRole.entities.SiteVariation.filter({}, { limit: MAX_PAGES, sort: '-created_date' }),
  ]);

  const tracked = [
    ...(variantsPage.items || []).filter((v) => v.url).map((v) => ({ entity: 'SEOVariant', id: v.id, url: v.url })),
    ...(variationsPage.items || []).filter((v) => v.url).map((v) => ({ entity: 'SiteVariation', id: v.id, url: v.url })),
  ];
  if (!tracked.length) {
    return { ok: true, pages_updated: 0, reason: 'No launched page carries a URL yet, so there is nothing to measure.' };
  }

  // Group by property so each one costs a single request.
  const byProperty = new Map();
  for (const item of tracked) {
    const site = siteForUrl(sites, item.url);
    if (!site) continue;
    const bucket = byProperty.get(site.siteUrl) || { site, items: [] };
    bucket.items.push(item);
    byProperty.set(site.siteUrl, bucket);
  }

  const measured = new Map();
  const failures = [];
  const sitemaps = [];
  const buckets = [...byProperty.values()];
  for (let i = 0; i < buckets.length; i += 4) {
    const chunk = buckets.slice(i, i + 4);
    const settled = await Promise.allSettled(
      chunk.map(async (bucket) => ({
        siteUrl: bucket.site.siteUrl,
        pages: await measureProperty(token, bucket.site.siteUrl),
        sitemaps: await sitemapHealth(token, bucket.site.siteUrl),
      }))
    );
    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        measured.set(result.value.siteUrl, result.value.pages);
        sitemaps.push(...result.value.sitemaps.map((entry) => ({ ...entry, property: result.value.siteUrl })));
      } else {
        failures.push({ property: chunk[index].site.siteUrl, error: result.reason?.message || 'The performance read failed.' });
      }
    });
  }

  const now = new Date().toISOString();
  const updates = { SEOVariant: [], SiteVariation: [] };
  let unmatched = 0;
  let matched = 0;

  for (const item of tracked) {
    const site = siteForUrl(sites, item.url);
    if (!site) {
      unmatched += 1;
      continue;
    }
    const pages = measured.get(site.siteUrl);
    const found = pages && pages.get(normalizeUrl(item.url));
    if (!found) {
      unmatched += 1;
      continue;
    }
    matched += 1;
    updates[item.entity].push({
      id: item.id,
      gsc_site: site.siteUrl,
      impressions: Math.round(found.impressions),
      clicks: Math.round(found.clicks),
      ctr: found.impressions > 0 ? Math.round((found.clicks / found.impressions) * 1000) / 10 : 0,
      avg_position: found.impressions > 0 ? Math.round((found.positionWeight / found.impressions) * 10) / 10 : 0,
      top_query: found.topQuery || '',
      last_gsc_at: now,
    });
  }

  for (const [entity, rows] of Object.entries(updates)) {
    if (!rows.length) continue;
    const client = base44.asServiceRole.entities[entity];
    for (let i = 0; i < rows.length; i += 100) {
      await client.bulkUpdate(rows.slice(i, i + 100));
    }
  }

  const pagesUpdated = updates.SEOVariant.length + updates.SiteVariation.length;
  await base44.asServiceRole.entities.AuditLog.create({
    action: 'monitor',
    target: 'massLaunch',
    detail: `Search Console read for ${byProperty.size} propert${byProperty.size === 1 ? 'y' : 'ies'}: ${matched} page${matched === 1 ? '' : 's'} matched, ${pagesUpdated} record${pagesUpdated === 1 ? '' : 's'} updated.`,
  }).catch(() => null);

  return {
    ok: true,
    window_days: WINDOW_DAYS,
    properties_read: byProperty.size,
    pages_updated: pagesUpdated,
    pages_matched: matched,
    pages_unmatched: unmatched,
    sitemaps,
    failures,
    method: 'Read from Google Search Console for the connected account. A page with no impressions in the window is matched but reported as zero, not as ranking.',
  };
}

async function createWave(base44, { template, structures, note, deploy, winningKeywords, waveSize }) {
  const trimmed = structures.slice(0, Math.min(MAX_WAVE, waveSize || MAX_WAVE));
  if (!trimmed.length) return { ok: false, reason: 'No structure was produced, so no wave was created.' };

  const batch = await base44.asServiceRole.entities.FactoryBatch.create({
    sentence: `Mass launch — ${template.name}${winningKeywords.length ? ` (expanded from ${winningKeywords.join(', ')})` : ''}`.slice(0, 240),
    industry: template.industry || 'local services',
    status: 'planning',
    current_step: 'wave_planned',
    target_variant_count: trimmed.length,
  });

  const records = [];
  trimmed.forEach((structure, index) => {
    const rows = [
      { url: structure.nearme_url, content: structure.title },
      { url: structure.nearyou_url, content: structure.h1 },
    ].filter((row) => row.url);
    rows.forEach((row) => {
      records.push({
        batch_id: batch.id,
        variant_number: index + 1,
        target_keyword: structure.keyword,
        target_location: structure.location,
        content: row.content,
        status: 'generated',
        url: row.url,
        funnel_type: structure.funnel_type,
      });
    });
  });

  let created = 0;
  for (let i = 0; i < records.length; i += 100) {
    const written = await base44.asServiceRole.entities.SEOVariant.bulkCreate(records.slice(i, i + 100));
    created += Array.isArray(written) ? written.length : records.slice(i, i + 100).length;
  }

  // Deployment is one action per project, not one per URL: every page in the wave is served
  // by the same build.
  let deployment = null;
  let deployError = null;
  let deployNote = 'No Vercel project is bound to this template, so the wave is queued and not dispatched.';
  if (deploy && template.vercel_project) {
    try {
      const res = await base44.functions.invoke('vercelConsole', {
        action: 'deploy',
        project: template.vercel_project,
        ref: template.deploy_branch || '',
      });
      const data = res?.data || {};
      if (data.ok) {
        deployment = data.deployment || null;
        deployNote = 'Vercel accepted the deployment. It builds asynchronously; this is not proof that it is live.';
      } else {
        deployError = data.error || 'Vercel refused the deployment request.';
        deployNote = deployError;
      }
    } catch (error) {
      deployError = error.message;
      deployNote = error.message;
    }
  }

  await base44.asServiceRole.entities.FactoryBatch.update(batch.id, {
    status: deployError ? 'needs_refinement' : 'ready',
    current_step: deployment ? 'deploy_dispatched' : 'wave_planned',
    created_variants: created,
    validation_result: JSON.stringify({
      provider: template.vercel_project ? 'vercel' : null,
      project: template.vercel_project || null,
      branch: template.deploy_branch || null,
      deployment,
      error: deployError,
      note: deployNote,
    }),
    error_message: deployError || '',
  });

  await base44.asServiceRole.entities.AuditLog.create({
    action: 'launch_wave',
    target: `FactoryBatch:${batch.id}`,
    detail: `${note}: ${trimmed.length} structure${trimmed.length === 1 ? '' : 's'}, ${created} page record${created === 1 ? '' : 's'}. ${deployNote}`.slice(0, 900),
  }).catch(() => null);

  return {
    ok: true,
    batch_id: batch.id,
    structures: trimmed.length,
    pages_created: created,
    keywords: [...new Set(trimmed.map((s) => s.keyword))],
    locations: [...new Set(trimmed.map((s) => s.location).filter(Boolean))],
    deployment,
    deploy_error: deployError,
    deploy_note: deployNote,
    sample_urls: trimmed.slice(0, 5).map((s) => s.nearme_url || s.nearyou_url),
    method: 'Pages are recorded and one deployment is dispatched for the project that serves them. Nothing here claims a page is live until the deployment and the pages are verified.',
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only an administrator can run the mass-launch orchestrator.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'monitor');

    if (action === 'monitor') {
      return Response.json(await monitor(base44));
    }

    let template = null;
    if (body.template_id) {
      template = await base44.asServiceRole.entities.SEOTemplate.get(body.template_id).catch(() => null);
    }
    // A scheduled run names no template, so it expands the system's most recent active
    // layout: the one the operator last put into production.
    if (!template) {
      const { items } = await base44.asServiceRole.entities.SEOTemplate.filter(
        { is_active: true },
        { sort: '-created_date', limit: 1 }
      );
      template = (items && items[0]) || null;
    }
    if (!template) {
      return Response.json({ ok: false, error: 'Which template should this wave launch from?' }, { status: 400 });
    }

    const waveSize = Math.min(Math.max(Number(body.wave_size) || 12, 1), MAX_WAVE);
    const deploy = body.deploy !== false;

    if (action === 'launch') {
      // Metros come from the seeded launch list unless the operator names locations.
      // "Miami, FL" is one location: locations are separated by ";" or a newline.
      let locations = (Array.isArray(body.locations) ? body.locations : String(body.locations || '').split(/[;\n]/)).map((l) => String(l).trim()).filter(Boolean);
      if (!locations.length) {
        const { items: metros } = await base44.asServiceRole.entities.LaunchLocation.filter(
          { is_active: true },
          { sort: 'rank', limit: 40, fields: ['metro', 'rank'] }
        );
        locations = (metros || []).map((m) => m.metro).filter(Boolean).slice(0, 5);
      }
      if (!locations.length) {
        return Response.json({ ok: false, reason: 'No launch location is seeded yet, so there is nowhere to launch to.' });
      }

      const keywords = (Array.isArray(body.keywords) ? body.keywords : String(body.keywords || template.keywords || '').split(','))
        .map((k) => String(k).trim())
        .filter(Boolean);
      const { structures } = await buildStructures(base44, {
        template,
        keywords,
        locations,
        pattern: template.url_pattern,
        strategy: template.domain_strategy,
        funnel: template.funnel_type,
        scoped: false,
      });

      const wave = await createWave(base44, {
        template,
        structures,
        note: `Launched the first wave for ${template.name}`,
        deploy,
        winningKeywords: [],
        waveSize,
      });
      return Response.json(wave);
    }

    if (action === 'expand') {
      // Only pages that actually earned impressions, and rank well enough to repeat, drive a wave.
      const { items: measured } = await base44.asServiceRole.entities.SEOVariant.filter(
        { impressions: { $gt: 0 } },
        { limit: 100, sort: '-impressions' }
      );
      const winners = (measured || []).filter((v) => (v.avg_position || 0) > 0 && v.avg_position <= 20);
      if (!winners.length) {
        return Response.json({
          ok: false,
          winners: 0,
          reason: 'No tracked page has ranking Search Console data yet, so there is no keyword to expand from.',
        });
      }

      const keywords = [...new Set(winners.map((v) => v.target_keyword).filter(Boolean))].slice(0, 5);

      const { items: existing } = await base44.asServiceRole.entities.SEOVariant.filter({}, { limit: 200, fields: ['target_location'] });
      const used = new Set((existing || []).map((v) => String(v.target_location || '').trim().toLowerCase()).filter(Boolean));

      const { items: metros } = await base44.asServiceRole.entities.LaunchLocation.filter(
        { is_active: true },
        { sort: 'rank', limit: 60, fields: ['metro', 'rank'] }
      );
      const candidates = (metros || [])
        .map((m) => m.metro)
        .filter((metro) => metro && !used.has(String(metro).trim().toLowerCase()));

      const perKeyword = Math.max(1, Math.floor(waveSize / keywords.length));
      const locations = candidates.slice(0, perKeyword);
      if (!locations.length) {
        return Response.json({
          ok: false,
          winners: winners.length,
          keywords,
          reason: 'Every seeded launch metro has already been used for these keywords. Add locations before expanding again.',
        });
      }

      const { structures } = await buildStructures(base44, {
        template,
        keywords,
        locations,
        pattern: template.url_pattern,
        strategy: template.domain_strategy,
        funnel: template.funnel_type,
        scoped: false,
      });

      const wave = await createWave(base44, {
        template,
        structures,
        note: `Expanded ${template.name} from ${winners.length} ranking page${winners.length === 1 ? '' : 's'}`,
        deploy,
        winningKeywords: keywords,
        waveSize,
      });
      return Response.json({ ...wave, winners: winners.length, source_keywords: keywords });
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
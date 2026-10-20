import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_RUN = 1000;
const CHUNK = 400;
const SITE_TYPES = ['directory', 'blog_post', 'local_page', 'review_site', 'comparison_page', 'landing_page'];
const TARGET_DA = {
  review_site: 70, directory: 60, comparison_page: 45, blog_post: 40, local_page: 35, landing_page: 30,
};

const toList = (value) => {
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  return raw.map((i) => String(i).trim()).filter(Boolean);
};

const slug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 28);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const industry = String(body.industry || '').trim();
    const count = Math.min(Math.max(1, Number(body.count) || 300), MAX_RUN);
    const backlinkUrl = String(body.backlink_url || '').trim();
    const templateIds = Array.isArray(body.template_ids) ? body.template_ids.filter(Boolean).slice(0, 30) : [];
    const locations = toList(body.locations).slice(0, 25);

    if (!industry) return Response.json({ error: 'An industry is required' }, { status: 400 });

    const { items: templates } = await base44.entities.SEOTemplate.filter(
      templateIds.length ? { id: { $in: templateIds } } : { is_active: true },
      { limit: 30, sort: '-created_date' }
    );
    if (!templates.length) {
      return Response.json({ error: 'Create at least one SEO template first — that is what maps to the new domains.' }, { status: 400 });
    }

    const places = locations.length ? locations : [''];
    const records = [];
    const domains = new Set();
    let stopped = false;

    for (const template of templates) {
      const keywords = toList(template.keywords).slice(0, 40);
      const variants = template.domain_strategy === 'nearme' ? ['nearme']
        : template.domain_strategy === 'nearyou' ? ['nearyou'] : ['nearme', 'nearyou'];

      for (const keyword of keywords) {
        for (const variant of variants) {
          const domain = `${slug(keyword) || 'service'}${variant}.com`;
          domains.add(domain);
          for (const place of places) {
            if (records.length >= count) { stopped = true; break; }
            const siteType = SITE_TYPES[records.length % SITE_TYPES.length];
            records.push({
              batch_id: '',
              industry,
              site_type: siteType,
              target_keyword: keyword,
              target_location: place,
              seo_template_id: template.id,
              target_domain: domain,
              status: 'pending',
              domain_authority: TARGET_DA[siteType] || 40,
              backlink_url: backlinkUrl,
              content: `${siteType.replace(/_/g, ' ')} for "${keyword}"${place ? ` in ${place}` : ''} mapped from template "${template.name}" onto ${domain} (${template.funnel_type || 'quote_request'} funnel).`,
              health_status: 'unknown',
            });
          }
          if (stopped) break;
        }
        if (stopped) break;
      }
      if (stopped) break;
    }

    if (!records.length) {
      return Response.json({ error: 'The selected templates have no keywords to map. Add keywords to a template first.' }, { status: 400 });
    }

    const batch = await base44.entities.FactoryBatch.create({
      sentence: String(body.batch_name || '').trim() || `Bulk queue: ${records.length} backlink sites for ${industry}`,
      industry,
      status: 'generating',
      current_step: 'sites_queued',
      target_variant_count: records.length,
      target_backlink_count: records.length,
      created_backlinks: records.length,
      created_variants: 0,
      repair_round: 0,
      quality_score: 0,
      spec_score: 0,
      rendered: false,
      html_length: 0,
    });

    const withBatch = records.map((r) => ({ ...r, batch_id: batch.id }));
    for (let i = 0; i < withBatch.length; i += CHUNK) {
      await base44.entities.BacklinkSite.bulkCreate(withBatch.slice(i, i + CHUNK));
    }

    await base44.entities.AuditLog.create({
      entity_type: 'factory_batch',
      entity_id: batch.id,
      action: 'create',
      user_email: user.email,
      details: `Bulk queue created ${withBatch.length} backlink sites from ${templates.length} template(s) across ${domains.size} domain(s)`,
      severity: 'info',
    });

    return Response.json({
      batch_id: batch.id,
      created: withBatch.length,
      domains: [...domains].slice(0, 60),
      domain_count: domains.size,
      templates_used: templates.map((t) => ({ id: t.id, name: t.name })),
      capped: withBatch.length >= MAX_RUN,
      message: withBatch.length >= MAX_RUN
        ? `Queued ${withBatch.length} sites — that is the ${MAX_RUN}-per-run limit. Run again for the next slice.`
        : `Queued ${withBatch.length} sites across ${domains.size} domain(s).`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
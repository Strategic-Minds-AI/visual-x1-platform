import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_PER_RUN = 200;

const SITE_TYPES = ['directory', 'blog_post', 'local_page', 'review_site', 'comparison_page', 'landing_page'];

const TARGET_DA = {
  review_site: 70,
  directory: 60,
  comparison_page: 45,
  blog_post: 40,
  local_page: 35,
  landing_page: 30,
};

const toList = (value) => {
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  return raw.map((item) => String(item).trim()).filter(Boolean);
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const industry = String(body.industry || '').trim();
    const keywords = toList(body.keywords).slice(0, 40);
    const locations = toList(body.locations).slice(0, 20);

    if (!industry) return Response.json({ error: 'An industry is required' }, { status: 400 });
    if (!keywords.length) return Response.json({ error: 'At least one keyword is required' }, { status: 400 });

    const backlinkUrl = String(body.backlink_url || '').trim();
    const batchId = String(body.batch_id || '');
    const places = locations.length ? locations : [''];

    const records = [];
    let capped = false;
    for (const keyword of keywords) {
      for (const location of places) {
        if (records.length >= MAX_PER_RUN) {
          capped = true;
          break;
        }
        const siteType = SITE_TYPES[records.length % SITE_TYPES.length];
        records.push({
          batch_id: batchId,
          industry,
          site_type: siteType,
          target_keyword: keyword,
          target_location: location,
          status: 'pending',
          domain_authority: TARGET_DA[siteType] || 40,
          backlink_url: backlinkUrl,
          content: `${siteType.replace(/_/g, ' ')} targeting "${keyword}" in ${location || 'the national market'}.`,
          health_status: 'unknown',
        });
      }
      if (capped) break;
    }

    await base44.entities.BacklinkSite.bulkCreate(records);

    return Response.json({
      created: records.length,
      capped,
      message: capped
        ? `Created ${records.length} sites — the run limit. Generate again for the next batch.`
        : `Created ${records.length} backlink sites.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
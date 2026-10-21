// One implementation of "keywords x locations -> backlink site plan", shared by
// generateBacklinkSites (the operator's backlink tool) and campaignLaunch (the campaign
// orchestrator). Kept here so the two can never drift apart.

export const MAX_BACKLINK_SITES = 200;

export const SITE_TYPES = ['directory', 'blog_post', 'local_page', 'review_site', 'comparison_page', 'landing_page'];

const TARGET_DA = {
  review_site: 70,
  directory: 60,
  comparison_page: 45,
  blog_post: 40,
  local_page: 35,
  landing_page: 30,
};

export const toList = (value) => {
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  return raw.map((item) => String(item).trim()).filter(Boolean);
};

// The plan rotates through site types so a single keyword does not produce six directories,
// and it stays inside the run limit rather than silently truncating.
export function buildBacklinkPlan({ industry, keywords, locations, backlinkUrl, batchId, limit = MAX_BACKLINK_SITES }) {
  const keywordList = toList(keywords).slice(0, 40);
  const placeList = toList(locations).slice(0, 20);
  const places = placeList.length ? placeList : [''];

  const records = [];
  let capped = false;
  for (const keyword of keywordList) {
    for (const location of places) {
      if (records.length >= limit) {
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

  return { records, capped };
}
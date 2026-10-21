import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildBacklinkPlan, toList } from '../../shared/backlinks.ts';

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

    const { records, capped } = buildBacklinkPlan({
      industry,
      keywords,
      locations,
      backlinkUrl: String(body.backlink_url || '').trim(),
      batchId: String(body.batch_id || ''),
    });

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
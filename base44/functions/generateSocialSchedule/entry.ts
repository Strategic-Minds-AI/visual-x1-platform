import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    posts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day_index: { type: 'number' },
          platform: { type: 'string' },
          post_type: { type: 'string' },
          hook: { type: 'string' },
          caption: { type: 'string' },
          hashtags: { type: 'string' },
          cta: { type: 'string' },
          image_prompt: { type: 'string' },
          angle: { type: 'string' }
        },
        required: ['day_index', 'platform', 'caption']
      }
    }
  },
  required: ['posts']
};

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'x', 'tiktok', 'youtube_shorts', 'google_business'];
const POST_TYPES = ['educational', 'proof', 'offer', 'story', 'seo_article', 'faq', 'behind_the_scenes', 'testimonial', 'update'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const clientId = String(body.client_id || '').trim();
    if (!clientId) return Response.json({ error: 'Pick the client profile this schedule is for.' }, { status: 400 });

    const client = await base44.entities.ClientIntake.get(clientId);
    if (!client) return Response.json({ error: 'Client profile not found.' }, { status: 404 });

    const requested = Array.isArray(body.platforms) ? body.platforms.filter((p) => PLATFORMS.includes(p)) : [];
    const platforms = requested.length ? requested : ['instagram', 'facebook', 'linkedin'];
    const days = Math.min(Math.max(Number(body.days) || 30, 7), 30);
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.start_date || '')) ? String(body.start_date) : new Date().toISOString().slice(0, 10);
    const campaignName = String(body.campaign_name || '').trim() || `${client.company_name} — ${days}-day schedule`;

    // What this schedule is drafted from: the SEO strategy it has to serve, plus the
    // business context and any updates the operator supplied.
    const templates = await base44.entities.SEOTemplate.filter({ $or: [{ industry: client.industry }, { is_active: true }] }, { sort: '-updated_date', limit: 12 });
    const playbooks = await base44.entities.StrategyPlaybook.filter({ is_active: true }, { limit: 25 });
    const reports = await base44.entities.DiscoveryReport.filter({ intake_id: clientId }, { sort: '-generated_at', limit: 1 });
    const report = reports.items?.[0] || null;

    const seoTargets = (templates.items || []).map((t) => ({
      name: t.name,
      industry: t.industry,
      keywords: t.keywords,
      url_pattern: t.url_pattern,
      funnel_type: t.funnel_type
    }));
    const strategyNames = (playbooks.items || []).map((p) => `${p.name} (${p.category})`);

    const business = {
      company_name: client.company_name,
      industry: client.industry,
      primary_services: client.primary_services,
      service_area: client.service_area,
      tagline: client.tagline,
      brand_voice: client.brand_voice,
      seed_sentence: client.seed_sentence,
      vision_statement: client.vision_statement,
      desired_outcomes: client.desired_outcomes,
      pain_points: client.pain_points,
      website_url: client.website_url
    };
    const updates = String(body.business_updates || '').trim();

    const prompt = `You are the content lead for ${client.company_name}. Draft a ${days}-day social schedule that is staged and ready for the operator to approve.

THE BUSINESS:
${JSON.stringify(business, null, 2)}

THE SEO STRATEGY THIS SCHEDULE HAS TO SERVE:
${JSON.stringify(seoTargets, null, 2)}

STRATEGIES ALREADY IN PLAY:
${strategyNames.join(', ') || 'none recorded'}

RECENT DISCOVERY (what the market research found):
${report ? `${report.summary || ''}\nNiche openings: ${report.niches_json || ''}`.slice(0, 3000) : 'No discovery report has been generated for this client yet.'}

BUSINESS UPDATES THE OPERATOR SUPPLIED:
${updates || 'None supplied, so draft from the business record and the SEO strategy only.'}

Rules:
- Produce exactly ${days} posts, day_index 1 through ${days}, one per day. Rotate the platforms across: ${platforms.join(', ')}.
- Every post must earn its place: mix post_type across ${POST_TYPES.join(', ')}, weighted towards the services and locations this business actually sells, and towards the SEO keywords above.
- caption is the finished post body, written in the brand voice, ready to publish. 2 to 5 short lines. No hashtags inside the caption.
- hook is the first line, written to stop the scroll. It must not repeat the caption's first line word for word.
- hashtags is a comma-separated set of 5 to 12 tags mixing local, service and niche tags drawn from the SEO keywords and service area.
- cta is one clear action, matching the funnel type of the strategy where one applies.
- image_prompt is a complete image-generation prompt for the visual: subject, medium, composition, lighting, palette.
- angle states which SEO target or business update this post serves, so the operator can see the strategy behind it.
- Never invent customer names, review scores, awards, certifications, prices, guarantees or job numbers. Where a proof point is needed and none is recorded, write the post so it asks for or describes the proof rather than fabricating it.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: PLAN_SCHEMA });
    const plan = typeof llm === 'string' ? JSON.parse(llm) : llm;
    const posts = (plan?.posts || []).slice(0, days);
    if (!posts.length) return Response.json({ error: 'No posts were drafted. Try again, or add services and a service area to the client profile first.' }, { status: 200 });

    const start = new Date(`${startDate}T00:00:00Z`);
    const rows = posts.map((post, i) => {
      const dayIndex = Number(post.day_index) > 0 ? Math.min(Number(post.day_index), days) : i + 1;
      const when = new Date(start.getTime() + (dayIndex - 1) * 86400000);
      return {
        client_id: clientId,
        campaign_name: campaignName,
        day_index: dayIndex,
        scheduled_date: when.toISOString().slice(0, 10),
        platform: PLATFORMS.includes(post.platform) ? post.platform : platforms[i % platforms.length],
        post_type: POST_TYPES.includes(post.post_type) ? post.post_type : 'educational',
        hook: String(post.hook || '').slice(0, 400),
        caption: String(post.caption || ''),
        hashtags: String(post.hashtags || ''),
        cta: String(post.cta || '').slice(0, 300),
        image_prompt: String(post.image_prompt || ''),
        source_refs_json: JSON.stringify({
          angle: String(post.angle || ''),
          seo_targets: seoTargets.map((t) => t.name).slice(0, 6),
          business_updates_used: updates ? true : false,
          discovery_report_id: report?.id || null
        }),
        status: 'staged'
      };
    });

    const created = await base44.entities.SocialPost.bulkCreate(rows);

    return Response.json({
      created: Array.isArray(created) ? created.length : rows.length,
      campaign_name: campaignName,
      start_date: startDate,
      days,
      seo_sources: seoTargets.map((t) => t.name),
      used_discovery: Boolean(report),
      used_business_updates: Boolean(updates),
      posts: Array.isArray(created) ? created : rows
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
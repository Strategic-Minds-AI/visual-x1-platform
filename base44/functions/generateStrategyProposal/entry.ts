import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Turns the normalized discovery plus the client's own answers into a multi-option strategy
// proposal across three horizons, with the system's own recommendation and modeled ranges.
// The ranges come from the same deterministic engine the Growth Simulator uses, so the
// assumptions and disclaimers travel with them.
const ENGINE_VERSION = '1.0.0';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const parse = (v, fallback) => {
  try { const p = JSON.parse(v || ''); return p == null ? fallback : p; } catch { return fallback; }
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const intakeId = String(body.intake_id || '');
    const reportId = String(body.report_id || '');
    if (!intakeId) return Response.json({ error: 'An intake id is required' }, { status: 400 });

    const intake = await base44.entities.ClientIntake.get(intakeId);
    if (!intake) return Response.json({ error: 'That intake was not found' }, { status: 404 });

    let report = null;
    if (reportId) report = await base44.entities.DiscoveryReport.get(reportId).catch(() => null);
    if (!report && intake.discovery_report_id) {
      report = await base44.entities.DiscoveryReport.get(intake.discovery_report_id).catch(() => null);
    }

    let competitors = { items: [] };
    if (report) {
      competitors = await base44.entities.CompetitorProfile.filter({ report_id: report.id }, { sort: '-composite_score', limit: 5 });
      // Reports generated before the report_id stamp existed still link their competitors by intake.
      if (!(competitors.items || []).length) {
        competitors = await base44.entities.CompetitorProfile.filter({ intake_id: intakeId }, { sort: '-composite_score', limit: 5 });
      }
    }

    const field = (competitors.items || []).map((c) => ({
      name: c.name,
      composite: num(c.composite_score),
      visual: num(c.visual_score),
      trust: num(c.trust_score),
      offer: num(c.offer_score),
      conversion: num(c.conversion_score),
      content: num(c.content_score),
      price_signals: parse(c.price_signals_json, []),
      negative_themes: parse(c.negative_themes_json, []),
    }));

    const industry = intake.industry || report?.industry || 'local services';
    const location = [intake.city, intake.state].filter(Boolean).join(', ') || intake.service_area || 'the local market';
    const benchmark = parse(report?.dominant_benchmark_json, {});
    const niches = parse(report?.niches_json, []);
    const pricing = parse(report?.pricing_json, []);
    const customer = parse(report?.customer_json, {});
    const complaints = parse(report?.complaint_themes_json, []);
    const counter = parse(report?.counter_strategy_json, {});
    const business = parse(report?.business_snapshot_json, {});
    const selectedTools = Array.isArray(intake.selected_tools) ? intake.selected_tools.slice(0, 40) : [];

    // Run the existing deterministic engine so the proposal carries modeled ranges, not claims.
    const { items: strategyItems } = await base44.entities.StrategyPlaybook.filter(
      { is_active: true }, { sort: 'display_order', limit: 200 }
    );
    const strategies = (strategyItems || []).filter((s) => s.default_on !== false).map((s) => ({
      id: s.id, name: s.name, category: s.category, tier: s.tier, impact: s.impact,
      velocity: s.velocity, engagement_lift: s.engagement_lift, authority_lift: s.authority_lift, cost_tier: s.cost_tier,
    }));

    const profile = {
      industry,
      target_keyword: `${(intake.primary_services || industry).split(',')[0].trim()} near me`,
      city: location,
      domain_age_months: 2,
      site_pages: 10,
      images_per_page: 4,
      content_quality: 65,
      page_speed: 70,
      hook: intake.desired_outcomes || intake.vision_statement || '',
      hook_strength: 58,
      promo: 'none',
      funnel_type: 'quote_request',
      funnel_strength: 58,
      monthly_ad_spend: num(intake.monthly_budget) > 0 ? Math.round(num(intake.monthly_budget) * 0.4) : 0,
      articles_count: 0,
      videos_count: 0,
      networking_events: 0,
      reviews_count: num(business.review_count),
      backlink_count: 0,
      social_posts_per_week: 0,
      content_judged: false,
    };

    let prediction = null;
    try {
      const sim = await base44.functions.invoke('simulateSeoGrowth', {
        profile,
        strategies,
        catalog: strategies,
        seed: 42,
      });
      prediction = sim?.data || null;
    } catch (e) {
      prediction = { error: `Prediction engine did not run: ${e.message}` };
    }

    const prompt = `You are the strategy lead at an agency that builds AI-operated websites, marketing systems and automations for local and service businesses. You are writing the strategy proposal a client will read after their discovery report.

CLIENT
Name: ${intake.full_name}
Business: ${intake.company_name}
Industry: ${industry}
Location and service area: ${location}
Website today: ${intake.website_url || 'none provided'}
Business stage: ${intake.business_stage || 'existing_business'}
Services they say they sell: ${intake.primary_services || 'not stated'}
What they dislike about the business today: ${intake.pain_points || 'not stated'}
What they want more of: ${intake.desired_outcomes || 'not stated'}
Their vision of a website operating AI system: ${intake.ideal_system_vision || intake.vision_statement || 'not stated'}
Locked goal: ${intake.goal_kind || 'leads'} of ${num(intake.goal_value)} by ${intake.goal_horizon || '12m'}
Monthly budget they will commit: ${num(intake.monthly_budget) ? `$${num(intake.monthly_budget)}` : 'not stated'}
Automations they selected during onboarding: ${selectedTools.length ? selectedTools.join(', ') : 'none selected'}
Their own added processes: ${intake.custom_tools || 'none'}

DISCOVERY (already researched, use it and do not contradict it)
Competitive field, strongest first: ${JSON.stringify(field)}
Recurring public complaints about the field: ${JSON.stringify(complaints)}
Uncovered areas and niches found: ${JSON.stringify(niches)}
Observed industry price ranges: ${JSON.stringify(pricing)}
Ideal customer found for this trade: ${JSON.stringify(customer)}
Counter strategy already derived: ${JSON.stringify(counter)}
Dominant benchmark to beat (per dimension, from the best competitor found plus margin): ${JSON.stringify(benchmark)}

WHAT TO PRODUCE
Three complete strategy options — one short horizon, one mid horizon, one long horizon — that a real operator could run. For each option cover, concretely:
- positioning and the single promise the business leads with
- naming strategy and URL strategy, including the NearMe and NearYou domain system and how the two work together
- SEO, AEO and GEO strategy (what gets published, in what order, and what it is meant to win)
- the marketing and advertising budget split by channel at their stated budget level, with the monthly low and high
- visual frontend strategy and backend/automation strategy
- agent strategy: which agents operate what, and what is autonomous versus approved
- the website capabilities the option requires
- pricing and offer model for the client's own customers
- the ideal client demographics, typical income, buying power and buying habits they should aim at
- the 30-day content plan shape, channels and formats
- the launch moves, in order
- the risks and what would make the option fail

Then 3 to 5 launch variants (A, B, C, D, E) that could run at the same time and be compared against each other, each with the thing it tests and why it might win.

Then a keyword strategy: primary, secondary, long-tail phrases, the questions to answer for AEO, and the geographic targets for GEO.

Then ONE recommendation: the single option you would run first and recommend, with who does it, what exactly gets built, when each stage starts, where it runs, and why that option beats the others for THIS client given their budget, stage and goal.

GROUND RULES
- Every number you propose must be a range with the reasoning attached, and you must never promise a result. Write ranges as planning estimates.
- Do not invent facts about the client, their competitors or their market. Use what is above; where something is missing, say which input would sharpen it.
- Prefer specifics an operator can act on Monday over general advice.
Return JSON only.`;

    const proposal = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendation: {
            type: 'object',
            properties: {
              option_id: { type: 'string' },
              who: { type: 'string' },
              what: { type: 'string' },
              when: { type: 'string' },
              where: { type: 'string' },
              why: { type: 'string' },
              why_not_others: { type: 'string' },
            },
            required: ['who', 'what', 'when', 'where', 'why'],
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                horizon: { type: 'string' },
                label: { type: 'string' },
                summary: { type: 'string' },
                positioning: { type: 'string' },
                naming_strategy: { type: 'string' },
                url_strategy: { type: 'string' },
                nearme_nearyou_strategy: { type: 'string' },
                seo_aeo_geo_strategy: { type: 'string' },
                budget: {
                  type: 'object',
                  properties: {
                    monthly_low: { type: 'number' },
                    monthly_high: { type: 'number' },
                    allocation: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['monthly_low', 'monthly_high'],
                },
                visual_frontend_strategy: { type: 'string' },
                backend_strategy: { type: 'string' },
                agent_strategy: { type: 'string' },
                website_capabilities: { type: 'array', items: { type: 'string' } },
                pricing_model: { type: 'string' },
                ideal_client: {
                  type: 'object',
                  properties: {
                    demographics: { type: 'string' },
                    typical_income: { type: 'string' },
                    buying_power: { type: 'string' },
                    buying_habits: { type: 'string' },
                  },
                  required: ['demographics'],
                },
                content_plan: { type: 'string' },
                launch_moves: { type: 'array', items: { type: 'string' } },
                risks: { type: 'array', items: { type: 'string' } },
              },
              required: ['horizon', 'label', 'summary', 'positioning', 'pricing_model'],
            },
          },
          launch_variants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                positioning: { type: 'string' },
                tests: { type: 'string' },
                why_it_might_win: { type: 'string' },
              },
              required: ['label', 'tests'],
            },
          },
          keyword_strategy: {
            type: 'object',
            properties: {
              primary: { type: 'array', items: { type: 'string' } },
              secondary: { type: 'array', items: { type: 'string' } },
              long_tail_phrases: { type: 'array', items: { type: 'string' } },
              aeo_questions: { type: 'array', items: { type: 'string' } },
              geo_targets: { type: 'array', items: { type: 'string' } },
            },
            required: ['primary'],
          },
          content_system: {
            type: 'object',
            properties: {
              pillars: { type: 'array', items: { type: 'string' } },
              cadence: { type: 'string' },
              formats: { type: 'array', items: { type: 'string' } },
            },
            required: ['pillars'],
          },
          data_requests: { type: 'array', items: { type: 'string' } },
        },
        required: ['recommendation', 'options', 'keyword_strategy'],
      },
    });

    const options = Array.isArray(proposal?.options) ? proposal.options : [];
    const recId = proposal?.recommendation?.option_id;
    const recommended = options.find((o) => o.id === recId) || options[0] || null;

    const predictionBlock = prediction && !prediction.error ? {
      days_to_page1: prediction.days_to_page1,
      ranges: prediction.ranges,
      totals: prediction.totals,
      timeline: prediction.timeline,
      confidence: prediction.confidence,
      data_gaps: prediction.data_gaps,
      assumptions: prediction.assumptions,
      disclaimer: prediction.disclaimer,
      engine_version: prediction.engine_version,
    } : { unavailable: true, reason: prediction?.error || 'Prediction engine returned nothing.' };

    const saved = await base44.entities.DiscoveryReport.update(report.id, {
      proposal_json: JSON.stringify({
        ...proposal,
        recommended_option_id: recommended?.id || null,
        generated_at: new Date().toISOString(),
        engine_version: ENGINE_VERSION,
      }),
      prediction_json: JSON.stringify(predictionBlock),
    });

    await base44.entities.AuditLog.create({
      entity_type: 'discovery_report',
      entity_id: report.id,
      action: 'update',
      user_email: user.email,
      details: `Strategy proposal generated for ${intake.company_name}: ${options.length} horizon options, ${(proposal?.launch_variants || []).length} launch variants, recommendation ${recommended?.label || 'n/a'}.`,
      severity: 'info',
    });

    return Response.json({
      report_id: report.id,
      proposal,
      recommended_option: recommended,
      prediction: predictionBlock,
      options_count: options.length,
      engine_version: ENGINE_VERSION,
      note: 'Every figure in the proposal is a modeled planning range with its reasoning attached. Nothing here is a guaranteed outcome.',
      saved_report: saved,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
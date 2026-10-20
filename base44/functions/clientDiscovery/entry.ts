import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { experimental_evaluate as evaluate } from 'npm:ai@7.0.105';
import { createTypeSafeAi } from 'npm:@ai-sdk/typesafe-ai@3.0.4';

// The discovery engine. Three web-grounded research calls run in parallel, then each competitor
// is scored on a fixed rubric by a separate evaluation model, then the deterministic layer
// builds the benchmark targets, the gaps and the counter strategy from what came back.
//
// Rules the research must follow, because a client package goes out with this in it:
// - only public information, and every claim carries a source URL
// - a fact that was not found is left empty, never filled with a plausible-sounding guess
// - scores come from the rubric model, never from the research call that found the facts

const ENGINE_VERSION = '1.0.0';

const RUBRICS = {
  visual_professionalism: [
    'No usable site or unreachable',
    'Outdated or template-broken; poor mobile rendering',
    'Functional but generic; dated visuals, weak hierarchy',
    'Clean and current; consistent brand, adequate mobile',
    'Strong visual system; clear hierarchy, credible imagery, fast',
    'Best-in-class frontend: distinctive, fast, flawless on mobile',
  ],
  trust_and_proof: [
    'No proof of any kind visible',
    'Claims only, no reviews, no credentials',
    'Some reviews or credentials, inconsistently shown',
    'Reviews and credentials visible, moderate volume',
    'Strong review volume with credentials, licensing and guarantees',
    'Overwhelming social proof: volume, recency, verified credentials and guarantees',
  ],
  offer_clarity: [
    'No offer stated',
    'Services listed with no price or promise',
    'Offers exist but vague; pricing undiscoverable',
    'Clear services, some pricing or estimate guidance',
    'Clear packaged offers with stated price bands and guarantees',
    'Offer architecture beats the market: tiers, transparent pricing, guarantees, risk reversal',
  ],
  conversion_readiness: [
    'No way to contact or convert',
    'Contact form only, buried',
    'Click-to-call or form present, weak placement',
    'Multiple obvious conversion paths, some friction',
    'Fast, mobile-first paths to call, book or quote with follow-up',
    'Frictionless multi-path conversion with instant response and scheduling',
  ],
  content_depth: [
    'No content',
    'A few thin pages',
    'Core service pages only, no depth',
    'Service plus location pages, some FAQs',
    'Deep service, location and question coverage with structured answers',
    'Exhaustive topical coverage that owns the question space',
  ],
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const strList = (v, cap = 12) => (Array.isArray(v) ? v : []).filter(Boolean).map((x) => String(x).slice(0, 220)).slice(0, cap);
const uniq = (arr) => [...new Set(arr.map((x) => String(x).trim().toLowerCase()).filter(Boolean))];
const round = (v) => Math.round(v);

const SOURCE_RULES = `Non-negotiable rules:
- Use only publicly available information (their own site, public profiles, public directories, public review platforms, public filings or listings).
- Never fabricate. If a fact was not found, return null for a single value or an empty array for a list. Never estimate silently.
- Every entry in source_urls must be a real URL you actually used. If you could not verify, leave the list short.
- Mark anything inferred rather than observed by starting the string with "inferred:".
Return JSON only.`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const intakeId = String(body.intake_id || '');
    if (!intakeId) return Response.json({ error: 'An intake id is required' }, { status: 400 });

    const intake = await base44.entities.ClientIntake.get(intakeId);
    if (!intake) return Response.json({ error: 'That intake was not found' }, { status: 404 });

    const radius = clamp(num(body.radius_miles, 75), 10, 150);
    const innerRadius = clamp(num(body.inner_radius_miles, 25), 1, radius);
    const location = [intake.city, intake.state].filter(Boolean).join(', ') || intake.service_area || 'the client\'s service area';
    const industry = intake.industry || 'local services';
    const company = intake.company_name || intake.full_name;

    await base44.entities.ClientIntake.update(intakeId, { status: 'researching' });

    const invoke = (prompt, schema) => base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt, response_json_schema: schema, add_context_from_internet: true, model: 'gemini_3_8_flash',
    });

    const businessSchema = {
      type: 'object',
      properties: {
        business: {
          type: 'object',
          properties: {
            legal_name: { type: 'string' },
            website_url: { type: 'string' },
            public_summary: { type: 'string' },
            years_in_business: { type: 'string' },
            services: { type: 'array', items: { type: 'string' } },
            service_area: { type: 'string' },
            positioning: { type: 'string' },
            trust_signals: { type: 'array', items: { type: 'string' } },
            review_rating: { type: 'number' },
            review_count: { type: 'number' },
            review_platforms: { type: 'array', items: { type: 'string' } },
            social_profiles: { type: 'array', items: { type: 'string' } },
            website_signals: { type: 'array', items: { type: 'string' } },
            observed_gaps: { type: 'array', items: { type: 'string' } },
            contact_surfaces: { type: 'array', items: { type: 'string' } },
          },
          required: ['legal_name', 'public_summary'],
        },
        evidence_notes: { type: 'array', items: { type: 'string' } },
        source_urls: { type: 'array', items: { type: 'string' } },
      },
      required: ['business'],
    };

    const competitorSchema = {
      type: 'object',
      properties: {
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              distance_miles: { type: 'number' },
              positioning: { type: 'string' },
              price_signals: { type: 'array', items: { type: 'string' } },
              review_rating: { type: 'number' },
              review_count: { type: 'number' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              negative_themes: { type: 'array', items: { type: 'string' } },
              skip_trace: { type: 'array', items: { type: 'string' } },
              source_urls: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'url'],
          },
        },
        directory_sources: { type: 'array', items: { type: 'string' } },
      },
      required: ['competitors'],
    };

    const industrySchema = {
      type: 'object',
      properties: {
        services_offered: { type: 'array', items: { type: 'string' } },
        products: { type: 'array', items: { type: 'string' } },
        highest_demand_services: { type: 'array', items: { type: 'string' } },
        typical_price_ranges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              low: { type: 'number' },
              high: { type: 'number' },
              unit: { type: 'string' },
              note: { type: 'string' },
            },
            required: ['service'],
          },
        },
        ideal_customer: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            archetypes: { type: 'array', items: { type: 'string' } },
            typical_income_band: { type: 'string' },
            buying_power: { type: 'string' },
            buying_habits: { type: 'array', items: { type: 'string' } },
            decision_triggers: { type: 'array', items: { type: 'string' } },
          },
          required: ['description'],
        },
        seasonality: { type: 'array', items: { type: 'string' } },
        compliance_notes: { type: 'array', items: { type: 'string' } },
        niches_and_open_areas: { type: 'array', items: { type: 'string' } },
        sources: { type: 'array', items: { type: 'string' } },
      },
      required: ['services_offered', 'ideal_customer'],
    };

    const [businessRes, competitorRes, industryRes] = await Promise.allSettled([
      invoke(`Research the public presence of this business. Business name: "${company}". Website: "${intake.website_url || 'not provided'}". Location: "${location}". Industry: "${industry}". Services the client says they sell: "${intake.primary_services || 'not stated'}".

Find their public identity, positioning, service list, service area, trust signals, public review rating and count, where those reviews live, their public social profiles, what their website shows (blog, reviews, booking, structured data, mobile and speed observations), the gaps you can observe in their public presence, and the contact surfaces they expose.
${SOURCE_RULES}`, businessSchema),

      invoke(`Identify the strongest local competitors for a ${industry} business located in or near ${location}.

Find the top 5 that a buyer in that market would realistically compare. For each: name, website, city and state, approximate distance from ${location} in miles, how they position themselves, any public price or offer signals (quote prices, service call fees, financing, "free estimate", membership plans), their public review rating and review count, their observed strengths, their observed weaknesses, the recurring complaint and negative-review themes buyers raise about them, any public skip-trace details you can verify (published phone, email, street address, hours, licence numbers), and the source URLs.

Prefer competitors within ${radius} miles. If a genuinely dominant player sits just outside that radius, include them and say so in the positioning. Rank the strongest first. Return no more than 5 competitors.
${SOURCE_RULES}`, competitorSchema),

      invoke(`Build the market picture for the ${industry} industry in ${location} (United States).

Give me: every service and product typically sold in this industry; which of those see the most demand; typical price ranges buyers pay with the unit (per job, per hour, per month, per project) and a note on what moves the price; the ideal customer profile (description, buyer archetypes, typical household or business income band, buying power, buying habits, and the triggers that make them buy now); seasonality; anything in this trade that carries licensing, insurance or compliance obligations a website should state; and the niches, sub-services or customer segments that most operators in this trade are NOT covering well.
Base the price ranges on publicly published prices, published industry cost guides or public estimates, and say so in the note. Mark inferred values with "inferred:".
${SOURCE_RULES}`, industrySchema),
    ]);

    const settled = (r, fallback) => (r.status === 'fulfilled' && r.value && typeof r.value === 'object' ? r.value : fallback);
    const businessPayload = settled(businessRes, {});
    const competitorPayload = settled(competitorRes, {});
    const industryPayload = settled(industryRes, {});
    const business = businessPayload.business || {};
    const rawCompetitors = Array.isArray(competitorPayload.competitors) ? competitorPayload.competitors.slice(0, 5) : [];
    const callErrors = [businessRes, competitorRes, industryRes]
      .map((r, i) => (r.status === 'rejected' ? `${['business', 'competitors', 'industry'][i]} research failed: ${r.reason?.message || 'unknown error'}` : null))
      .filter(Boolean);

    // Rubric scoring: one isolated evaluation per competitor so one bad site cannot move another.
    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection({ provider: 'typesafe' });
    const typesafe = createTypeSafeAi({ baseURL, apiKey: token, headers });

    const scoreCompetitor = async (c) => {
      const questions = {};
      Object.keys(RUBRICS).forEach((key) => {
        questions[key] = {
          type: 'score',
          instructions: `Score this competitor on ${key.replace(/_/g, ' ')}, judged only from the evidence supplied about their public presence. If the evidence does not cover a dimension, treat that as absent proof and score it low rather than assuming quality.`,
          criteria: RUBRICS[key],
        };
      });
      const res = await evaluate({
        model: typesafe.evaluationModel('jev'),
        maxRetries: 0,
        state: {
          competitor: c.name,
          url: c.url,
          market: `${industry} in ${location}`,
          observed: {
            positioning: c.positioning || null,
            price_signals: strList(c.price_signals),
            review_rating: c.review_rating ?? null,
            review_count: c.review_count ?? null,
            strengths: strList(c.strengths),
            weaknesses: strList(c.weaknesses),
            negative_themes: strList(c.negative_themes),
          },
        },
        questions,
      });
      const answers = res.answers || {};
      const scores = {};
      Object.keys(RUBRICS).forEach((key) => {
        scores[key] = clamp(round((Number(answers[key]?.score) || 0) / 5 * 100), 0, 100);
      });
      const confidence = res.providerMetadata?.typesafe?.confidence || {};
      return { scores, confidence };
    };

    const scored = await Promise.allSettled(rawCompetitors.map((c) => scoreCompetitor(c)));

    const competitors = rawCompetitors.map((c, i) => {
      const result = scored[i];
      const { scores } = result.status === 'fulfilled' ? result.value : { scores: {} };
      const visual = num(scores.visual_professionalism);
      const trust = num(scores.trust_and_proof);
      const offer = num(scores.offer_clarity);
      const conversion = num(scores.conversion_readiness);
      const content = num(scores.content_depth);
      const composite = round(0.24 * visual + 0.22 * trust + 0.18 * offer + 0.18 * conversion + 0.18 * content);
      const negativeThemes = strList(c.negative_themes);
      return {
        intake_id: intakeId,
        name: String(c.name || 'Unnamed competitor').slice(0, 160),
        url: String(c.url || '').slice(0, 400),
        city: String(c.city || '').slice(0, 80),
        state: String(c.state || '').slice(0, 40),
        distance_miles: num(c.distance_miles),
        rank: i + 1,
        positioning: String(c.positioning || '').slice(0, 600),
        price_signals_json: JSON.stringify(strList(c.price_signals)),
        review_rating: num(c.review_rating),
        review_count: num(c.review_count),
        strengths_json: JSON.stringify(strList(c.strengths)),
        weaknesses_json: JSON.stringify(strList(c.weaknesses)),
        negative_themes_json: JSON.stringify(negativeThemes),
        scores_json: JSON.stringify({ ...scores, scoring_error: result.status === 'rejected' ? (result.reason?.message || 'scoring failed') : undefined }),
        visual_score: visual,
        trust_score: trust,
        offer_score: offer,
        conversion_score: conversion,
        content_score: content,
        composite_score: composite,
        verdict: composite >= 70
          ? `Strong incumbent: ${composite}/100. Beating them means matching their proof and offer, then outranking them visually and structurally.`
          : composite >= 45
            ? `Mid-field competitor: ${composite}/100. Their weak dimensions are the entry points.`
            : `Weak incumbent: ${composite}/100. They hold position on habit and reviews rather than on the site.`,
        source_urls_json: JSON.stringify(strList(c.source_urls, 10)),
        skip_trace_json: JSON.stringify(strList(c.skip_trace, 12)),
      };
    });

    const dims = ['visual_score', 'trust_score', 'offer_score', 'conversion_score', 'content_score'];
    const dimLabels = {
      visual_score: 'frontend visual quality',
      trust_score: 'trust and social proof',
      offer_score: 'offer and pricing clarity',
      conversion_score: 'conversion readiness',
      content_score: 'content and search depth',
    };
    const fieldBest = {};
    dims.forEach((d) => { fieldBest[d] = competitors.length ? Math.max(...competitors.map((c) => num(c[d]))) : 0; });

    // Deterministic dominant benchmark: beat the best incumbent in the field on every dimension.
    const margin = competitors.length ? 10 : 6;
    const dominantBenchmark = {
      basis: competitors.length
        ? `Highest score found across the ${competitors.length} competitors discovered in ${location}, plus a ${margin}-point margin.`
        : 'No competitor data was returned, so the benchmark falls back to a declared 90-point service standard.',
      margin_points: margin,
      targets: dims.map((d) => ({
        dimension: dimLabels[d],
        field_best: fieldBest[d],
        target: clamp(fieldBest[d] + margin, competitors.length ? fieldBest[d] + margin : 90, 100),
      })),
      composite_target: clamp(round(competitors.reduce((s, c) => s + num(c.composite_score), 0) / (competitors.length || 1)) + 12, 0, 100),
      review_target: competitors.length ? Math.max(...competitors.map((c) => num(c.review_count))) : 0,
    };

    // Aggregate complaint themes across the field.
    const themeCounts = {};
    competitors.forEach((c) => {
      JSON.parse(c.negative_themes_json || '[]').forEach((t) => {
        const key = String(t).toLowerCase();
        themeCounts[key] = (themeCounts[key] || 0) + 1;
      });
    });
    const complaintThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme, competitors: count }));

    const niches = uniq([
      ...strList(industryPayload.niches_and_open_areas),
      ...competitors.flatMap((c) => strList(JSON.parse(c.weaknesses_json || '[]'))),
    ].filter((x) => x.length > 12)).slice(0, 12);

    const counterMoves = [];
    complaintThemes.slice(0, 3).forEach((t) => counterMoves.push({
      move: `Fix "${t.theme}" in public`,
      why: `${t.competitors} of ${competitors.length || 1} competitors are being publicly criticised for this. It is the fastest trust gain available in this market.`,
    }));
    const weakestDim = dims.reduce((a, b) => (fieldBest[a] <= fieldBest[b] ? a : b), dims[0]);
    counterMoves.push({
      move: `Beat the field on ${dimLabels[weakestDim]}`,
      why: `The strongest competitor in the market only scores ${fieldBest[weakestDim]}/100 on ${dimLabels[weakestDim]}. The benchmark target is ${clamp(fieldBest[weakestDim] + margin, 90, 100)}/100.`,
    });
    if (industryPayload.typical_price_ranges?.length) {
      counterMoves.push({
        move: 'Publish price bands the field hides',
        why: 'The industry publishes price ranges but local operators mostly do not show them. Visible pricing converts the buyer who is comparing on fear of an unknown bill.',
      });
    }
    niches.slice(0, 3).forEach((n) => counterMoves.push({
      move: `Own the uncovered area: ${n}`,
      why: 'This came back as an area the local field is not covering, so the competition for it is thin.',
    }));

    const customer = industryPayload.ideal_customer || {};
    const confidenceBase = 0.4
      + (competitors.length >= 5 ? 0.2 : competitors.length * 0.04)
      + (business.legal_name || business.public_summary ? 0.15 : 0)
      + (industryPayload.typical_price_ranges?.length ? 0.1 : 0)
      + (industryPayload.sources?.length ? 0.05 : 0);
    const confidence = Math.round(clamp(confidenceBase, 0.2, 0.85) * 100) / 100;

    const summary = competitors.length
      ? `${company} operates in ${industry} around ${location}. ${competitors.length} competitors were found inside ${radius} miles; the strongest scores ${Math.max(...competitors.map((c) => num(c.composite_score)))}/100. ${complaintThemes.length} recurring complaint themes and ${niches.length} uncovered areas were identified to attack.`
      : `${company} operates in ${industry} around ${location}. No competitors could be confirmed from public sources in this pass, so the benchmark is a declared service standard rather than a measured field position.`;

    const normalization = {
      version: ENGINE_VERSION,
      sections: [
        { id: 'identity', kind: 'machine', title: 'Business identity and public surface', payload: business },
        { id: 'market', kind: 'human', title: 'Market and industry intelligence', payload: industryPayload },
        { id: 'field', kind: 'machine', title: 'Competitive field', payload: competitors.map((c) => ({ name: c.name, url: c.url, composite: c.composite_score, distance_miles: c.distance_miles })) },
        { id: 'customer', kind: 'human', title: 'Ideal customer and buying power', payload: customer },
        { id: 'gaps', kind: 'machine', title: 'Gaps, niches and uncovered areas', payload: { niches, complaint_themes: complaintThemes } },
        { id: 'counter', kind: 'machine', title: 'Counter strategy and dominant benchmark', payload: { counter_moves: counterMoves, benchmark: dominantBenchmark } },
      ],
      gaps: [
        ...(intake.website_url ? [] : ['No existing website URL was provided, so the client\'s own frontend could not be audited.']),
        ...(callErrors.length ? callErrors : []),
        ...(competitors.some((c) => !JSON.parse(c.source_urls_json || '[]').length) ? ['At least one competitor profile has no source URL, so treat those fields as unverified.'] : []),
        ...(industryPayload.typical_price_ranges?.length ? [] : ['No published price ranges were found for this industry, so pricing intelligence is empty rather than estimated.']),
      ],
    };

    const createdCompetitors = competitors.length
      ? await base44.entities.CompetitorProfile.bulkCreate(competitors)
      : [];
    // bulkCreate hands back the created rows directly.
    const createdRows = Array.isArray(createdCompetitors) ? createdCompetitors : (createdCompetitors.records || []);
    const createdCompetitorIds = createdRows.map((r) => r.id);

    const report = await base44.entities.DiscoveryReport.create({
      intake_id: intakeId,
      client_name: intake.full_name || '',
      company_name: company || '',
      industry,
      website_url: intake.website_url || '',
      status: 'generated',
      summary,
      business_snapshot_json: JSON.stringify(business),
      industry_intelligence_json: JSON.stringify(industryPayload),
      pricing_json: JSON.stringify(industryPayload.typical_price_ranges || []),
      customer_json: JSON.stringify(customer),
      complaint_themes_json: JSON.stringify(complaintThemes),
      visual_audit_json: JSON.stringify(competitors.map((c) => ({
        name: c.name, visual: c.visual_score, trust: c.trust_score, offer: c.offer_score,
        conversion: c.conversion_score, content: c.content_score, composite: c.composite_score, verdict: c.verdict,
      }))),
      niches_json: JSON.stringify(niches),
      counter_strategy_json: JSON.stringify({ moves: counterMoves, complaint_themes: complaintThemes }),
      dominant_benchmark_json: JSON.stringify(dominantBenchmark),
      competitor_ids_json: JSON.stringify(createdCompetitorIds),
      normalization_json: JSON.stringify(normalization),
      confidence,
      evidence_notes: JSON.stringify({
        business_sources: strList(businessPayload.source_urls, 10),
        competitor_sources: strList(competitorPayload.directory_sources, 10),
        industry_sources: strList(industryPayload.sources, 10),
        notes: strList(businessPayload.evidence_notes, 10),
        call_errors: callErrors,
        radius_miles: radius,
        inner_radius_miles: innerRadius,
      }),
      generated_at: new Date().toISOString(),
      engine_version: ENGINE_VERSION,
    });

    // The report id only exists at this point, so stamp it back onto the competitor rows.
    if (createdCompetitorIds.length) {
      await base44.entities.CompetitorProfile.bulkUpdate(
        createdCompetitorIds.map((id) => ({ id, report_id: report.id }))
      );
    }

    await base44.entities.ClientIntake.update(intakeId, { status: 'researched', discovery_report_id: report.id });

    await base44.entities.AuditLog.create({
      entity_type: 'discovery_report',
      entity_id: report.id,
      action: 'create',
      user_email: user.email,
      details: `Discovery for ${company}: ${competitors.length} competitors scored, ${niches.length} uncovered areas, confidence ${confidence}.`,
      severity: callErrors.length ? 'warning' : 'info',
    });

    return Response.json({
      report_id: report.id,
      report,
      competitors: createdRows,
      complaint_themes: complaintThemes,
      niches,
      counter_moves: counterMoves,
      dominant_benchmark: dominantBenchmark,
      confidence,
      data_gaps: normalization.gaps,
      call_errors: callErrors,
      engine_version: ENGINE_VERSION,
      method_note: 'Facts came from web-grounded research calls that were required to return sources or nothing. Scores came from a separate rubric model working only from those facts. Benchmark targets are declared margins above the best competitor found, not measured outcomes.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
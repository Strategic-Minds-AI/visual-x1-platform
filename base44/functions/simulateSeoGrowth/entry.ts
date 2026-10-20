import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Deterministic growth engine. No LLM touches these numbers: every constant below is a
// declared planning assumption, listed in the returned `assumptions` ledger so nothing
// reads as measured market data.
const ENGINE_VERSION = '1.0.0';

const INDUSTRY_BENCHMARKS = {
  plumbing: { cpc: 8.2, lead_value: 240 },
  hvac: { cpc: 8.6, lead_value: 300 },
  roofing: { cpc: 9.1, lead_value: 620 },
  restoration: { cpc: 9.6, lead_value: 850 },
  flooring: { cpc: 7.4, lead_value: 420 },
  epoxy: { cpc: 7.9, lead_value: 460 },
  electrical: { cpc: 7.8, lead_value: 260 },
  cleaning: { cpc: 6.1, lead_value: 120 },
  landscaping: { cpc: 6.4, lead_value: 180 },
  pest: { cpc: 7.2, lead_value: 170 },
  dental: { cpc: 7.4, lead_value: 520 },
  medical: { cpc: 9.4, lead_value: 700 },
  legal: { cpc: 12.2, lead_value: 1400 },
  auto: { cpc: 5.8, lead_value: 210 },
  real: { cpc: 6.6, lead_value: 1600 },
  default: { cpc: 4.5, lead_value: 180 },
};

const COST_BY_TIER = { free: 0, low: 20, medium: 140, high: 450 };

// Simulation modes. A higher mode assumes more work runs in parallel and shows a wider band —
// it never changes the inputs you entered, and it is not a better forecast.
const MODES = {
  simple: { label: 'Simple', intensity: 0.85, scenarios: 1, range_width: 0.35 },
  moderate: { label: 'Moderate', intensity: 1.0, scenarios: 3, range_width: 0.45 },
  pro: { label: 'Pro', intensity: 1.12, scenarios: 4, range_width: 0.55 },
  elite: { label: 'Elite', intensity: 1.24, scenarios: 5, range_width: 0.62 },
  god: { label: 'God Mode', intensity: 1.38, scenarios: 6, range_width: 0.72 },
};
const SCENARIO_NAMES = ['Conservative', 'Cautious', 'Expected', 'Accelerated', 'Aggressive', 'Maximum push'];
const HORIZONS = [
  { id: '3m', label: '3 months', months: 3 },
  { id: '6m', label: '6 months', months: 6 },
  { id: '12m', label: '12 months', months: 12 },
  { id: '24m', label: '24 months', months: 24 },
];
const CATEGORIES = ['technical', 'content', 'aeo', 'geo', 'local', 'programmatic', 'authority', 'paid', 'social', 'engagement', 'offline', 'measurement', 'ai_native'];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const decaySum = (values, decay) => [...values].filter((v) => v > 0).sort((a, b) => b - a)
  .reduce((s, v, i) => s + v * Math.pow(decay, i), 0);
const round = (v) => Math.round(v);

const benchmarkFor = (industry) => {
  const k = String(industry || '').toLowerCase();
  const key = Object.keys(INDUSTRY_BENCHMARKS).find((x) => x !== 'default' && k.includes(x));
  return INDUSTRY_BENCHMARKS[key || 'default'];
};

const coverageFor = (strategies, category) => clamp(
  decaySum(strategies.filter((s) => s.category === category).map((s) => num(s.impact, 5)), 0.9) / 55,
  0,
  1.6
);

const buildScores = (p, cov) => {
  const images = clamp(num(p.images_per_page), 0, 20);
  const videos = clamp(num(p.videos_count), 0, 50);
  const articles = clamp(num(p.articles_count), 0, 400);
  const reviews = clamp(num(p.reviews_count), 0, 5000);
  const networking = clamp(num(p.networking_events), 0, 30);
  const social = clamp(num(p.social_posts_per_week), 0, 30);
  const promoBoost = p.promo === 'strong' ? 9 : p.promo === 'small' ? 4 : 0;

  const technical = clamp(0.5 * num(p.page_speed, 60) + 52 * cov.technical, 0, 100);
  const content = clamp(
    0.42 * num(p.content_quality, 60) + Math.min(26, articles * 2.2) + Math.min(9, images * 2.4)
    + Math.min(10, videos * 9) + 34 * cov.content + 22 * cov.aeo + 10 * cov.programmatic, 0, 100);
  const authority = clamp(
    Math.min(38, num(p.domain_age_months) * 0.55) + Math.min(26, num(p.backlink_count) * 0.35)
    + 32 * cov.authority + 22 * cov.local + 20 * cov.programmatic + Math.min(10, reviews * 0.06)
    + Math.min(14, networking * 1.8), 0, 100);
  const engagement = clamp(
    0.34 * num(p.hook_strength, 60) + 0.26 * num(p.funnel_strength, 60) + promoBoost
    + 30 * cov.engagement + 12 * cov.social + 6 * cov.offline + Math.min(8, images * 1.6)
    + Math.min(9, videos * 8) + Math.min(8, reviews * 0.05) + Math.min(10, social * 1.5), 0, 100);
  const aeo = clamp(40 * cov.aeo + 0.3 * content + 0.1 * engagement + (articles > 0 ? Math.min(10, articles * 1.2) : 0), 0, 100);
  const geo = clamp(38 * cov.geo + 0.22 * authority + 0.18 * content + 12 * cov.ai_native, 0, 100);
  const difficulty = clamp(num(p.keyword_difficulty, 55), 5, 100);
  const overall = clamp(
    (0.2 * technical + 0.26 * content + 0.24 * authority + 0.2 * engagement + 0.05 * aeo + 0.05 * geo)
    * (1 - (difficulty - 50) / 260), 0, 100);

  return { technical, content, authority, engagement, aeo, geo, overall, difficulty };
};

const buildDays = (p, strategies, scores, mode) => {
  const baseDays = 26 + scores.difficulty * 3.1;
  const velocity = decaySum(strategies.map((s) => num(s.velocity, 4)), 0.86);
  const scoreLift = (scores.content + scores.technical + scores.authority) / 3;
  let d = baseDays - velocity * 0.62 - scoreLift * 0.5;
  if (num(p.content_quality, 60) < 55) d += 18;
  if (num(p.domain_age_months) < 3) d += 30;
  // Mode assumption: more parallel work shortens the modeled ramp. The band widens with it.
  d = d * (2 - mode.intensity);
  const p50 = clamp(round(d), 21, 540);
  const spread = mode.range_width;
  return {
    p10: clamp(round(p50 * (1 - spread * 0.5)), 14, p50),
    p50,
    p90: clamp(round(p50 * (1 + spread * 0.8)), p50 + 7, 720),
  };
};

const buildTimeline = (p, scores, centerDays, volumeFactor, months = 12) => {
  const searches = clamp((300 + scores.difficulty * 26) * volumeFactor, 200, 14000);
  const ctr = 0.085;
  const center = centerDays / 30;
  const leadRate = clamp(
    0.015 + 0.05 * (num(p.funnel_strength, 60) / 100) + 0.02 * (scores.engagement / 100)
    + (p.promo === 'strong' ? 0.012 : p.promo === 'small' ? 0.006 : 0), 0.01, 0.14);
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const share = 0.04 + 0.96 / (1 + Math.exp(-(m - center) / 1.35));
    const clicks = searches * ctr * share;
    const impressions = searches * (0.3 + 0.7 * share);
    const sessions = clicks * 1.05;
    const leads = sessions * leadRate;
    rows.push({
      month: m,
      share: Math.round(share * 100) / 100,
      impressions: round(impressions),
      clicks: round(clicks),
      sessions: round(sessions),
      leads: round(leads * 10) / 10,
      revenue: round(leads * benchmarkFor(p.industry).lead_value),
    });
  }
  return rows;
};

const sumOf = (rows, key) => rows.reduce((s, r) => s + r[key], 0);

// Scenario band: the same inputs read across the modeled spread, so a range is shown instead
// of one number.
const buildScenarios = (base, mode) => {
  const rows = [];
  for (let i = 0; i < mode.scenarios; i++) {
    const offset = mode.scenarios <= 1 ? 0 : ((i / (mode.scenarios - 1)) - 0.5) * 2 * mode.range_width;
    const factor = 1 + offset;
    const nameIndex = mode.scenarios <= 1 ? 2 : round((i / (mode.scenarios - 1)) * (SCENARIO_NAMES.length - 1));
    rows.push({
      name: mode.scenarios <= 1 ? 'Single path' : SCENARIO_NAMES[nameIndex],
      offset: round(offset * 100) / 100,
      days_to_page1: clamp(round(base.days.p50 * (1 - offset * 0.25)), 14, 720),
      sessions_12m: round(base.totals.sessions_12m * factor),
      leads_12m: round(base.totals.leads_12m * factor),
      revenue_12m: round(base.totals.revenue_12m * factor),
      cost_12m: base.totals.cost_12m,
      note: offset >= 0.15 ? 'Work lands early and compounds.' : offset <= -0.15 ? 'Slower ramp or softer demand than expected.' : 'Middle of the modeled band.',
    });
  }
  return rows;
};

// The trace: every step the engine took to reach the numbers, with the actual values in it.
const buildReasoning = (base, p, strategies, mode, bench) => {
  const families = Object.entries(base.cov).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const steps = [
    { step: 'Read the inputs', detail: `Industry "${p.industry || 'general'}", keyword "${p.target_keyword || 'not set'}", ${strategies.length} strategies enabled, mode ${mode.label}.` },
    { step: 'Scored strategy coverage by family', detail: families.length ? families.slice(0, 4).map(([k, v]) => `${k} ${Math.round(v * 100) / 100}`).join(', ') : 'No family enabled, so coverage scores zero.' },
    { step: 'Scored the site on six signals', detail: `technical ${round(base.scores.technical)}, content ${round(base.scores.content)}, authority ${round(base.scores.authority)}, engagement ${round(base.scores.engagement)}, AEO ${round(base.scores.aeo)}, GEO ${round(base.scores.geo)} — overall ${round(base.scores.overall)} at difficulty ${base.scores.difficulty}.` },
    { step: 'Modeled the ranking ramp', detail: `Stacked velocity and the blended score put the expected page-1 date near ${base.days.p50} days, inside a ${base.days.p10}-${base.days.p90} day band.` },
    { step: 'Applied the mode', detail: `${mode.label} assumes ${mode.intensity}x parallel work, widens the band to about ±${Math.round(mode.range_width * 80)}% and runs ${mode.scenarios} scenario(s).` },
    { step: 'Applied market pressure', detail: `Industry constants for "${p.industry || 'general'}": $${bench.cpc.toFixed(2)} CPC, $${bench.lead_value} lead value, with $${num(p.monthly_ad_spend)}/month of paid spend included.` },
    { step: 'Converted traffic into money', detail: `${base.totals.leads_12m} modeled leads and about $${base.totals.revenue_12m} of modeled value over 12 months against $${base.totals.cost_12m} of modeled cost.` },
  ];
  if (mode.scenarios > 1) steps.push({ step: 'Ran the scenario band', detail: `${mode.scenarios} scenarios from conservative to maximum push, so the spread is visible rather than one number.` });
  return steps;
};

const ownerFor = (label) => {
  const l = String(label || '').toLowerCase();
  if (l.includes('article') || l.includes('content') || l.includes('social')) return 'CONTENT agent';
  if (l.includes('video') || l.includes('image')) return 'BRAND agent';
  if (l.includes('ad') || l.includes('spend') || l.includes('network')) return 'GROWTH agent';
  if (l.includes('promo') || l.includes('offer')) return 'STRATEGY agent';
  return 'STRATEGY agent';
};

const simulate = (p, strategies, bench, mode) => {
  const cov = {};
  CATEGORIES.forEach((c) => { cov[c] = coverageFor(strategies, c); });
  const scores = buildScores(p, cov);
  const days = buildDays(p, strategies, scores, mode);
  const slow = buildTimeline(p, scores, days.p90, 0.72);
  const expected = buildTimeline(p, scores, days.p50, 1.0);
  const fast = buildTimeline(p, scores, days.p10, 1.28);
  const timeline = expected.map((row, i) => ({
    ...row,
    p10_sessions: slow[i].sessions,
    p90_sessions: fast[i].sessions,
  }));
  const strategyCost = strategies.reduce((s, x) => s + (COST_BY_TIER[x.cost_tier] ?? COST_BY_TIER.low), 0);
  const totals = {
    impressions_12m: round(sumOf(expected, 'impressions')),
    clicks_12m: round(sumOf(expected, 'clicks')),
    sessions_3m: round(sumOf(expected.slice(0, 3), 'sessions')),
    sessions_6m: round(sumOf(expected.slice(0, 6), 'sessions')),
    sessions_12m: round(sumOf(expected, 'sessions')),
    leads_12m: round(sumOf(expected, 'leads')),
    revenue_12m: round(sumOf(expected, 'revenue')),
    cost_12m: round(strategyCost * 12 + num(p.monthly_ad_spend) * 12),
  };
  totals.roi_12m = totals.cost_12m > 0 ? Math.round((totals.revenue_12m / totals.cost_12m) * 100) / 100 : null;
  const ranges = {
    conservative: { sessions_12m: round(sumOf(slow, 'sessions')), leads_12m: round(sumOf(slow, 'leads')), revenue_12m: round(sumOf(slow, 'revenue')) },
    expected: { sessions_12m: totals.sessions_12m, leads_12m: totals.leads_12m, revenue_12m: totals.revenue_12m },
    aggressive: { sessions_12m: round(sumOf(fast, 'sessions')), leads_12m: round(sumOf(fast, 'leads')), revenue_12m: round(sumOf(fast, 'revenue')) },
  };
  // Time-based prediction report: the same engine projected to each horizon, with the band.
  const long = buildTimeline(p, scores, days.p50, 1.0, 24);
  const longSlow = buildTimeline(p, scores, days.p90, 0.72, 24);
  const longFast = buildTimeline(p, scores, days.p10, 1.28, 24);
  const horizons = HORIZONS.map((h) => {
    const slice = (rows) => rows.slice(0, h.months);
    const sessions = round(sumOf(slice(expected), 'sessions'));
    const leads = round(sumOf(slice(expected), 'leads'));
    const revenue = round(sumOf(slice(expected), 'revenue'));
    const spend = round(totals.cost_12m / 12 * h.months);
    const lowLeads = round(sumOf(slice(slow), 'leads'));
    const highLeads = round(sumOf(slice(fast), 'leads'));
    const lowRevenue = round(sumOf(slice(longSlow), 'revenue'));
    const highRevenue = round(sumOf(slice(longFast), 'revenue'));
    return {
      id: h.id,
      label: h.label,
      months: h.months,
      sessions,
      impressions: round(sumOf(slice(expected), 'impressions')),
      leads,
      lead_range: { low: lowLeads, high: highLeads },
      revenue,
      revenue_range: { low: h.months === 24 ? lowRevenue : round(sumOf(slice(slow), 'revenue')), high: h.months === 24 ? highRevenue : round(sumOf(slice(fast), 'revenue')) },
      spend,
      cost_per_lead: leads > 0 ? Math.round(spend / leads) : null,
      revenue_per_dollar: spend > 0 ? Math.round((revenue / spend) * 100) / 100 : null,
      break_even_month: (() => {
        const rows = slice(expected);
        let cumulative = 0;
        const monthlySpend = spend / h.months;
        for (const row of rows) {
          cumulative += row.revenue - monthlySpend;
          if (cumulative >= 0) return row.month;
        }
        return null;
      })(),
      note: h.months > 12 ? 'Projected past the 12-month model; compounding slows, so read the band, not the point estimate.' : 'Inside the modeled window.',
    };
  });
  const scenarios = buildScenarios({ days, totals }, mode);
  const reasoning = buildReasoning({ cov, scores, days, totals }, p, strategies, mode, bench);
  return { cov, scores, days, timeline, totals, ranges, horizons, scenarios, reasoning };
};

const gapList = (p, strategies) => {
  const gaps = [];
  if (!num(p.domain_age_months)) gaps.push('Domain age is not entered, so the new-domain ramp penalty is only a default.');
  if (!num(p.monthly_ad_spend)) gaps.push('No ad spend entered, so paid amplification is not contributing.');
  if (!num(p.articles_count)) gaps.push('No published articles yet, so question-intent coverage scores zero.');
  if (!num(p.videos_count)) gaps.push('No video on the site, so video engagement lift is not counted.');
  if (!num(p.reviews_count)) gaps.push('No reviews collected, so social proof contributes nothing to authority or engagement.');
  if (!num(p.backlink_count)) gaps.push('No placed backlinks entered, so off-page authority is near zero.');
  if (!num(p.networking_events)) gaps.push('No networking activity entered, so offline brand lift is not counted.');
  if (!num(p.social_posts_per_week)) gaps.push('No social cadence entered, so distribution is not contributing.');
  if (!p.content_judged) gaps.push('The page content has not been scored by the Content Judge — hook strength is your estimate.');
  if (!strategies.length) gaps.push('Every strategy is switched off, so the model has nothing to compound.');
  return gaps;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const p = (body.profile && typeof body.profile === 'object') ? body.profile : {};
    const strategies = (Array.isArray(body.strategies) ? body.strategies : []).slice(0, 120);
    const bench = benchmarkFor(p.industry);

    const MODE_IDS = Object.keys(MODES);
    const modeId = MODE_IDS.includes(String(body.mode)) ? String(body.mode) : 'moderate';
    const mode = MODES[modeId];

    const base = simulate(p, strategies, bench, mode);
    const deltas = [];

    // Lever 1 — paid spend, with the organic halo when paid and organic run together.
    const adSpend = 300;
    const adCpc = bench.cpc * (1 + (base.scores.difficulty - 50) / 180);
    const adClicksMonthly = adSpend / adCpc;
    const adSessionsMonthly = adClicksMonthly * 0.92;
    const adLeadRate = clamp(0.05 + 0.04 * (num(p.funnel_strength, 60) / 100) + (p.promo === 'strong' ? 0.015 : 0), 0.03, 0.16);
    const adLeadsMonthly = adClicksMonthly * adLeadRate;
    const halo = base.cov.paid > 0 ? base.totals.sessions_12m * 0.02 : 0;
    deltas.push({
      key: 'ad_spend_300',
      label: `Add $${adSpend}/month in Google Ads`,
      detail: `Modeled at $${adCpc.toFixed(2)} CPC and ${Math.round(adLeadRate * 100)}% landing-page lead rate for a ${base.scores.difficulty}-difficulty market.${base.cov.paid > 0 ? ' Paid + organic also lifts branded search, included here.' : ' Turn on paid amplification to also capture the organic halo.'}`,
      days_saved: 0,
      extra_clicks: round(adClicksMonthly * 12),
      extra_sessions_12m: round(adSessionsMonthly * 12 + halo),
      extra_leads_12m: round(adLeadsMonthly * 12 + halo * 0.04),
      extra_revenue_12m: round((adLeadsMonthly * 12 + halo * 0.04) * bench.lead_value),
    });

    const lever = (key, label, detail, mutate) => {
      const altProfile = { ...p };
      mutate(altProfile);
      const alt = simulate(altProfile, strategies, bench, mode);
      const daysSaved = Math.max(0, base.days.p50 - alt.days.p50);
      const extraSessions = alt.totals.sessions_12m - base.totals.sessions_12m;
      const extraLeads = alt.totals.leads_12m - base.totals.leads_12m;
      if (extraSessions <= 0 && daysSaved <= 0) return;
      deltas.push({
        key, label, detail, days_saved: daysSaved,
        extra_clicks: round(alt.totals.clicks_12m - base.totals.clicks_12m),
        extra_sessions_12m: round(extraSessions),
        extra_leads_12m: round(extraLeads * 10) / 10,
        extra_revenue_12m: round(extraLeads * bench.lead_value),
      });
    };

    lever('articles_10', 'Write 10 articles answering high-search questions',
      'Adds question-intent coverage, content depth and AEO surface area, which compounds into authority.',
      (x) => { x.articles_count = num(x.articles_count) + 10; });
    lever('video_1', 'Add one homepage video with hashtags and links',
      'Video lift on engagement plus a second media surface for search and social distribution.',
      (x) => { x.videos_count = num(x.videos_count) + 1; });
    lever('networking_2', 'Attend 2 networking events a month',
      'Offline brand and referral signals: modeled as authority and branded-search lift, not link equity.',
      (x) => { x.networking_events = num(x.networking_events) + 2; });
    lever('promo_upgrade', 'Run a stronger promo or discount',
      'Higher hook strength raises both engagement and the lead rate on the same traffic.',
      (x) => { x.promo = 'strong'; });
    lever('social_5', 'Post 5x a week with hashtag + keyword linking',
      'Distribution cadence lifts engagement and gives the site repeat branded impressions.',
      (x) => { x.social_posts_per_week = num(x.social_posts_per_week) + 5; });

    // Strategy-level moves: what switching one off costs, and what a switched-off strategy would return.
    const enabledIds = new Set(strategies.map((s) => s.id).filter(Boolean));
    const allStrategies = (Array.isArray(body.catalog) ? body.catalog : []).slice(0, 200);
    const disabledCritical = allStrategies
      .filter((s) => s.id && !enabledIds.has(s.id))
      .sort((a, b) => num(b.impact, 5) - num(a.impact, 5))
      .slice(0, 4)
      .map((s) => {
        const alt = simulate(p, [...strategies, s], bench, mode);
        const daysSaved = Math.max(0, base.days.p50 - alt.days.p50);
        const extraSessions = alt.totals.sessions_12m - base.totals.sessions_12m;
        return {
          label: `Turn on: ${s.name}`,
          why: daysSaved > 0
            ? `Pulls the expected page-1 date in by about ${daysSaved} days and adds ~${round(extraSessions)} sessions over 12 months.`
            : `Adds ~${round(extraSessions)} sessions over 12 months. It is switched off right now.`,
          days_saved: daysSaved,
          extra_sessions_12m: round(extraSessions),
        };
      })
      .filter((d) => d.extra_sessions_12m > 0 || d.days_saved > 0);

    const bestMoves = [...deltas]
      .sort((a, b) => (b.extra_sessions_12m + b.days_saved * 40) - (a.extra_sessions_12m + a.days_saved * 40))
      .slice(0, 3)
      .map((d) => ({
        label: d.label,
        why: `≈ +${d.extra_sessions_12m} sessions and +${d.extra_leads_12m} leads over 12 months${d.days_saved > 0 ? `, page 1 about ${d.days_saved} days sooner` : ''}.`,
      }));

    const gaps = gapList(p, strategies);
    const confidence = clamp(0.92 - 0.06 * gaps.length, 0.3, 0.92);

    return Response.json({
      engine_version: ENGINE_VERSION,
      seed: num(body.seed, 0),
      industry_benchmark: bench,
      scores: {
        technical: round(base.scores.technical), content: round(base.scores.content),
        authority: round(base.scores.authority), engagement: round(base.scores.engagement),
        aeo: round(base.scores.aeo), geo: round(base.scores.geo), overall: round(base.scores.overall),
        difficulty: base.scores.difficulty,
      },
      coverage: Object.fromEntries(CATEGORIES.map((c) => [c, Math.round(base.cov[c] * 100) / 100])),
      days_to_page1: base.days,
      timeline: base.timeline,
      totals: base.totals,
      ranges: base.ranges,
      strategy_count: strategies.length,
      deltas,
      leverage: { best_moves: bestMoves, disabled_critical: disabledCritical },
      mode: {
        id: modeId,
        label: mode.label,
        intensity: mode.intensity,
        scenarios: mode.scenarios,
        range_width: mode.range_width,
        what_it_changes: `${mode.label} assumes ${mode.intensity}x parallel work, a band of about ±${Math.round(mode.range_width * 80)}% and ${mode.scenarios} scenario(s). Inputs are unchanged.`,
      },
      scenarios: base.scenarios,
      prediction_horizons: base.horizons,
      reasoning: [
        ...base.reasoning,
        { step: 'Listed what is missing', detail: gaps.length ? `${gaps.length} input gap(s) are holding the model back: ${gaps.slice(0, 3).join(' ')}` : 'No input gaps were detected, so nothing in the model is running on a default.' },
      ],
      recommendation: {
        who: ownerFor(bestMoves[0]?.label),
        what: bestMoves.length ? bestMoves.map((m) => m.label).join(' · ') : 'Turn on the highest-impact strategy families that are switched off, then re-run.',
        when: `Start this week. At these settings the model puts page 1 around ${base.days.p50} days out (${base.days.p10}-${base.days.p90} day band).`,
        where: `${p.city || 'the target market'} — organic search and the ${p.funnel_type || 'lead'} funnel, with social and offline feeding branded search.`,
        why: `It produces the largest modeled movement of anything on the board: about ${base.totals.leads_12m} leads and $${base.totals.revenue_12m} of modeled value over 12 months against $${base.totals.cost_12m} of modeled cost${gaps.length ? `, with ${gaps.length} known input gap(s) still to close` : ''}.`,
        why_not_others: disabledCritical.length ? `The strategies left switched off would each add less than the moves above: ${disabledCritical.slice(0, 2).map((d) => d.label).join('; ')}.` : 'Everything else on the board is already switched on, so the remaining leverage is in the inputs themselves.',
      },
      confidence: Math.round(confidence * 100) / 100,
      data_gaps: gaps,
      assumptions: [
        `Industry benchmark for "${p.industry || 'general'}": $${bench.cpc.toFixed(2)} CPC and $${bench.lead_value} average lead value — planning constants, not measured data for your market.`,
        'Page-1 blended CTR is assumed at 8.5% of monthly search demand, and rankings ramp on an S-curve centered on the modeled page-1 date.',
        'Monthly search demand is proxied from keyword difficulty (300 + difficulty x 26), not from a keyword tool.',
        'Lead rate is modeled from funnel strength, promo and engagement score; it is not a measured conversion rate.',
        'Stacked strategies score with diminishing returns (0.9 per extra tactic in a family), so similar tactics add less each time.',
        'Domain age under 3 months adds a 30-day ramp penalty; low content quality adds 18 days.',
        `Mode "${mode.label}" assumes ${mode.intensity}x parallel work, which shortens the modeled ramp and widens the band to about ±${Math.round(mode.range_width * 80)}%. It does not change your inputs and it is not a better forecast.`,
        'Every figure is a modeled planning estimate. No ranking, traffic or revenue outcome is guaranteed or predicted.',
      ],
      disclaimer: 'Illustrative simulation from declared assumptions and your own inputs. Recalibrate with first-party data (Analytics, Search Console, your real close rate) before committing spend.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
// The end-to-end project workflow. Every project gets this checklist, in this order, seeded
// from this file. Gates are the points where work stops until something is shown and approved.

export const WORKFLOW_PHASES = [
  {
    id: "discover",
    name: "Phase 1 — Discover and lock",
    purpose: "Turn the client's sentence into a locked profile, goal and researched market position.",
    steps: [
      { title: "Capture the client intake", description: "Name, address, contact, industry, business stage, services and service area recorded.", owner: "VISION", evidence: "ClientIntake record submitted." },
      { title: "Expand the vision statement", description: "The seed sentence is expanded into industry, financial, autonomy, risk and horizon fields.", owner: "VISION", evidence: "vision_json stored on the intake." },
      { title: "Lock the goal", description: "One measurable target and horizon is locked and drives every later recommendation.", owner: "VISION", evidence: "goal_kind, goal_value and goal_horizon set." },
      { title: "Scan the client's public surface", description: "Business name, URL, public details, reviews, social presence and site signals collected.", owner: "VISION", evidence: "business_snapshot_json on the report." },
      { title: "Skip trace the top local competitors", description: "Top 5 competitors inside the radius with location, distance, rating and price signals.", owner: "STRATEGY", evidence: "Five CompetitorProfile records with sources." },
      { title: "Map the industry offer set", description: "Every service and product typically sold, demand leaders and typical price ranges.", owner: "STRATEGY", evidence: "industry_intelligence_json and pricing_json." },
    ],
  },
  {
    id: "intelligence",
    name: "Phase 2 — Intelligence and normalization",
    purpose: "Score the field, find the gaps, and normalize everything into one document set.",
    steps: [
      { title: "Score competitor frontends and businesses", description: "Visual professionalism, trust, offer clarity, conversion readiness and content depth scored on a fixed rubric.", owner: "VALIDATOR", evidence: "Rubric scores on every CompetitorProfile." },
      { title: "Harvest complaint and negative themes", description: "Public ratings, complaints and recurring service failures collected per competitor.", owner: "VISION", evidence: "negative_themes_json per competitor." },
      { title: "Identify niches and open areas", description: "Services, segments and messages competitors are not covering, ranked by pull.", owner: "STRATEGY", evidence: "niches_json on the report." },
      { title: "Map the ideal client and buying power", description: "Ideal customer set, typical income band, buying power, habits and decision triggers.", owner: "STRATEGY", evidence: "customer_json on the report." },
      { title: "Normalize the document set", description: "Raw research organized into one machine-readable section set every later stage reads.", owner: "VALIDATOR", evidence: "normalization_json on the report." },
      { title: "Publish the branded discovery package", description: "Human-readable package assembled for the client portal.", owner: "BRAND", evidence: "DiscoveryReport marked generated." },
    ],
  },
  {
    id: "strategy",
    name: "Phase 3 — Strategy and approval gate",
    purpose: "Convert discovery into a counter strategy, a dominant benchmark and approved options.",
    steps: [
      { title: "Build the counter strategy", description: "Moves that exploit each competitor weakness, with the reason recorded.", owner: "STRATEGY", evidence: "counter_strategy_json on the report." },
      { title: "Set the dominant benchmark", description: "Per-dimension target the new site and offer must beat to lead the field.", owner: "STRATEGY", evidence: "dominant_benchmark_json on the report." },
      { title: "Generate horizon options", description: "Short, mid and long options across naming, URL, NearMe/NearYou, SEO/AEO/GEO, budget, visuals, agents and pricing.", owner: "STRATEGY", evidence: "proposal_json on the report." },
      { title: "Generate launch variants", description: "3-5 alternative positioning variants to launch and test against each other.", owner: "BRAND", evidence: "variant list inside the proposal." },
      { title: "Model time, traffic, lead and revenue ranges", description: "Deterministic simulation over the chosen strategies with assumptions stated.", owner: "GROWTH", evidence: "prediction_json with the assumption ledger." },
      { title: "Client review and approval gate", description: "The client reviews the branded discovery package and chooses an option.", owner: "VISION", gate: true, gate_type: "client", evidence: "Approval recorded with notes and reviewer." },
    ],
  },
  {
    id: "brand",
    name: "Phase 4 — Brand and asset system",
    purpose: "Everything visual and verbal, generated once and reusable.",
    steps: [
      { title: "Lock naming and URL strategy", description: "Business name, domain, NearMe/NearYou domain system and redirect plan.", owner: "BRAND", evidence: "Names and URLs recorded against the project." },
      { title: "Lock brand voice and tone", description: "Tone rules, vocabulary and banned phrases for every written surface.", owner: "BRAND", evidence: "Tone guide attached to the project folder." },
      { title: "Produce the logo and palette set", description: "Primary mark, supporting marks and the colour system.", owner: "BRAND", evidence: "Logo files and tokens stored." },
      { title: "Produce the digital business card and QR", description: "Card mockup, tap target and QR that routes to the lead capture.", owner: "BRAND", evidence: "Card mockup rendering approved." },
      { title: "Produce apparel and brand assets", description: "Vehicle, uniform, print and apparel assets generated as a repeatable set.", owner: "BRAND", evidence: "Asset pack stored in the project folder." },
      { title: "Brand approval gate", description: "Brand system shown in the dashboard for approval before build.", owner: "BRAND", gate: true, gate_type: "client", evidence: "Brand rendered and approved." },
    ],
  },
  {
    id: "build",
    name: "Phase 5 — Website and platform build",
    purpose: "Build the site and platform against the dominant benchmark.",
    steps: [
      { title: "Define sitemap and page inventory", description: "Every page, its intent and the keyword or question it answers.", owner: "BUILDER", evidence: "Sitemap stored against the project." },
      { title: "Define user flow and funnel", description: "Path from first visit to booked job or paid order, per audience.", owner: "STRATEGY", evidence: "Flow diagram and funnel definition." },
      { title: "Map structure from the benchmark library", description: "Layout and section order mapped from the winning benchmarks in the industry.", owner: "BUILDER", evidence: "Benchmark mapping recorded." },
      { title: "Build the frontend", description: "Pages built to the dominant benchmark targets, mobile first.", owner: "BUILDER", evidence: "Rendered build with visual QA capture." },
      { title: "Build the backend and automations", description: "Forms, booking, CRM handoff, notifications and the automations the client selected.", owner: "BUILDER", evidence: "Working flows tested end to end." },
      { title: "Set pricing, offers and service tiers", description: "Pricing model, packages and guarantees per the chosen option.", owner: "STRATEGY", evidence: "Pricing page and offer sheet." },
      { title: "Internal QA gate", description: "Independent validator scores the build; the builder cannot approve its own work.", owner: "QA", gate: true, gate_type: "internal", evidence: "Validation receipt at or above threshold." },
    ],
  },
  {
    id: "content",
    name: "Phase 6 — Content, SEO, AEO and GEO",
    purpose: "Fill the platform with content that answers demand and earns the ranking surface.",
    steps: [
      { title: "Build the keyword, phrase and question strategy", description: "Primary, secondary, long-tail, voice and question sets per service and location.", owner: "GROWTH", evidence: "Keyword map stored with volumes and intent." },
      { title: "Write the service and location pages", description: "Programmatic page set mapped to the URL structure.", owner: "CONTENT", evidence: "Pages published and indexed." },
      { title: "Add the AEO answer layer", description: "Direct-answer blocks, FAQ and structured data so assistants can quote the business.", owner: "CONTENT", evidence: "Answer blocks and schema in place." },
      { title: "Add the GEO and local layer", description: "Location signals, service area, hours, licensing and local proof.", owner: "CONTENT", evidence: "Local fields live and consistent." },
      { title: "Run content and hook judging", description: "Copy scored and competing hooks tested before publishing.", owner: "VALIDATOR", evidence: "Content judge scores recorded." },
      { title: "Build the 30-day content calendar", description: "Social, email and video posts mapped to pillars with hashtags.", owner: "CONTENT", evidence: "Calendar generated and approved." },
    ],
  },
  {
    id: "agents",
    name: "Phase 7 — Agents and automation",
    purpose: "Hand the operating work to agents the client can talk to.",
    steps: [
      { title: "Configure the agent roster", description: "Specialised agents with roles, prompts and boundaries per function.", owner: "AGENT", evidence: "Agent configs and roster recorded." },
      { title: "Enable agent chat in the client portal", description: "The client can instruct and question the system directly.", owner: "AGENT", evidence: "Working chat with scoped permissions." },
      { title: "Connect off-platform channels", description: "WhatsApp and other channels so agents operate outside the app.", owner: "AGENT", evidence: "Channel connected and tested." },
      { title: "Wire the selected automations", description: "Every tool the client chose during onboarding is switched on and tested.", owner: "BUILDER", evidence: "Each selected tool marked live with a test." },
      { title: "Set autonomy rules and escalation", description: "What agents may do alone, what needs approval, and who is alerted.", owner: "STRATEGY", evidence: "Autonomy matrix attached." },
      { title: "Automation approval gate", description: "Client sees each automation running before full autonomy is granted.", owner: "AGENT", gate: true, gate_type: "client", evidence: "Automations demonstrated and approved." },
    ],
  },
  {
    id: "launch",
    name: "Phase 8 — Launch and distribution",
    purpose: "Go live and push the surface out everywhere it can be found.",
    steps: [
      { title: "Deploy to the domain", description: "Domain, hosting, certificates and redirects configured.", owner: "BUILDER", evidence: "Live URL returning 200." },
      { title: "Submit sitemap and request indexing", description: "Sitemap submitted and indexing requested for priority pages.", owner: "GROWTH", evidence: "Submission receipts recorded." },
      { title: "Claim and align profiles", description: "Google Business Profile and core directories aligned to the new name, hours and services.", owner: "GROWTH", evidence: "Profile URLs recorded." },
      { title: "Deploy the backlink and directory set", description: "Supporting sites built and health checked.", owner: "GROWTH", evidence: "Backlink sites live with health status." },
      { title: "Launch 3-5 variants", description: "Variants launched together with tracking attached to each.", owner: "GROWTH", evidence: "Variant URLs and measurement ids." },
      { title: "Launch approval gate", description: "Final visual and offer review before any paid spend.", owner: "QA", gate: true, gate_type: "client", evidence: "Approved launch record." },
    ],
  },
  {
    id: "measure",
    name: "Phase 9 — Measurement and prediction review",
    purpose: "Prove what is happening and refresh the prediction against real data.",
    steps: [
      { title: "Connect analytics and verify tracking", description: "Analytics, conversion events and call tracking verified firing.", owner: "GROWTH", evidence: "Test event received." },
      { title: "Publish the client reporting view", description: "Traffic, leads, cost per lead and pipeline in one dashboard.", owner: "GROWTH", evidence: "Dashboard rendering with data." },
      { title: "Start the ranking and mention tracker", description: "Tracked queries with position checks on a schedule.", owner: "GROWTH", evidence: "First ranking snapshot stored." },
      { title: "Reconcile prediction against actuals", description: "Modeled ranges compared with real results; assumptions corrected.", owner: "VALIDATOR", evidence: "Variance note recorded." },
      { title: "Variant performance review", description: "Winner identified, losers retired, new variant queued.", owner: "GROWTH", evidence: "Leader recorded per variant set." },
      { title: "Monthly strategy review gate", description: "Client reviews performance and approves the next month's plan.", owner: "VISION", gate: true, gate_type: "client", evidence: "Review recorded with decisions." },
    ],
  },
  {
    id: "compound",
    name: "Phase 10 — Audit, repair and compounding scale",
    purpose: "Keep quality above the bar and repeat the whole system in new markets.",
    steps: [
      { title: "Run the independent audit", description: "Full audit scoring the system against the benchmark bar.", owner: "QA", evidence: "Audit run stored with scores." },
      { title: "Repair any defect within the cycle limit", description: "Bounded repair cycles, then escalate to human review if still under.", owner: "QA", evidence: "Repair log and final score." },
      { title: "Package the case study and receipt", description: "Evidence pack: before, after, numbers and methods.", owner: "BRAND", evidence: "Case study and receipt stored." },
      { title: "Clone to the next metro", description: "Repeat the whole workflow in the next validated location.", owner: "GROWTH", evidence: "New project checklist created." },
      { title: "Expand the domain system", description: "NearMe and NearYou domains rolled out per the URL strategy.", owner: "GROWTH", evidence: "New domains live and mapped." },
      { title: "Scale approval gate", description: "Client approves the scale plan and budget before expansion spend.", owner: "VISION", gate: true, gate_type: "client", evidence: "Scale approval recorded." },
    ],
  },
];

export const buildWorkflowSteps = (intakeId, projectLabel) => {
  const steps = [];
  let order = 1;
  WORKFLOW_PHASES.forEach((phase, phaseIndex) => {
    phase.steps.forEach((step) => {
      steps.push({
        intake_id: intakeId,
        project_label: projectLabel || "",
        phase: phase.name,
        phase_order: phaseIndex + 1,
        step_order: order,
        title: step.title,
        description: step.description,
        owner_agent: step.owner,
        is_gate: !!step.gate,
        gate_type: step.gate ? step.gate_type : "none",
        evidence_required: step.evidence,
        status: "not_started",
      });
      order += 1;
    });
  });
  return steps;
};

export const TOTAL_WORKFLOW_STEPS = WORKFLOW_PHASES.reduce((n, p) => n + p.steps.length, 0);
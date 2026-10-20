// Onboarding choice catalog. Every option names the manual process it replaces, so the client
// is choosing an outcome, not a technology. Anything not listed is captured by the write-in.

export const BUSINESS_STAGES = [
  { id: "new_business", label: "Starting a new business", hint: "Nothing exists yet" },
  { id: "existing_business", label: "Existing business", hint: "Operating and looking to grow" },
  { id: "remain_and_grow", label: "Remain and grow", hint: "Keep it running, add leverage" },
  { id: "re_enter_market", label: "Re-enter the market", hint: "Coming back after a pause" },
  { id: "enhance_platform", label: "Enhance an existing platform", hint: "System exists, needs upgrading" },
];

export const GOAL_KINDS = [
  { id: "money", label: "Revenue target", unit: "$" },
  { id: "leads", label: "Qualified leads per month", unit: "leads" },
  { id: "traffic", label: "Monthly sessions", unit: "sessions" },
  { id: "authority", label: "Rankings and authority", unit: "score" },
  { id: "automation", label: "Hours of manual work removed", unit: "hrs" },
];

export const GOAL_HORIZONS = [
  { id: "3m", label: "3 months" },
  { id: "6m", label: "6 months" },
  { id: "12m", label: "12 months" },
  { id: "24m", label: "24 months" },
];

export const INDUSTRY_OPTIONS = [
  "Emergency plumbing", "HVAC", "Roofing", "Restoration", "Flooring", "Epoxy flooring",
  "Electrical", "Cleaning", "Landscaping", "Pest control", "Dental", "Medical",
  "Legal", "Auto repair", "Real estate", "Insurance", "Fitness", "Beauty and salon",
  "Construction", "Solar", "Moving", "Locksmith", "Towing", "Other",
];

export const TOOL_GROUPS = [
  {
    id: "lead_response",
    label: "Lead capture and response",
    replaces: "Missed calls, slow callbacks, leads sitting in an inbox",
    tools: [
      { id: "missed_call_textback", label: "Missed-call text back" },
      { id: "instant_quote", label: "Instant quote or estimate form" },
      { id: "online_booking", label: "Online booking calendar" },
      { id: "ai_receptionist", label: "AI receptionist / voice agent" },
      { id: "speed_to_lead", label: "Speed-to-lead auto response" },
      { id: "lead_scoring", label: "Lead scoring and routing" },
    ],
  },
  {
    id: "front_desk",
    label: "Front desk, scheduling and admin",
    replaces: "Phone tag, manual reminders, paper job sheets, chased invoices",
    tools: [
      { id: "auto_reminders", label: "Automated appointment reminders" },
      { id: "dispatch_routing", label: "Dispatch and route scheduling" },
      { id: "crm_sync", label: "CRM sync across every channel" },
      { id: "followup_sequences", label: "Automated follow-up sequences" },
      { id: "invoicing_payments", label: "Invoicing and payment collection" },
      { id: "documents", label: "Proposal and document generation" },
    ],
  },
  {
    id: "visibility",
    label: "Visibility, SEO and reputation",
    replaces: "Manual ranking checks, begging for reviews, one-off directory listings",
    tools: [
      { id: "local_pages", label: "Local service and city page engine" },
      { id: "gbp_management", label: "Google Business Profile management" },
      { id: "review_generation", label: "Automated review requests" },
      { id: "backlink_network", label: "Backlink and directory network" },
      { id: "aeo_geo", label: "AEO and GEO answer optimization" },
      { id: "ad_management", label: "Paid search and retargeting management" },
    ],
  },
  {
    id: "content_social",
    label: "Content, social and creative",
    replaces: "Posting by hand, no content calendar, no consistent brand voice",
    tools: [
      { id: "content_calendar", label: "30-day content calendar" },
      { id: "auto_posting", label: "Automated social posting" },
      { id: "ai_copy", label: "AI copywriting in your brand voice" },
      { id: "video_assets", label: "Short-form video generation" },
      { id: "image_flyers", label: "Flyer and image generation" },
      { id: "hashtag_engine", label: "Hashtag and keyword linking engine" },
    ],
  },
  {
    id: "sales",
    label: "Sales, follow-up and retention",
    replaces: "Quotes that go cold, no pipeline, no repeat-customer motion",
    tools: [
      { id: "pipeline_tracking", label: "Pipeline and deal tracking" },
      { id: "nurture_campaigns", label: "Nurture and re-engagement campaigns" },
      { id: "referral_program", label: "Referral and rewards program" },
      { id: "win_back", label: "Win-back campaigns for old customers" },
      { id: "pricing_tests", label: "Offer and pricing testing" },
      { id: "upsell_engine", label: "Upsell and maintenance plan offers" },
    ],
  },
  {
    id: "intelligence_ops",
    label: "Intelligence, agents and brand assets",
    replaces: "Guesswork on pricing, no competitor view, brand assets rebuilt each time",
    tools: [
      { id: "competitor_monitoring", label: "Competitor monitoring" },
      { id: "pricing_intelligence", label: "Pricing intelligence" },
      { id: "agent_operated", label: "Agent-operated system (chat + WhatsApp)" },
      { id: "digital_business_card", label: "Digital business card and QR" },
      { id: "apparel_assets", label: "Apparel and brand asset generation" },
      { id: "reporting", label: "Automated reporting dashboard" },
    ],
  },
];

export const ALL_TOOLS = TOOL_GROUPS.flatMap((g) =>
  g.tools.map((t) => ({ ...t, group: g.id, group_label: g.label, replaces: g.replaces }))
);
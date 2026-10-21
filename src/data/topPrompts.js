export const PROMPT_CATEGORIES = [
  "Website Building",
  "Website Self-Edit",
  "System Architecture",
  "Funnel Systems",
  "Reverse Engineering",
  "Validation & Testing",
  "Deployment & Launch"
];

export const TOP_PROMPTS = [
  // ── Website Building (1-10) ──
  {
    id: 1,
    category: "Website Building",
    title: "Ultra-High-Quality SaaS Landing Page",
    tags: ["landing", "saas", "conversion"],
    prompt: `ROLE: You are a senior front-end engineer and conversion designer.\nOBJECTIVE: Build a production-ready SaaS landing page that maximizes signups.\nCONTEXT: React + Tailwind CSS, responsive, accessible (WCAG 2.1 AA), Lighthouse 95+.\nINSTRUCTIONS:\n1. Hero with value prop, sub-headline, CTA, and product mockup.\n2. Social proof bar with logos and testimonials.\n3. Feature grid with icons and micro-copy.\n4. Pricing table with toggle (monthly/annual).\n5. FAQ accordion answering top 8 objections.\n6. Sticky nav with scroll-spy and mobile menu.\n7. Footer with links, newsletter, and legal.\nCONSTRAINTS: No placeholder text. All CTAs wired. Dark mode support. < 3s LCP.\nVALIDATION: Run Lighthouse, axe-core, and cross-browser check. Fix all issues.\nOUTPUT: Full component files + deploy instructions.`
  },
  {
    id: 2,
    category: "Website Building",
    title: "Full-Stack E-Commerce Storefront",
    tags: ["ecommerce", "cart", "checkout"],
    prompt: `ROLE: Senior full-stack engineer.\nOBJECTIVE: Build a complete e-commerce storefront with cart, checkout, and order management.\nINSTRUCTIONS:\n1. Product listing with filters, search, and pagination.\n2. Product detail with variants, reviews, and related items.\n3. Cart with quantity, coupons, and persistence.\n4. Checkout with shipping, tax, and payment (Stripe).\n5. Order confirmation and tracking page.\n6. Admin dashboard for products and orders.\nCONSTRAINTS: Server-side rendering for SEO. Optimistic UI. Error boundaries.\nVALIDATION: E2E test full purchase flow. Verify payment webhooks. Load test 1000 concurrent users.\nOUTPUT: All source files, schema, and seed data.`
  },
  {
    id: 3,
    category: "Website Building",
    title: "Animated Portfolio with Motion Design",
    tags: ["portfolio", "animation", "framer-motion"],
    prompt: `ROLE: Creative front-end developer.\nOBJECTIVE: Build a portfolio site with scroll-driven animations and micro-interactions.\nINSTRUCTIONS:\n1. Hero with kinetic typography and gradient mesh.\n2. Project grid with hover reveal and case-study modals.\n3. About section with timeline and skills animation.\n4. Contact form with validation and success state.\n5. Page transitions with shared layout animations.\nCONSTRAINTS: Framer Motion only. Respect prefers-reduced-motion. 60fps.\nVALIDATION: Performance audit. Accessibility check. Cross-device test.\nOUTPUT: Component files and asset list.`
  },
  {
    id: 4,
    category: "Website Building",
    title: "Admin Dashboard with Data Tables",
    tags: ["dashboard", "tables", "crud"],
    prompt: `ROLE: Senior front-end engineer.\nOBJECTIVE: Build a full admin dashboard with CRUD, filtering, and charts.\nINSTRUCTIONS:\n1. Sidebar nav with role-based sections.\n2. Data tables with sort, filter, pagination, and bulk actions.\n3. Create/edit modals with form validation.\n4. Charts (bar, line, pie) with date-range filters.\n5. Activity log and audit trail.\nCONSTRAINTS: Virtualized rows for 10k+ records. Debounced search. Optimistic updates.\nVALIDATION: Test CRUD lifecycle. Verify RLS. Check empty/loading/error states.\nOUTPUT: All components, API routes, and seed data.`
  },
  {
    id: 5,
    category: "Website Building",
    title: "Mobile-First PWA with Offline Support",
    tags: ["pwa", "mobile", "offline"],
    prompt: `ROLE: PWA specialist.\nOBJECTIVE: Build a mobile-first progressive web app with offline support.\nINSTRUCTIONS:\n1. App shell with bottom nav and swipe gestures.\n2. Service worker with cache-first strategy.\n3. Offline data sync with conflict resolution.\n4. Push notifications.\n5. Install prompt and app icon.\nCONSTRAINTS: < 100kb initial bundle. Lighthouse PWA score 100. No layout shift.\nVALIDATION: Test offline mode. Verify push delivery. Audit with Lighthouse.\nOUTPUT: Full PWA with manifest, service worker, and icons.`
  },
  {
    id: 6,
    category: "Website Building",
    title: "Accessible Blog with MDX",
    tags: ["blog", "mdx", "seo"],
    prompt: `ROLE: Content platform engineer.\nOBJECTIVE: Build a blog with MDX, syntax highlighting, and full SEO.\nINSTRUCTIONS:\n1. Article list with tags and featured images.\n2. Article page with TOC, reading time, and share.\n3. MDX components for callouts, code, and embeds.\n4. RSS feed and sitemap.\n5. Open Graph and structured data.\nCONSTRAINTS: Semantic HTML. Skip-to-content link. Focus traps. 100/100 SEO.\nVALIDATION: Validate structured data. Test screen reader. Check crawlability.\nOUTPUT: Blog engine, content schema, and sample posts.`
  },
  {
    id: 7,
    category: "Website Building",
    title: "Real-Time Collaboration Whiteboard",
    tags: ["realtime", "canvas", "collab"],
    prompt: `ROLE: Real-time systems engineer.\nOBJECTIVE: Build a collaborative whiteboard with live cursors and drawing.\nINSTRUCTIONS:\n1. Canvas with shapes, text, and freehand.\n2. Live cursors with user labels.\n3. Presence and room state.\n4. Undo/redo with history.\n5. Export to PNG and JSON.\nCONSTRAINTS: CRDT for conflict-free sync. 60fps rendering. Scale to 20 users.\nVALIDATION: Simulate concurrent edits. Test reconnection. Profile render loop.\nOUTPUT: Frontend, backend room service, and deployment config.`
  },
  {
    id: 8,
    category: "Website Building",
    title: "AI-Powered Chat Interface",
    tags: ["chat", "ai", "streaming"],
    prompt: `ROLE: AI product engineer.\nOBJECTIVE: Build a ChatGPT-style chat interface with streaming responses.\nINSTRUCTIONS:\n1. Message list with markdown rendering.\n2. Streaming response with typing indicator.\n3. Conversation history sidebar.\n4. Model selector and system prompt editor.\n5. Token counter and cost estimate.\nCONSTRAINTS: Abortable streams. Message persistence. Auto-scroll with override.\nVALIDATION: Test streaming. Verify persistence. Check token limits.\nOUTPUT: Chat UI, API route, and storage schema.`
  },
  {
    id: 9,
    category: "Website Building",
    title: "Multi-Tenant SaaS Application",
    tags: ["multitenant", "saas", "isolation"],
    prompt: `ROLE: SaaS architect.\nOBJECTIVE: Build a multi-tenant SaaS with tenant isolation and billing.\nINSTRUCTIONS:\n1. Tenant onboarding with subdomain or path routing.\n2. Row-level security per tenant.\n3. Role-based access (owner, admin, member).\n4. Usage metering and Stripe billing.\n5. Tenant settings and data export.\nCONSTRAINTS: No cross-tenant data leaks. Soft delete. Audit log.\nVALIDATION: Penetration test tenant boundaries. Verify RLS. Test billing webhooks.\nOUTPUT: Full app with auth, billing, and tenant management.`
  },
  {
    id: 10,
    category: "Website Building",
    title: "Component Design System Library",
    tags: ["design-system", "components", "storybook"],
    prompt: `ROLE: Design systems engineer.\nOBJECTIVE: Build a reusable component library with docs and theming.\nINSTRUCTIONS:\n1. Core primitives (Button, Input, Card, Dialog, etc.).\n2. Theme tokens for color, spacing, typography.\n3. Dark mode and density variants.\n4. Storybook with all states and props.\n5. NPM package config with tree-shaking.\nCONSTRAINTS: Zero runtime deps beyond React. Full TypeScript. Accessible by default.\nVALIDATION: Visual regression test. Accessibility audit. Bundle size check.\nOUTPUT: Library, Storybook, and publish config.`
  },

  // ── System Architecture (11-18) ──
  {
    id: 11,
    category: "System Architecture",
    title: "Microservices API Gateway",
    tags: ["microservices", "gateway", "api"],
    prompt: `ROLE: Distributed systems architect.\nOBJECTIVE: Design a microservices architecture with an API gateway.\nINSTRUCTIONS:\n1. Gateway with routing, auth, and rate limiting.\n2. Service definitions for each bounded context.\n3. Inter-service communication (event bus or gRPC).\n4. Shared auth and session management.\n5. Health checks and circuit breakers.\nCONSTRAINTS: Idempotent operations. Graceful degradation. < 50ms gateway overhead.\nVALIDATION: Load test each service. Verify circuit breaker behavior. Test failover.\nOUTPUT: Architecture diagram, service templates, and gateway config.`
  },
  {
    id: 12,
    category: "System Architecture",
    title: "Event-Driven System with Message Queue",
    tags: ["events", "queue", "async"],
    prompt: `ROLE: Event-driven systems engineer.\nOBJECTIVE: Build an event-driven system with reliable message delivery.\nINSTRUCTIONS:\n1. Event schema and versioning strategy.\n2. Producer and consumer services.\n3. Dead letter queue and retry policy.\n4. Event sourcing for audit trail.\n5. Replay and backfill capabilities.\nCONSTRAINTS: At-least-once delivery. Ordered where needed. Idempotent consumers.\nVALIDATION: Simulate consumer failures. Verify replay. Test ordering guarantees.\nOUTPUT: Event bus, schemas, and consumer templates.`
  },
  {
    id: 13,
    category: "System Architecture",
    title: "Real-Time Notification System",
    tags: ["realtime", "websocket", "notifications"],
    prompt: `ROLE: Real-time backend engineer.\nOBJECTIVE: Build a notification system with multiple delivery channels.\nINSTRUCTIONS:\n1. WebSocket connection manager with rooms.\n2. Notification queue and priority.\n3. Multi-channel delivery (push, email, in-app, SMS).\n4. User preferences and quiet hours.\n5. Read state and aggregation.\nCONSTRAINTS: Backpressure handling. Reconnection with backoff. Max 1M concurrent.\nVALIDATION: Load test connections. Verify delivery guarantees. Test quiet hours.\nOUTPUT: Notification service, client SDK, and admin tools.`
  },
  {
    id: 14,
    category: "System Architecture",
    title: "REST API with Full CRUD + Auth",
    tags: ["rest", "crud", "auth"],
    prompt: `ROLE: API engineer.\nOBJECTIVE: Build a production REST API with auth, validation, and docs.\nINSTRUCTIONS:\n1. Resource routes with CRUD operations.\n2. JWT auth with refresh tokens.\n3. Request validation and error handling.\n4. Pagination, filtering, and sorting.\n5. OpenAPI spec and auto-generated docs.\nCONSTRAINTS: Versioned API. Rate limiting. CORS config. No N+1 queries.\nVALIDATION: Contract test all endpoints. Verify auth flow. Check error formats.\nOUTPUT: API source, OpenAPI spec, and Postman collection.`
  },
  {
    id: 15,
    category: "System Architecture",
    title: "Database Schema with Indexes & Migrations",
    tags: ["database", "schema", "migrations"],
    prompt: `ROLE: Database engineer.\nOBJECTIVE: Design a normalized database schema with indexes and migrations.\nINSTRUCTIONS:\n1. Entity definitions with relationships.\n2. Indexes for all query patterns.\n3. Migration files with up/down.\n4. Seed data for development.\n5. Query optimization analysis.\nCONSTRAINTS: 3NF normalization. No premature denormalization. Foreign key constraints.\nVALIDATION: EXPLAIN ANALYZE top queries. Verify migration rollback. Test constraints.\nOUTPUT: Schema, migrations, seed data, and query analysis.`
  },
  {
    id: 16,
    category: "System Architecture",
    title: "Authentication & Authorization System",
    tags: ["auth", "rbac", "session"],
    prompt: `ROLE: Security engineer.\nOBJECTIVE: Build a complete auth system with RBAC and session management.\nINSTRUCTIONS:\n1. Registration with email verification.\n2. Login with JWT + refresh token rotation.\n3. Role-based access control (admin, user, guest).\n4. OAuth providers (Google, GitHub).\n5. Password reset and 2FA.\nCONSTRAINTS: HttpOnly cookies. CSRF protection. Brute force limiting. No token in localStorage.\nVALIDATION: Penetration test auth flows. Verify token expiry. Test OAuth.\nOUTPUT: Auth service, middleware, and client SDK.`
  },
  {
    id: 17,
    category: "System Architecture",
    title: "Caching Layer with Redis",
    tags: ["cache", "redis", "performance"],
    prompt: `ROLE: Performance engineer.\nOBJECTIVE: Build a caching layer that reduces database load by 80%.\nINSTRUCTIONS:\n1. Cache-aside pattern for reads.\n2. Write-through for critical data.\n3. TTL and eviction policies.\n4. Cache invalidation strategy.\n5. Fallback and circuit breaker.\nCONSTRAINTS: No stale data > 5s. Graceful degradation. Memory limit.\nVALIDATION: Load test with/without cache. Verify invalidation. Test memory limits.\nOUTPUT: Cache service, config, and benchmark report.`
  },
  {
    id: 18,
    category: "System Architecture",
    title: "Background Job Queue System",
    tags: ["queue", "jobs", "workers"],
    prompt: `ROLE: Backend systems engineer.\nOBJECTIVE: Build a background job queue with workers and monitoring.\nINSTRUCTIONS:\n1. Job producer and enqueuer.\n2. Worker pool with concurrency control.\n3. Retry with exponential backoff.\n4. Dead letter handling.\n5. Dashboard for job monitoring.\nCONSTRAINTS: At-least-once execution. Idempotent jobs. Max retry limit.\nVALIDATION: Test job failures. Verify retry. Monitor queue depth.\nOUTPUT: Queue system, worker template, and monitoring dashboard.`
  },

  // ── Funnel Systems (19-26) ──
  {
    id: 19,
    category: "Funnel Systems",
    title: "Lead Magnet Funnel with Opt-In",
    tags: ["lead-magnet", "opt-in", "email"],
    prompt: `ROLE: Conversion funnel engineer.\nOBJECTIVE: Build a lead magnet funnel that captures and nurtures leads.\nINSTRUCTIONS:\n1. Landing page with lead magnet offer.\n2. Opt-in form with progressive profiling.\n3. Double opt-in email verification.\n4. Instant delivery of the lead magnet.\n5. Welcome sequence (5 emails) with engagement tracking.\nCONSTRAINTS: GDPR consent. Unsubscribe link. Mobile-optimized form.\nVALIDATION: Test full flow. Verify email delivery. Check conversion tracking.\nOUTPUT: Landing page, email templates, and automation flow.`
  },
  {
    id: 20,
    category: "Funnel Systems",
    title: "Webinar Registration Funnel",
    tags: ["webinar", "registration", "reminder"],
    prompt: `ROLE: Funnel builder.\nOBJECTIVE: Build a webinar registration funnel with reminders and replay.\nINSTRUCTIONS:\n1. Registration page with limited spots.\n2. Confirmation email with calendar invite.\n3. Reminder sequence (24h, 1h, 10m before).\n4. Live webinar page with chat.\n5. Replay page for non-attendees.\nCONSTRAINTS: Timezone-aware. Capacity limit. Spam protection.\nVALIDATION: Test registration. Verify reminders. Check replay access.\nOUTPUT: Registration flow, email templates, and webinar page.`
  },
  {
    id: 21,
    category: "Funnel Systems",
    title: "Product Launch Funnel",
    tags: ["launch", "sequence", "scarcity"],
    prompt: `ROLE: Launch strategist and engineer.\nOBJECTIVE: Build a product launch funnel with pre-launch, launch, and post-launch.\nINSTRUCTIONS:\n1. Teaser page with waitlist.\n2. Pre-launch content sequence (3 emails).\n3. Launch page with countdown and pricing.\n4. Cart page with order bump and upsell.\n5. Post-launch follow-up for non-buyers.\nCONSTRAINTS: Scarcity with real limits. Urgency without deception. Mobile checkout.\nVALIDATION: Test cart flow. Verify countdown. Check email sequence timing.\nOUTPUT: Full funnel pages, email templates, and automation.`
  },
  {
    id: 22,
    category: "Funnel Systems",
    title: "SaaS Free-Trial Onboarding Funnel",
    tags: ["saas", "trial", "onboarding"],
    prompt: `ROLE: SaaS growth engineer.\nOBJECTIVE: Build a trial onboarding funnel that drives activation.\nINSTRUCTIONS:\n1. Signup with progressive onboarding wizard.\n2. Activation checklist with progress tracking.\n3. Behavioral emails based on usage.\n4. In-app nudges for key actions.\n5. Trial-expiry sequence with upgrade CTA.\nCONSTRAINTS: Track activation event. Segment by behavior. No spam.\nVALIDATION: Test onboarding flow. Verify email triggers. Check upgrade path.\nOUTPUT: Onboarding flow, email templates, and tracking plan.`
  },
  {
    id: 23,
    category: "Funnel Systems",
    title: "Email Nurture Sequence Builder",
    tags: ["email", "nurture", "automation"],
    prompt: `ROLE: Email automation engineer.\nOBJECTIVE: Build a visual email sequence builder with branching logic.\nINSTRUCTIONS:\n1. Drag-and-drop sequence canvas.\n2. Email node with template editor.\n3. Branch nodes (if/then based on behavior).\n4. Delay nodes with timezone support.\n5. Analytics per email and per step.\nCONSTRAINTS: CAN-SPAM compliant. Unsubscribe on every email. Throttle to avoid spam filters.\nVALIDATION: Test branching logic. Verify delays. Check deliverability.\nOUTPUT: Sequence builder, email templates, and analytics dashboard.`
  },
  {
    id: 24,
    category: "Funnel Systems",
    title: "Upsell & Cross-Sell Funnel",
    tags: ["upsell", "cross-sell", "ltv"],
    prompt: `ROLE: Revenue optimization engineer.\nOBJECTIVE: Build an upsell/cross-sell funnel that increases LTV.\nINSTRUCTIONS:\n1. Post-purchase upsell page (one-click).\n2. Cross-sell recommendations based on purchase.\n3. Bundle offer with countdown.\n4. Email sequence for non-converters.\n5. Loyalty tier with rewards.\nCONSTRAINTS: Relevant recommendations only. No dark patterns. Easy decline.\nVALIDATION: Test upsell flow. Verify one-click. Check recommendation logic.\nOUTPUT: Upsell pages, recommendation engine, and email flow.`
  },
  {
    id: 25,
    category: "Funnel Systems",
    title: "Booking & Scheduling Funnel",
    tags: ["booking", "scheduling", "calendar"],
    prompt: `ROLE: Scheduling systems engineer.\nOBJECTIVE: Build a booking funnel with calendar sync and reminders.\nINSTRUCTIONS:\n1. Booking page with availability calendar.\n2. Timezone detection and conversion.\n3. Google/Outlook calendar sync.\n4. Confirmation and reminder emails.\n5. Reschedule and cancel flow.\nCONSTRAINTS: No double-booking. Buffer time between meetings. Max bookings per day.\nVALIDATION: Test booking. Verify calendar sync. Check timezone handling.\nOUTPUT: Booking page, calendar integration, and reminder flow.`
  },
  {
    id: 26,
    category: "Funnel Systems",
    title: "Membership & Gated Content Funnel",
    tags: ["membership", "gated", "content"],
    prompt: `ROLE: Membership platform engineer.\nOBJECTIVE: Build a membership funnel with gated content and tiers.\nINSTRUCTIONS:\n1. Membership tiers with feature comparison.\n2. Gated content with access control.\n3. Member dashboard with progress tracking.\n4. Drip content schedule.\n5. Renewal and cancellation flow.\nCONSTRAINTS: Secure access tokens. Content dripping. Proration on upgrade.\nVALIDATION: Test access control. Verify drip. Check renewal billing.\nOUTPUT: Membership system, gated content, and member dashboard.`
  },

  // ── Reverse Engineering (27-34) ──
  {
    id: 27,
    category: "Reverse Engineering",
    title: "Reverse-Engineer Any URL — Full Site Analysis",
    tags: ["analyze", "url", "audit"],
    prompt: `ROLE: Web analyst and reverse-engineer.\nOBJECTIVE: Analyze any URL and produce a complete technical and structural breakdown.\nINSTRUCTIONS:\n1. Fetch the URL and parse the DOM.\n2. Identify the framework (React, Vue, Next, etc.).\n3. Extract the page structure (sections, components, layout).\n4. Catalog all assets (JS, CSS, fonts, images).\n5. Detect the tech stack (hosting, CDN, analytics, fonts).\n6. Map the navigation and page hierarchy.\n7. Extract content, copy, and metadata.\n8. Produce a structured JSON report.\nCONSTRAINTS: Respect robots.txt. No authentication bypass. Public pages only.\nVALIDATION: Cross-check detected stack with Wappalyzer. Verify structure matches DOM.\nOUTPUT: JSON report with structure, stack, assets, and content map.`
  },
  {
    id: 28,
    category: "Reverse Engineering",
    title: "Design Replica — Pixel-Accurate Clone",
    tags: ["design", "replica", "clone"],
    prompt: `ROLE: Front-end engineer and design clone specialist.\nOBJECTIVE: Recreate a pixel-accurate replica of a target website's design.\nINSTRUCTIONS:\n1. Analyze the target URL's visual design (colors, fonts, spacing).\n2. Extract the color palette and typography scale.\n3. Map the layout grid and component structure.\n4. Identify animations and interactions.\n5. Rebuild each section as a React component.\n6. Match spacing, shadows, and border radius.\n7. Replicate responsive breakpoints.\n8. Add the same micro-interactions.\nCONSTRAINTS: Recreate design, not copy proprietary content or assets. Use placeholder text.\nVALIDATION: Side-by-side visual comparison. Responsive check at 3 breakpoints.\nOUTPUT: Full component library matching the target design.`
  },
  {
    id: 29,
    category: "Reverse Engineering",
    title: "Code Structure Inference",
    tags: ["code", "structure", "inference"],
    prompt: `ROLE: Code archaeologist.\nOBJECTIVE: Infer the code structure and architecture from a live site.\nINSTRUCTIONS:\n1. Analyze bundle files and source maps.\n2. Identify component patterns and state management.\n3. Detect routing structure and page list.\n4. Infer API endpoints from network calls.\n5. Map data flow and state shape.\n6. Produce a project structure tree.\nCONSTRAINTS: Use only public data. No deobfuscation of malicious code.\nVALIDATION: Verify inferred endpoints respond. Check structure against page behavior.\nOUTPUT: Inferred project structure, component tree, and API map.`
  },
  {
    id: 30,
    category: "Reverse Engineering",
    title: "API Reverse-Engineering",
    tags: ["api", "endpoints", "reverse"],
    prompt: `ROLE: API analyst.\nOBJECTIVE: Reverse-engineer a site's API by observing network traffic.\nINSTRUCTIONS:\n1. Catalog all XHR/fetch requests.\n2. Identify REST vs GraphQL patterns.\n3. Extract endpoint paths, methods, and params.\n4. Infer request/response schemas.\n5. Detect auth mechanism (cookie, bearer, custom).\n6. Map pagination and filtering patterns.\n7. Produce an OpenAPI spec.\nCONSTRAINTS: Public endpoints only. No auth bypass. Rate-limit respectfully.\nVALIDATION: Replay requests and verify responses. Validate schema against samples.\nOUTPUT: OpenAPI spec, auth model, and request examples.`
  },
  {
    id: 31,
    category: "Reverse Engineering",
    title: "Database Schema Inference",
    tags: ["database", "schema", "inference"],
    prompt: `ROLE: Data modeler.\nOBJECTIVE: Infer the database schema behind a web application.\nINSTRUCTIONS:\n1. Analyze API responses for entity shapes.\n2. Identify relationships (1:1, 1:N, N:M).\n3. Infer field types and constraints.\n4. Detect soft deletes and timestamps.\n5. Map indexes from query patterns.\n6. Produce an ER diagram.\nCONSTRAINTS: Infer from public data only. No SQL injection.\nVALIDATION: Cross-check relationships across endpoints. Verify field types.\nOUTPUT: ER diagram, schema definition, and relationship map.`
  },
  {
    id: 32,
    category: "Reverse Engineering",
    title: "UX Flow Mapping",
    tags: ["ux", "flow", "journey"],
    prompt: `ROLE: UX analyst.\nOBJECTIVE: Map the complete user journey and UX flow of a target site.\nINSTRUCTIONS:\n1. Identify all entry points and landing pages.\n2. Map the primary conversion flow.\n3. Document secondary flows (search, filter, account).\n4. Catalog UI patterns (modals, drawers, toasts).\n5. Identify state transitions and error states.\n6. Produce a flow diagram.\nCONSTRAINTS: Document, don't copy. Focus on patterns, not content.\nVALIDATION: Walk through each flow. Verify all states are covered.\nOUTPUT: Flow diagram, pattern catalog, and state machine.`
  },
  {
    id: 33,
    category: "Reverse Engineering",
    title: "Tech Stack Detection",
    tags: ["stack", "detection", "wappalyzer"],
    prompt: `ROLE: Tech stack detective.\nOBJECTIVE: Detect the full technology stack of any website.\nINSTRUCTIONS:\n1. Analyze HTTP headers and server signatures.\n2. Detect framework from DOM attributes and script patterns.\n3. Identify CDN, hosting, and DNS providers.\n4. Catalog analytics, marketing, and A/B tools.\n5. Detect payment and auth providers.\n6. Identify fonts, icons, and UI libraries.\n7. Produce a categorized tech report.\nCONSTRAINTS: Use only public signals. No probing for vulnerabilities.\nVALIDATION: Cross-reference with Wappalyzer and BuiltWith.\nOUTPUT: Categorized tech stack report with confidence scores.`
  },
  {
    id: 34,
    category: "Reverse Engineering",
    title: "Full System Replica & Rebuild",
    tags: ["replica", "rebuild", "clone"],
    prompt: `ROLE: Full-stack system architect.\nOBJECTIVE: Reverse-engineer a target site and rebuild a functional replica.\nINSTRUCTIONS:\n1. Analyze the target URL (structure, stack, API, design).\n2. Produce a technical spec document.\n3. Design the database schema from inferred models.\n4. Build the API layer matching inferred endpoints.\n5. Rebuild the frontend with the same design system.\n6. Implement the same UX flows and interactions.\n7. Add all detected features and integrations.\n8. Validate the replica against the original.\nCONSTRAINTS: Rebuild functionality, don't copy proprietary content/assets. Use original content as placeholder only.\nVALIDATION: Feature parity checklist. Side-by-side comparison. E2E test all flows.\nOUTPUT: Full replica codebase, schema, and deploy config.`
  },

  // ── Validation & Testing (35-42) ──
  {
    id: 35,
    category: "Validation & Testing",
    title: "Cross-Browser Compatibility Validator",
    tags: ["cross-browser", "compatibility", "test"],
    prompt: `ROLE: QA engineer.\nOBJECTIVE: Validate a web app across all major browsers and devices.\nINSTRUCTIONS:\n1. Define test matrix (Chrome, Firefox, Safari, Edge + iOS/Android).\n2. Run visual regression on each browser.\n3. Test all interactive flows.\n4. Check CSS feature support and fallbacks.\n5. Verify polyfills load correctly.\n6. Produce a compatibility report with fixes.\nCONSTRAINTS: Test real browsers, not just emulators. Cover last 2 versions.\nVALIDATION: Screenshot diff < 2%. All flows pass on all targets.\nOUTPUT: Compatibility report, screenshots, and fix list.`
  },
  {
    id: 36,
    category: "Validation & Testing",
    title: "Performance Audit & Optimization",
    tags: ["performance", "lighthouse", "optimization"],
    prompt: `ROLE: Performance engineer.\nOBJECTIVE: Audit and optimize a web app to Lighthouse 95+.\nINSTRUCTIONS:\n1. Run Lighthouse on all key pages.\n2. Analyze LCP, FID, CLS, TTFB.\n3. Identify render-blocking resources.\n4. Optimize images (WebP, lazy load, srcset).\n5. Code-split and tree-shake bundles.\n6. Add resource hints (preload, prefetch).\n7. Inline critical CSS.\n8. Re-run Lighthouse and verify scores.\nCONSTRAINTS: No layout shift. < 3s LCP on 3G. < 100kb initial JS.\nVALIDATION: Lighthouse > 95 all categories. Core Web Vitals pass.\nOUTPUT: Audit report, before/after metrics, and optimization diff.`
  },
  {
    id: 37,
    category: "Validation & Testing",
    title: "Security Vulnerability Scan",
    tags: ["security", "vulnerability", "scan"],
    prompt: `ROLE: Security auditor.\nOBJECTIVE: Scan a web app for vulnerabilities and produce a fix plan.\nINSTRUCTIONS:\n1. Check for XSS, CSRF, SQLi, and SSRF.\n2. Verify auth and session security.\n3. Scan dependencies for CVEs.\n4. Check headers (CSP, HSTS, X-Frame-Options).\n5. Test for IDOR and access control issues.\n6. Verify secrets are not exposed.\n7. Produce a prioritized fix plan.\nCONSTRAINTS: Authorized testing only. No destructive actions.\nVALIDATION: Re-scan after fixes. Verify all criticals resolved.\nOUTPUT: Vulnerability report, severity matrix, and fix plan.`
  },
  {
    id: 38,
    category: "Validation & Testing",
    title: "Accessibility Audit (WCAG 2.1 AA)",
    tags: ["accessibility", "wcag", "audit"],
    prompt: `ROLE: Accessibility consultant.\nOBJECTIVE: Audit a web app for WCAG 2.1 AA compliance and fix all issues.\nINSTRUCTIONS:\n1. Run automated scan (axe-core, Lighthouse).\n2. Manual keyboard navigation test.\n3. Screen reader test (NVDA, VoiceOver).\n4. Color contrast check (4.5:1 text, 3:1 large).\n5. Verify ARIA labels and roles.\n6. Check focus management and skip links.\n7. Test all forms for labels and error states.\n8. Fix all issues and re-verify.\nCONSTRAINTS: 100% keyboard accessible. All images have alt. No color-only indicators.\nVALIDATION: axe-core 0 violations. Manual test passes.\nOUTPUT: Audit report, fix diff, and compliance checklist.`
  },
  {
    id: 39,
    category: "Validation & Testing",
    title: "End-to-End Test Suite",
    tags: ["e2e", "playwright", "test"],
    prompt: `ROLE: E2E test engineer.\nOBJECTIVE: Build a comprehensive E2E test suite covering all critical flows.\nINSTRUCTIONS:\n1. Identify critical user journeys.\n2. Write Playwright tests for each flow.\n3. Add visual regression snapshots.\n4. Set up test data and cleanup.\n5. Add CI integration.\n6. Test auth, CRUD, payments, and edge cases.\n7. Generate coverage report.\nCONSTRAINTS: Tests must be deterministic. No shared state. Parallelizable.\nVALIDATION: 100% pass rate. All critical paths covered.\nOUTPUT: Test suite, CI config, and coverage report.`
  },
  {
    id: 40,
    category: "Validation & Testing",
    title: "Load & Stress Testing",
    tags: ["load", "stress", "performance"],
    prompt: `ROLE: Performance test engineer.\nOBJECTIVE: Load-test a system to find breaking points and optimize.\nINSTRUCTIONS:\n1. Define load profiles (normal, peak, spike).\n2. Write k6 or Artillery test scripts.\n3. Ramp up to 10x expected traffic.\n4. Monitor CPU, memory, and response times.\n5. Identify bottlenecks.\n6. Optimize and re-test.\n7. Produce a capacity report.\nCONSTRAINTS: No production data corruption. Gradual ramp-up.\nVALIDATION: P95 < 500ms at target load. No errors at 2x peak.\nOUTPUT: Load test scripts, results, and capacity plan.`
  },
  {
    id: 41,
    category: "Validation & Testing",
    title: "Visual Regression Testing",
    tags: ["visual", "regression", "snapshot"],
    prompt: `ROLE: Visual QA engineer.\nOBJECTIVE: Set up visual regression testing to catch unintended UI changes.\nINSTRUCTIONS:\n1. Capture baseline screenshots of all pages.\n2. Set up Playwright/Chromatic with snapshot diffing.\n3. Configure threshold and ignore regions.\n4. Integrate with CI on every PR.\n5. Add component-level snapshots.\n6. Test light/dark and responsive variants.\nCONSTRAINTS: Deterministic rendering. Fixed viewport. No flaky animations.\nVALIDATION: Diff < 0.1% threshold. No false positives.\nOUTPUT: Visual regression suite, baselines, and CI config.`
  },
  {
    id: 42,
    category: "Validation & Testing",
    title: "Production Readiness Checklist",
    tags: ["production", "readiness", "checklist"],
    prompt: `ROLE: DevOps engineer.\nOBJECTIVE: Validate an app is production-ready with a comprehensive checklist.\nINSTRUCTIONS:\n1. Verify env vars and secrets are set.\n2. Check error monitoring (Sentry) is configured.\n3. Verify logging and log levels.\n4. Test health check endpoint.\n5. Verify backup and restore process.\n6. Check SSL and security headers.\n7. Verify rate limiting and WAF.\n8. Test rollback procedure.\n9. Document runbook for incidents.\nCONSTRAINTS: No secrets in code. No debug mode. Graceful shutdown.\nVALIDATION: All checklist items pass. Simulate an incident.\nOUTPUT: Readiness report, runbook, and deployment config.`
  },

  // ── Deployment & Launch (43-50) ──
  {
    id: 43,
    category: "Deployment & Launch",
    title: "Deploy to Vercel — Full Setup",
    tags: ["vercel", "deploy", "ci"],
    prompt: `ROLE: DevOps engineer.\nOBJECTIVE: Deploy a web app to Vercel with full CI/CD and config.\nINSTRUCTIONS:\n1. Create vercel.json with build and routing config.\n2. Set environment variables in Vercel.\n3. Configure build command and output directory.\n4. Set up preview deployments for PRs.\n5. Configure custom domain with DNS.\n6. Enable edge functions where needed.\n7. Set up deployment notifications.\n8. Verify production deployment.\nCONSTRAINTS: No secrets in vercel.json. Atomic deploys. Instant rollback.\nVALIDATION: Verify build passes. Test preview. Check production URL.\nOUTPUT: vercel.json, env var list, and deployment guide.`
  },
  {
    id: 44,
    category: "Deployment & Launch",
    title: "Google Cloud Console Project Setup",
    tags: ["gcp", "console", "cloud"],
    prompt: `ROLE: Cloud architect.\nOBJECTIVE: Set up a Google Cloud project with all required services.\nINSTRUCTIONS:\n1. Create GCP project and enable APIs.\n2. Set up service accounts with least privilege.\n3. Configure Cloud Run or App Engine deployment.\n4. Set up Cloud SQL or Firestore.\n5. Configure Cloud Storage for assets.\n6. Set up Cloud CDN and load balancer.\n7. Configure IAM roles and permissions.\n8. Set up billing alerts and budgets.\nCONSTRAINTS: Least privilege IAM. No keys in code. Region-optimized.\nVALIDATION: Verify service health. Test IAM. Check billing alerts.\nOUTPUT: Terraform/config, IAM policy, and setup guide.`
  },
  {
    id: 45,
    category: "Deployment & Launch",
    title: "Google Analytics 4 Integration",
    tags: ["analytics", "ga4", "tracking"],
    prompt: `ROLE: Analytics engineer.\nOBJECTIVE: Integrate GA4 with full event tracking and consent.\nINSTRUCTIONS:\n1. Create GA4 property and data stream.\n2. Install gtag or Google Tag Manager.\n3. Define event taxonomy (page_view, sign_up, purchase, etc.).\n4. Track custom events with parameters.\n5. Set up consent mode v2.\n6. Configure enhanced measurement.\n7. Link Google Ads for conversion tracking.\n8. Verify events in DebugView.\nCONSTRAINTS: GDPR consent before tracking. Anonymize IPs. Respect Do Not Track.\nVALIDATION: Verify all events in DebugView. Check consent flow.\nOUTPUT: GA4 config, event plan, and tracking code.`
  },
  {
    id: 46,
    category: "Deployment & Launch",
    title: "CI/CD Pipeline with GitHub Actions",
    tags: ["ci", "cd", "github-actions"],
    prompt: `ROLE: CI/CD engineer.\nOBJECTIVE: Build a CI/CD pipeline that tests, builds, and deploys automatically.\nINSTRUCTIONS:\n1. Lint and type-check on PR.\n2. Run unit and E2E tests.\n3. Build production bundle.\n4. Deploy preview on PR.\n5. Deploy to production on main merge.\n6. Run security scan.\n7. Notify on success/failure.\n8. Support manual rollback.\nCONSTRAINTS: Cache dependencies. Fail fast. No secrets in logs.\nVALIDATION: Test full pipeline. Verify rollback. Check notifications.\nOUTPUT: GitHub Actions workflows, secrets list, and pipeline docs.`
  },
  {
    id: 47,
    category: "Deployment & Launch",
    title: "Custom Domain & DNS Configuration",
    tags: ["domain", "dns", "ssl"],
    prompt: `ROLE: Infrastructure engineer.\nOBJECTIVE: Configure a custom domain with DNS, SSL, and CDN.\nINSTRUCTIONS:\n1. Add DNS records (A, CNAME, MX, TXT).\n2. Configure apex and www subdomain.\n3. Set up SSL certificate (auto-renew).\n4. Configure CDN with edge locations.\n5. Set up redirect rules (http→https, www→apex).\n6. Verify email delivery (SPF, DKIM, DMARC).\n7. Test DNS propagation.\nCONSTRAINTS: No SSL warnings. 301 redirects. DNSSEC where supported.\nVALIDATION: Verify SSL grade (A+). Check redirects. Test email auth.\nOUTPUT: DNS config, SSL setup, and verification report.`
  },
  {
    id: 48,
    category: "Deployment & Launch",
    title: "Environment Management (Dev/Staging/Prod)",
    tags: ["environments", "staging", "config"],
    prompt: `ROLE: Platform engineer.\nOBJECTIVE: Set up dev, staging, and production environments with proper isolation.\nINSTRUCTIONS:\n1. Define environment config schema.\n2. Set up per-environment env vars and secrets.\n3. Configure separate databases per environment.\n4. Set up data sync from prod to staging (sanitized).\n5. Configure deployment promotion (dev→staging→prod).\n6. Add feature flags for gradual rollout.\n7. Set up environment-specific monitoring.\nCONSTRAINTS: No prod secrets in dev. Sanitize PII in staging. Isolated networks.\nVALIDATION: Verify isolation. Test promotion. Check feature flags.\nOUTPUT: Environment config, promotion pipeline, and feature flag setup.`
  },
  {
    id: 49,
    category: "Deployment & Launch",
    title: "Monitoring & Alerting Setup",
    tags: ["monitoring", "alerting", "observability"],
    prompt: `ROLE: SRE engineer.\nOBJECTIVE: Set up monitoring, alerting, and observability for production.\nINSTRUCTIONS:\n1. Set up error tracking (Sentry).\n2. Configure uptime monitoring.\n3. Set up log aggregation.\n4. Define alert rules (error rate, latency, uptime).\n5. Configure alert channels (Slack, email, PagerDuty).\n6. Set up dashboards (traffic, errors, performance).\n7. Define SLA and SLO targets.\n8. Create incident response runbook.\nCONSTRAINTS: No alert fatigue. Actionable alerts only. 24/7 for criticals.\nVALIDATION: Trigger test alerts. Verify dashboards. Test on-call.\nOUTPUT: Monitoring config, alert rules, dashboards, and runbook.`
  },
  {
    id: 50,
    category: "Deployment & Launch",
    title: "Full Launch: Build, Validate, Deploy, Track",
    tags: ["launch", "full", "deploy"],
    prompt: `ROLE: Launch engineer.\nOBJECTIVE: Execute a full production launch from build to analytics.\nINSTRUCTIONS:\n1. Run final build and all tests (unit, E2E, accessibility).\n2. Run security scan and fix all criticals.\n3. Verify Lighthouse 95+ on all pages.\n4. Deploy to Vercel with production env vars.\n5. Configure custom domain and SSL.\n6. Set up Google Cloud Console services.\n7. Install GA4 with consent mode.\n8. Set up error monitoring and alerts.\n9. Verify all integrations (auth, payments, email).\n10. Run smoke tests on production.\n11. Enable analytics dashboards.\n12. Document rollback plan.\nCONSTRAINTS: No downtime. Atomic deploy. Instant rollback capability.\nVALIDATION: All tests pass. Production smoke test green. Analytics firing.\nOUTPUT: Deployment, monitoring, analytics, and rollback documentation.`
  },

  // ── Website Self-Edit (51) ──
  {
    id: 51,
    category: "Website Self-Edit",
    title: "Edit This Website Itself — Capabilities, Palette, Agents and Gates",
    tags: ["self-edit", "pages", "palette", "agents", "workflows", "seo"],
    prompt: `ROLE: You are the senior product engineer who maintains THIS website — the site you are running on, not a new one.
OBJECTIVE: Make the change described here, in place, on this site.
CONTEXT: Prompt system, simulator, preview, QA agent, validation agent, suggestion agent and test agent are available and may be run without limit. Work the loop until the validator passes with no hard-gate failure.
STEP-BY-STEP INSTRUCTIONS:
1. Read the target page and its neighbours first; treat their structure, spacing and copy as the baseline to improve on.
2. Apply only the capabilities requested. Every capability named below must be implemented, not summarised.
   PAGES & ROUTES: add, remove, rename, re-route, duplicate, reorder, metadata, navigation, footer links, breadcrumbs, redirects, 404, deep links preserved.
   CONTENT: copy, headlines, calls to action, testimonials (verified only), FAQ, pricing, articles, case studies, gallery, form copy, microcopy, legal pages, localisation.
   STRUCTURE: hero, section order, grids, spacing, containers, sticky header, sidebar, footer, responsive behaviour at 390/768/1024/1440.
   DESIGN SYSTEM: fonts, pairing, colour system, colour effects, dark mode, radius, shadows, borders, icons, gradients, motion, logo, tokens.
   COMPONENTS: add, edit and remove components; buttons, cards, modals, tabs, accordions, tables, charts, carousels, form validation, loading/empty/error states, tooltips.
   MEDIA: images at the right sizes with real alt text, video with captions, SVG art, favicon, social cards, private uploads with signed access.
   NAVIGATION: information architecture, mega menu, mobile nav, site search, server-side filters, pagination, sitemap page, internal linking, related content.
   FORMS & FUNNELS: lead capture, quote request, booking, checkout, upsell, multi-step, survey, thank-you, gated content, CRM handoff, abandonment recovery.
   TOOLS: analytics, tag manager, chat widget, calendar, payments, email, CRM, maps, embeds, API endpoints, webhooks, connected services over new credentials.
   TEMPLATES: add and edit templates, theme presets, section library, industry layout, cloned sections, template bindings.
   AGENTS: add an agent with role, least-privilege tools, channels, memory, schedule, permissions and an in-app surface.
   WORKFLOWS: triggers, conditions, delays, retries, automations, self-operating systems, autonomy level, guardrails.
   DATA: entities, fields, relationships, seed data, import/export, reversible migrations, permissions on every record type, audit trail, backups.
   SEO/AEO/GEO: unique titles and descriptions, structured data, sitemap, robots, canonicals, Open Graph, quotable answers, citable specifics, local signals, programmatic location pages, hreflang, index gates, Core Web Vitals, content depth.
   LOCATIONS: locations, location pages, service areas, maps, LocalBusiness schema, near-me pages, geo targets, accurate hours and contact.
   SOCIAL: connected accounts, scheduling, links, sharing, feed embeds, cross-posting, message routing.
   GROWTH: digital domination playbook, authority, backlinks, competitor parity, benchmark parity, offer engineering, lead magnets, retargeting, referral, variants, A/B testing, funnel math, monetisation.
   PERFORMANCE: budget, code splitting, caching, lazy loading, resource hints, error monitoring, uptime, load testing.
   ACCESSIBILITY & COMPLIANCE: WCAG 2.1 AA, keyboard operation, ARIA, contrast, reduced motion, cookie consent, privacy, CCPA, terms, honest claims.
   COMMERCE: products, tiers, cart, checkout, subscriptions, discounts, tax and shipping, invoices.
   SECURITY & GOVERNANCE: security headers, input validation, rate limiting, secrets server-side, auth flows, sessions, release gates, rollback, approvals, environments.
   PLATFORM: deploy, domains, SSL, GitHub sync, staging, infrastructure, backup and restore.
   ANALYTICS: event taxonomy, Search Console, conversion tracking, dashboards, attribution, funnel analytics.
3. Apply the colour system exactly: main, accent, third, font and background colour as given, with the chosen colour effect applied consistently across every surface, state and component.
4. Benchmark the result against the chosen benchmark page or URL, region by region, and match or exceed it. Where nothing was measured, say so rather than implying a comparison.
5. Run the agents: simulate the prompt, preview the artifact, validate it independently, test the document probe by probe, and judge the copy for SEO, GEO and AEO. Iterate until the validator passes.
CONSTRAINTS:
- Do not break working functionality; change only what was asked.
- Keep every existing route resolving; redirect anything that moves.
- Keep the existing brand identity, logo and established palette unless the palette is what was changed.
- No new dependencies, no external assets, no placeholder or filler copy, no invented testimonials, logos, awards or statistics.
- No inline event handlers, no client-side secrets, no dark patterns, no automatic deploy, no production writes.
- Destructive operations stay admin-only and reversible; a tested way back exists before anything lands.
VALIDATION CRITERIA: mobile-first at 390/768/1024/1440 with no horizontal overflow; WCAG 2.1 AA; every control works; loading, empty and error states present; metadata and structured data valid; Lighthouse 95+; independent validation 95+ with no hard-gate failure.
EDGE CASES: empty data, offline, slow network, long strings, deep links, a page with no content, a form submitted twice, an expired session.
OUTPUT FORMAT: the implementation in full, then a page-by-page change list with what was deliberately left alone, then the agent readouts, then anything that could not be evidenced, stated as unverified.`
  }
];
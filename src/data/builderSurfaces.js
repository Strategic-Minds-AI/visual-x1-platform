// The Base44 builder surfaces, mapped to what this app already does with each one.
// Researched from the platform documentation; "dashboard" means the surface stays in the
// app dashboard and nothing here pretends to replace it.

export const BUILDER_SURFACES = [
  {
    surface: "Workflows",
    gives_you: "Create and monitor automated multi-step tasks, with every run listed.",
    where_in_app: "/workflow-map",
    status: "covered",
    note:
      "This app's workflows (Job Assignment Sync, Daily Metrics to Sheets, Post-Deployment QA, and the two benchmark image runs) are shown step by step on the Workflow Map, and each run's outcome is recorded in the audit trail. The dashboard remains the place to create or pause a workflow."
  },
  {
    surface: "App settings",
    gives_you: "The app's name, general settings, visibility, security headers, cloning and the danger zone.",
    where_in_app: "",
    status: "dashboard_only",
    note:
      "Platform-owned. Nothing in this app duplicates unpublish, transfer or delete, because a mistake there is not recoverable from inside the app."
  },
  {
    surface: "Domains",
    gives_you: "The app URL, custom domains, and page redirects.",
    where_in_app: "",
    status: "dashboard_only",
    note:
      "The published app is served at https://visual-x1.base44.app, and that host is what the capture engine identifies itself as and what backlink sites point at. A custom domain is connected there, not here."
  },
  {
    surface: "App Users",
    gives_you: "Invite people to the live app, assign admin or user, review pending requests, export.",
    where_in_app: "",
    status: "dashboard_only",
    note:
      "Invitations are a platform action. In this app, work is assigned to agents (Agent roster in System Control) and to clients (Client Intake), not to app users. Anyone who should see all data must be made an admin there."
  },
  {
    surface: "Secrets",
    gives_you: "Store credentials for backend functions; values are write-only and never returned.",
    where_in_app: "/system-control",
    status: "partial",
    note:
      "Values are set in the dashboard. System Control's vault lists which secret names the system expects and whether each is set, and never reads a value. VERCEL_TOKEN, used by the Delivery Console, lives here."
  },
  {
    surface: "Logs",
    gives_you: "Runtime activity and function calls, with an errors-only filter.",
    where_in_app: "/agent-activity",
    status: "partial",
    note:
      "Agent reasoning, messages and job outcomes are recorded in this app's own audit trail and shown on Agent Activity and System Audit. Runtime and function logs stay in the dashboard, which is where a failed invocation's stack trace lives."
  },
  {
    surface: "API",
    gives_you: "The app's API reference and keys for data, functions and agents.",
    where_in_app: "",
    status: "dashboard_only",
    note:
      "Those keys belong to the platform and stay there. Inside the app, every backend function is called through the SDK — the Delivery Console and the ingestion agents are both driven that way rather than through a stored key."
  },
  {
    surface: "Analytics",
    gives_you: "Visitors and usage trends, plus session recordings when enabled.",
    where_in_app: "/analytics",
    status: "covered",
    note:
      "Job, agent and task analytics are computed from this app's own records, and backlink traffic comes through the connected Google Analytics account. Visitor analytics for the app itself stays in the dashboard."
  },
  {
    surface: "Integrations",
    gives_you: "Connect the app to other services through OAuth connectors.",
    where_in_app: "/system-control",
    status: "partial",
    note:
      "Google Tasks, Google Sheets and Google Analytics are authorized for this app and used by its sync functions; the connector list is declared in the backend. New connections are authorized from here in chat, which is the only place the consent step can run."
  },
  {
    surface: "Emails",
    gives_you: "Design and preview app emails, customize the platform's own emails, review performance.",
    where_in_app: "",
    status: "gap",
    note:
      "No email template has been authored for this app yet, so there is nothing to preview. Sends would go through a workflow's email step with a template under the app's own brand."
  }
];

export const STATUS_LABELS = {
  covered: "Covered here",
  partial: "Partly here",
  dashboard_only: "Dashboard only",
  gap: "Not built yet"
};
import {
  Bot,
  Clock,
  Code2,
  Database,
  GitBranch,
  Globe,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Lock,
  Mail,
  Megaphone,
  Plug,
  Server,
  Settings,
  Terminal,
  Users,
} from "lucide-react";

/**
 * The project dashboard's own menu, in the reference's order. Each entry names what
 * the section does FOR THIS PROJECT — the artifact on the canvas and the records that
 * carry its name — because that is the scope: never another app's settings, and never
 * the operator console's own sections.
 *
 * `isNew` marks the entry the reference badges as new.
 */
export const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard, blurb: "The artifact and every run recorded against it" },
  { id: "users", label: "App Users", Icon: Users, blurb: "Who can sign in to the app this project belongs to" },
  { id: "data", label: "Data", Icon: Database, blurb: "The records behind this project" },
  { id: "analytics", label: "Analytics", Icon: LineChart, blurb: "Build, test and release activity" },
  { id: "marketing", label: "Marketing", Icon: Megaphone, blurb: "This artifact's copy, and the app's campaigns" },
  { id: "domains", label: "Domains", Icon: Globe, blurb: "Where this project is live" },
  { id: "integrations", label: "Integrations", Icon: Plug, blurb: "Which connections this app actually has" },
  { id: "security", label: "Security", Icon: Lock, blurb: "Run the app's security scan and read its findings" },
  { id: "code", label: "Code", Icon: Code2, blurb: "The artifact's own source, and the linked repositories" },
  { id: "agents", label: "Agents", Icon: Bot, blurb: "The workforce and the work it is holding" },
  { id: "workflows", label: "Workflows", Icon: GitBranch, isNew: true, blurb: "Every chain run, and building the next one" },
  { id: "emails", label: "Emails", Icon: Mail, blurb: "Send a project message, and see the app's own mail" },
  { id: "logs", label: "Logs", Icon: Clock, blurb: "What the system actually did, newest first" },
  { id: "api", label: "API", Icon: Terminal, blurb: "The endpoints behind this editor, ready to call" },
  { id: "settings", label: "Settings", Icon: Settings, blurb: "How the editor behaves for this project" },
  { id: "mcp", label: "MCP", Icon: Server, blurb: "Pointing an AI client at this app" },
  { id: "secrets", label: "Secrets", Icon: KeyRound, blurb: "Which keys the app has, never their values" },
];
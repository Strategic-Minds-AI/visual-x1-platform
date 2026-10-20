import { Eye, Link2, MessageSquare, Monitor, Shield, Smartphone, Sparkles, Tablet } from "lucide-react";

// The device frames the canvas is previewed in. They sit on the bar directly above the
// canvas, next to the tools that act on what is being previewed.
export const DEVICES = [
  { id: "desktop", label: "Desktop preview", Icon: Monitor },
  { id: "tablet", label: "Tablet preview", Icon: Tablet },
  { id: "mobile", label: "Phone preview", Icon: Smartphone },
];

// The editor's controls, in one place: the composer column's two modes, the
// canvas's three views, the request suggestions, and the narrow-screen panes.
export const COMPOSER_MODES = [
  { id: "chat", label: "Chat", Icon: MessageSquare },
  { id: "prompt", label: "Prompt System", Icon: Sparkles },
];

export const CANVAS_VIEWS = [
  { id: "preview", label: "Preview", Icon: Eye },
  { id: "simulator", label: "Simulator", Icon: Shield },
  { id: "chain", label: "Chain", Icon: Link2 },
];

// Ported from the package's chat panel: each chip loads its request and builds.
export const SUGGESTIONS = [
  "Build a landing page",
  "Create a blog",
  "Make an online store",
  "Build a portfolio site",
  "Create a dashboard app",
  "Build a business website",
];

export const MOBILE_TABS = [
  { id: "chat", label: "Chat", Icon: MessageSquare },
  { id: "prompt", label: "Prompts", Icon: Sparkles },
  { id: "canvas", label: "Canvas", Icon: Eye },
];
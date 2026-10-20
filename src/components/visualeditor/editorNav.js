import { MessageSquare, Sparkles, Eye, Shield, Link2 } from "lucide-react";

// The editor's two axes, in one place: the left composer column and the canvas.
export const COMPOSER_MODES = [
  { id: "chat", label: "Chat", Icon: MessageSquare },
  { id: "prompt", label: "Prompt System", Icon: Sparkles },
];

export const CANVAS_VIEWS = [
  { id: "preview", label: "Preview", Icon: Eye },
  { id: "simulator", label: "Simulator", Icon: Shield },
  { id: "chain", label: "Chain", Icon: Link2 },
];

// Ported from the package's chat panel: each chip loads its request and renders.
export const SUGGESTIONS = [
  "Build a landing page",
  "Create a blog",
  "Make an online store",
  "Build a portfolio site",
  "Create a dashboard app",
  "Build a business website",
];
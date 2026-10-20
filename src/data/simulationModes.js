// Simulation operating modes. Each mode states exactly what it changes, so a higher mode is
// never mistaken for a better forecast: it widens the modeled range and adds scenarios.
// Every number here is a declared planning assumption, not measured market data.

export const SIMULATION_MODES = [
  {
    id: "simple",
    name: "Simple",
    tagline: "One path",
    intensity: 0.85,
    scenarios: 1,
    range_width: 0.35,
    adds: ["Single expected path", "Core SEO signal set only"],
    reasoning_depth: "Direct read of the inputs you entered.",
  },
  {
    id: "moderate",
    name: "Moderate",
    tagline: "Three scenarios",
    intensity: 1.0,
    scenarios: 3,
    range_width: 0.45,
    adds: ["Conservative, expected and aggressive paths", "Strategy families scored separately"],
    reasoning_depth: "Adds the per-family coverage breakdown behind the score.",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Scenario + levers",
    intensity: 1.12,
    scenarios: 4,
    range_width: 0.55,
    adds: ["Lever deltas per tactic", "Cost and ROI per scenario", "Data-gap penalties"],
    reasoning_depth: "Shows which input moved each result, and what is missing to sharpen it.",
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "Competitive pressure",
    intensity: 1.24,
    scenarios: 5,
    range_width: 0.62,
    adds: ["Competitor pressure applied per dimension", "Niche and counter-strategy weighting", "Compounding re-investment path"],
    reasoning_depth: "Shows the competitor benchmark each dimension has to beat, and the step that gets there.",
  },
  {
    id: "god",
    name: "God Mode",
    tagline: "Maximum pressure",
    intensity: 1.38,
    scenarios: 6,
    range_width: 0.72,
    adds: [
      "Every strategy family at full compounding weight",
      "Widest modeled range, including regression risk",
      "Elite staffing and content velocity assumptions applied",
    ],
    reasoning_depth: "Full trace: inputs, rubric scores, competitor ceiling, every lever and every assumption.",
  },
];

export const MODE_BY_ID = Object.fromEntries(SIMULATION_MODES.map((m) => [m.id, m]));

export const TIME_HORIZONS = [
  { id: "3m", label: "3 months", months: 3 },
  { id: "6m", label: "6 months", months: 6 },
  { id: "12m", label: "12 months", months: 12 },
  { id: "24m", label: "24 months", months: 24 },
];
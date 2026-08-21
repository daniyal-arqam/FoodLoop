export const AI_MODES = [
  {
    id: "advisor",
    label: "Waste Advisor",
    title: "Waste Reduction Advisor",
    description: "Enter surplus details and get structured listing and redistribution advice from the AI service.",
  },
  {
    id: "safety",
    label: "Food Safety",
    title: "Food Safety Assistant",
    description: "Ask grounded questions about food safety, storage, donation, and redistribution.",
  },
  {
    id: "matching",
    label: "Matching Agent",
    title: "Matching Agent",
    description: "Ask in natural language. The agent calls FoodLoop food, organization, and matcher APIs.",
  },
];

export const DEFAULT_AI_MODE = "advisor";

export function isAiMode(value) {
  return AI_MODES.some((mode) => mode.id === value);
}

export function formatMatchScore(score) {
  const numeric = Number(score);
  if (Number.isNaN(numeric)) return "—";
  return numeric.toFixed(4);
}

export function matchScorePercent(score) {
  const numeric = Number(score);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric * 100)));
}

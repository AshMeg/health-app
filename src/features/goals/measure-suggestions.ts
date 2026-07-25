import type { GoalMeasureKind, GoalMetric, GoalType } from "./types";

export type MeasureSuggestion = {
  id: string;
  label: string;
  hint: string;
  kind: GoalMeasureKind;
  metric?: GoalMetric;
  unit?: string;
  target?: number;
};

type Rule = { keywords: string[]; suggestions: MeasureSuggestion[] };

const rules: Rule[] = [
  {
    keywords: ["weight", "kg", "lose", "gain", "lighter", "slim"],
    suggestions: [
      { id: "weight", label: "Body weight", hint: "In kilograms, from your weight logs", kind: "automatic", metric: "weight", unit: "kg" },
    ],
  },
  {
    keywords: ["water", "hydrate", "hydration", "drink"],
    suggestions: [
      { id: "water", label: "Water", hint: "Litres a day", kind: "automatic", metric: "water", unit: "L", target: 2 },
    ],
  },
  {
    keywords: ["train", "gym", "workout", "exercise", "run", "ride", "swim", "lift"],
    suggestions: [
      { id: "sessions", label: "Sessions", hint: "How many times a week", kind: "count", metric: "training", unit: "sessions", target: 4 },
      { id: "minutes", label: "Time training", hint: "Minutes a week", kind: "duration", unit: "minutes", target: 150 },
    ],
  },
  {
    keywords: ["read", "pages", "chapter", "study", "learn"],
    suggestions: [
      { id: "count", label: "Count", hint: "Books, chapters or pages", kind: "count", unit: "books", target: 12 },
      { id: "reading-time", label: "Time reading", hint: "Minutes a day", kind: "duration", unit: "minutes", target: 20 },
    ],
  },
  {
    keywords: ["sleep", "bed", "rest", "early night"],
    suggestions: [
      { id: "sleep", label: "Hours of sleep", hint: "From your sleep logs", kind: "automatic", metric: "sleep", unit: "hrs", target: 8 },
    ],
  },
  {
    keywords: ["protein", "calorie", "macro", "eat", "nutrition", "diet"],
    suggestions: [
      { id: "protein", label: "Protein", hint: "Grams a day", kind: "automatic", metric: "protein", unit: "g", target: 140 },
    ],
  },
  {
    keywords: ["stress", "calm", "anxious", "anxiety", "mood", "happy", "balance", "burnout"],
    suggestions: [
      { id: "self", label: "Self-assessment", hint: "Rate how it's going out of ten", kind: "self-assessment", metric: "mood", target: 8 },
    ],
  },
  {
    keywords: ["journal", "write", "diary", "reflect", "gratitude"],
    suggestions: [
      { id: "entries", label: "Entries", hint: "How many entries", kind: "count", metric: "journal", unit: "entries", target: 30 },
    ],
  },
  {
    keywords: ["date", "dinner", "call", "visit", "see ", "meet", "ask"],
    suggestions: [
      { id: "once", label: "Complete once", hint: "Tick it off when it happens", kind: "checkbox" },
    ],
  },
  {
    keywords: ["holiday", "trip", "travel", "wedding", "move", "birthday", "race", "event", "book a"],
    suggestions: [
      { id: "on-date", label: "Target date", hint: "Counting down to the day", kind: "date" },
      { id: "plan", label: "Percentage", hint: "How much of the planning is done", kind: "percentage", target: 100 },
    ],
  },
  {
    keywords: ["steps", "walk", "walking"],
    suggestions: [
      { id: "steps", label: "Steps", hint: "Steps a day", kind: "automatic", metric: "steps", unit: "steps", target: 10000 },
    ],
  },
];

const byType: Record<GoalType, MeasureSuggestion[]> = {
  outcome: [
    { id: "t-count", label: "Count", hint: "A number to reach", kind: "count", unit: "", target: undefined },
    { id: "t-pct", label: "Percentage", hint: "How far along you are", kind: "percentage", target: 100 },
  ],
  habit: [
    { id: "h-count", label: "Count", hint: "How many times", kind: "count", unit: "times", target: 20 },
    { id: "h-duration", label: "Duration", hint: "Minutes spent", kind: "duration", unit: "minutes", target: 30 },
  ],
  wellbeing: [
    { id: "w-self", label: "Self-assessment", hint: "Rate how it feels out of ten", kind: "self-assessment", target: 8 },
    { id: "w-manual", label: "Manual completion", hint: "You decide when it's there", kind: "manual" },
  ],
  "life-event": [
    { id: "l-once", label: "Complete once", hint: "Done or not done", kind: "checkbox" },
    { id: "l-date", label: "Target date", hint: "Reached when the day arrives", kind: "date" },
  ],
};

const fallback: MeasureSuggestion[] = [
  { id: "f-manual", label: "Manual completion", hint: "Mark it complete yourself", kind: "manual" },
  { id: "f-custom", label: "Custom", hint: "Your own unit and target", kind: "custom", unit: "" },
];

/** Intelligent measurement options based on what the user wrote and the goal type. */
export function suggestMeasures(title: string, type: GoalType | null): MeasureSuggestion[] {
  const text = title.toLowerCase();
  const matched = rules
    .filter((rule) => rule.keywords.some((k) => text.includes(k.trim())))
    .flatMap((rule) => rule.suggestions);

  const typed = type ? byType[type] : [];
  const all = [...matched, ...typed, ...fallback];

  const seen = new Set<string>();
  return all.filter((s) => {
    const key = `${s.kind}:${s.unit ?? ""}:${s.metric ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

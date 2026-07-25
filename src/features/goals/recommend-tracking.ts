import type { GoalMetric, GoalTracking, GoalType, TrackingMethod } from "./types";

export type TrackingRecommendation = {
  method: TrackingMethod;
  /** Why Bloom thinks this fits — shown under the recommended option. */
  reason: string;
  /** A sensible starting shape for the goal's tracking, editable by the user. */
  draft: (title: string) => GoalTracking;
};

const today = () => new Date().toISOString().slice(0, 10);

function automatic(metric: GoalMetric, unit: string, start: number, target: number): GoalTracking {
  return { method: "automatic", metric, unit, start, current: start, target, history: [] };
}

function numberIn(title: string, fallback: number) {
  const match = title.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : fallback;
}

type Rule = {
  keywords: string[];
  build: (title: string) => TrackingRecommendation;
};

const rules: Rule[] = [
  {
    keywords: ["weight", "lose", "kg", "lighter", "slim", "gain weight"],
    build: (t) => ({
      method: "automatic",
      reason: "Bloom can read this from your weight logs.",
      draft: () => automatic("weight", "kg", 0, numberIn(t, 5)),
    }),
  },
  {
    keywords: ["water", "hydrate", "hydration", "litre", "liter"],
    build: (t) => ({
      method: "automatic",
      reason: "Your water logs can move this along on their own.",
      draft: () => automatic("water", "L", 0, numberIn(t, 2.5)),
    }),
  },
  {
    keywords: ["sleep", "hours in bed", "early night"],
    build: (t) => ({
      method: "automatic",
      reason: "Sleep is already tracked, so Bloom can follow it for you.",
      draft: () => automatic("sleep", "hrs", 0, numberIn(t, 7.5)),
    }),
  },
  {
    keywords: ["steps", "walk", "walking"],
    build: (t) => ({
      method: "automatic",
      reason: "Step counts sync in automatically.",
      draft: () => automatic("steps", "steps", 0, numberIn(t, 8000)),
    }),
  },
  {
    keywords: ["protein", "calorie", "macro", "carbs", "nutrition"],
    build: (t) => ({
      method: "automatic",
      reason: "Bloom can total this from what you log to nutrition.",
      draft: () => automatic("protein", "g", 0, numberIn(t, 140)),
    }),
  },
  {
    keywords: ["every day", "daily", "each morning", "every morning", "streak", "consistent"],
    build: () => ({
      method: "streak",
      reason: "This one is about showing up regularly, so a streak fits best.",
      draft: () => ({
        method: "streak",
        cadence: "every day",
        targetDays: 30,
        current: 0,
        longest: 0,
        history: [],
      }),
    }),
  },
  {
    keywords: ["journal", "meditate", "swim", "session", "times", "practice", "practise", "yoga", "run "],
    build: (t) => ({
      method: "repetition",
      reason: "You'll do this more than once, so Bloom will count each time.",
      draft: () => ({
        method: "repetition",
        unit: "times",
        target: numberIn(t, 20),
        completed: 0,
        logs: [],
      }),
    }),
  },
  {
    keywords: ["marathon", "half marathon", "race", "10k", "wedding", "move house", "learn to", "qualify", "launch"],
    build: () => ({
      method: "milestone",
      reason: "A bigger goal like this is easier in steps you can tick off.",
      draft: () => ({
        method: "milestone",
        milestones: [
          { id: "m1", label: "First step", done: false },
          { id: "m2", label: "Halfway point", done: false },
          { id: "m3", label: "The big day", done: false },
        ],
      }),
    }),
  },
  {
    keywords: ["date", "appointment", "gp", "doctor", "dentist", "therapy", "book ", "finish reading", "call ", "visit"],
    build: (t) => {
      const count = Math.max(1, Math.min(10, numberIn(t, 1)));
      return {
        method: "checklist",
        reason: "This is a small number of things to tick off.",
        draft: () => ({
          method: "checklist",
          items:
            count > 1
              ? Array.from({ length: count }, (_, i) => ({
                  id: `c${i + 1}`,
                  label: `Step ${i + 1}`,
                  done: false,
                }))
              : [{ id: "c1", label: "Done", done: false }],
        }),
      };
    },
  },
  {
    keywords: [
      "kinder",
      "confidence",
      "confident",
      "stress",
      "calm",
      "anxious",
      "anxiety",
      "balance",
      "happier",
      "self",
      "burnout",
      "mindset",
      "patience",
    ],
    build: () => ({
      method: "reflection",
      reason: "There's no number for this — Bloom will ask how it's feeling instead.",
      draft: () => ({ method: "reflection", cadence: "weekly", reflections: [] }),
    }),
  },
];

const byType: Record<GoalType, TrackingMethod> = {
  outcome: "milestone",
  habit: "streak",
  wellbeing: "reflection",
  "life-event": "checklist",
};

export const defaultTracking: Record<TrackingMethod, (title: string) => GoalTracking> = {
  automatic: (t) => automatic("none", "", 0, numberIn(t, 10)),
  checklist: () => ({
    method: "checklist",
    items: [
      { id: "c1", label: "Step 1", done: false },
      { id: "c2", label: "Step 2", done: false },
    ],
  }),
  repetition: (t) => ({
    method: "repetition",
    unit: "times",
    target: numberIn(t, 20),
    completed: 0,
    logs: [],
  }),
  streak: () => ({
    method: "streak",
    cadence: "every day",
    targetDays: 30,
    current: 0,
    longest: 0,
    history: [],
  }),
  milestone: () => ({
    method: "milestone",
    milestones: [
      { id: "m1", label: "First step", done: false },
      { id: "m2", label: "Halfway point", done: false },
      { id: "m3", label: "The big day", done: false },
    ],
  }),
  reflection: () => ({ method: "reflection", cadence: "weekly", reflections: [] }),
};

/**
 * Placeholder intelligence: reads the goal's own words to suggest a tracking
 * method. Swap the body for an AI call later — the shape stays the same.
 */
export function recommendTracking(title: string, type: GoalType | null): TrackingRecommendation {
  const text = ` ${title.toLowerCase()} `;
  const rule = rules.find((r) => r.keywords.some((k) => text.includes(k)));
  if (rule) return rule.build(title);

  const method = type ? byType[type] : "checklist";
  return {
    method,
    reason: "Based on the kind of goal this is.",
    draft: (t) => defaultTracking[method](t),
  };
}

/** Placeholder "Today's Next Step" nudge — AI-generated suggestions land here later. */
export function suggestNextStep(title: string, method: TrackingMethod): string {
  const text = title.toLowerCase();
  if (text.includes("date")) return "Reply to someone you've been meaning to message.";
  if (text.includes("weight") || text.includes("lose")) return "Hit today's protein target.";
  if (text.includes("stress") || text.includes("calm"))
    return "Take 10 minutes away from your screen this afternoon.";
  if (text.includes("water")) return "Fill a bottle now and keep it on your desk.";
  if (text.includes("sleep")) return "Set a wind-down reminder for 30 minutes before bed.";
  if (text.includes("read")) return "Read a few pages before you pick up your phone tonight.";

  switch (method) {
    case "automatic":
      return "Log today's numbers so the trend stays honest.";
    case "checklist":
      return "Pick the easiest item on the list and get it out of the way.";
    case "repetition":
      return "Fit one short session in today, even a small one counts.";
    case "streak":
      return "Keep the streak alive — do the smallest version of it today.";
    case "milestone":
      return "Spend ten minutes on the next milestone.";
    case "reflection":
      return "Take a moment to notice how this week has felt.";
  }
}

export const todayISO = today;

import type { BloomAccent } from "@/features/today/types";

/** Outcome = a destination, Habit = a repeated action, Wellbeing = a felt state. */
export type GoalType = "outcome" | "habit" | "wellbeing";

/** What Bloom watches to move the progress bar. */
export type GoalMetric =
  | "weight"
  | "protein"
  | "water"
  | "sleep"
  | "training"
  | "mood"
  | "journal"
  | "custom";

export type GoalStatus = "on-track" | "behind" | "ahead";

export type GoalUpdate = {
  id: string;
  date: string;
  title: string;
  detail?: string;
};

export type BloomGoal = {
  id: string;
  title: string;
  type: GoalType;
  metric: GoalMetric;
  /** Why this goal matters — the user's own words. */
  why?: string;
  /** Numeric progress readings. */
  current: number;
  start: number;
  target: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: GoalStatus;
  accent: BloomAccent;
  notes?: string;
  updates: GoalUpdate[];
  completedAt?: string;
};

export const goalTypeMeta: Record<
  GoalType,
  { label: string; description: string; accent: BloomAccent }
> = {
  outcome: {
    label: "Outcome",
    description: "A destination you're moving towards, like a weight or a distance.",
    accent: "sage",
  },
  habit: {
    label: "Habit",
    description: "Something you'd like to repeat often enough that it sticks.",
    accent: "lavender",
  },
  wellbeing: {
    label: "Wellbeing",
    description: "How you'd like to feel — calmer, more rested, more yourself.",
    accent: "blush",
  },
};

export const goalMetricMeta: Record<GoalMetric, { label: string; unit: string }> = {
  weight: { label: "Weight", unit: "kg" },
  protein: { label: "Protein", unit: "g" },
  water: { label: "Water", unit: "L" },
  sleep: { label: "Sleep", unit: "hrs" },
  training: { label: "Training", unit: "sessions" },
  mood: { label: "Mood", unit: "/10" },
  journal: { label: "Journal", unit: "entries" },
  custom: { label: "Custom", unit: "" },
};

export const goalStatusMeta: Record<GoalStatus, { label: string; className: string }> = {
  "on-track": { label: "On Track", className: "bg-success-soft text-success" },
  behind: { label: "Behind", className: "bg-caution-soft text-caution" },
  ahead: { label: "Ahead", className: "bg-sky-soft text-sky" },
};

/** Percentage complete, tolerant of goals that count downwards (e.g. weight loss). */
export function goalProgress(goal: BloomGoal): number {
  const span = goal.target - goal.start;
  if (span === 0) return goal.current >= goal.target ? 100 : 0;
  const done = ((goal.current - goal.start) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(done)));
}

export function formatGoalValue(value: number, unit: string): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return unit ? `${rounded} ${unit}`.trim() : String(rounded);
}

import type { BloomAccent } from "@/features/today/types";

/**
 * Outcome = a destination, Habit = a repeated action, Wellbeing = a felt state,
 * Life Event = a one-off moment you'd like to make happen.
 */
export type GoalType = "outcome" | "habit" | "wellbeing" | "life-event";

/**
 * How Bloom measures success. Not every goal has units — a life event may simply
 * be done or not done, and a wellbeing goal may be a self-assessment.
 */
export type GoalMeasureKind =
  | "automatic"
  | "manual"
  | "checkbox"
  | "count"
  | "duration"
  | "percentage"
  | "date"
  | "self-assessment"
  | "custom";

/** Optional link to a tracked data stream, only used by automatic measurement. */
export type GoalMetric =
  | "weight"
  | "protein"
  | "water"
  | "sleep"
  | "training"
  | "mood"
  | "journal"
  | "steps"
  | "none";

export type GoalStatus = "on-track" | "behind" | "ahead";

export type GoalUpdate = {
  id: string;
  date: string;
  title: string;
  detail?: string;
};

export type GoalMeasure = {
  kind: GoalMeasureKind;
  /** Data stream Bloom watches when the goal tracks automatically. */
  metric?: GoalMetric;
  /** Blank for goals that don't need units (checkbox, date, manual). */
  unit?: string;
  /** Where the user is starting from — omitted for unit-less goals. */
  start?: number;
  /** The number to reach — omitted for checkbox / date goals. */
  target?: number;
  /** A date to reach, for goals measured by a date (a holiday, an event). */
  targetOn?: string;
};

export type BloomGoal = {
  id: string;
  title: string;
  type: GoalType;
  /** Why this goal matters — the user's own words. */
  why?: string;
  measure: GoalMeasure;
  /** Latest reading for numeric goals. */
  current?: number;
  /** Whether a checkbox / manual goal has been marked done. */
  done?: boolean;
  startDate: string;
  /** Optional deadline — goals are allowed to be open-ended. */
  targetDate?: string;
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
  "life-event": {
    label: "Life Event",
    description: "A moment to make happen — a trip, a date, a milestone.",
    accent: "sky",
  },
};

export const goalMeasureMeta: Record<
  GoalMeasureKind,
  { label: string; description: string; needsTarget: boolean; needsUnit: boolean }
> = {
  automatic: {
    label: "Automatic tracking",
    description: "Bloom follows the data you already log.",
    needsTarget: true,
    needsUnit: true,
  },
  manual: {
    label: "Manual completion",
    description: "You decide when it's done and mark it yourself.",
    needsTarget: false,
    needsUnit: false,
  },
  checkbox: {
    label: "Simple checkbox",
    description: "Complete once — done or not done.",
    needsTarget: false,
    needsUnit: false,
  },
  count: {
    label: "Count",
    description: "A number of things — sessions, entries, books.",
    needsTarget: true,
    needsUnit: true,
  },
  duration: {
    label: "Duration",
    description: "Time spent — minutes or hours.",
    needsTarget: true,
    needsUnit: true,
  },
  percentage: {
    label: "Percentage",
    description: "How far along you feel, from 0 to 100%.",
    needsTarget: true,
    needsUnit: false,
  },
  date: {
    label: "Target date",
    description: "Reached when the day arrives.",
    needsTarget: false,
    needsUnit: false,
  },
  "self-assessment": {
    label: "Self-assessment",
    description: "You rate how it's going, out of ten.",
    needsTarget: true,
    needsUnit: false,
  },
  custom: {
    label: "Custom",
    description: "Your own unit and target.",
    needsTarget: true,
    needsUnit: true,
  },
};

export const goalStatusMeta: Record<GoalStatus, { label: string; className: string }> = {
  "on-track": { label: "On Track", className: "bg-success-soft text-success" },
  behind: { label: "Behind", className: "bg-caution-soft text-caution" },
  ahead: { label: "Ahead", className: "bg-sky-soft text-sky" },
};

/** Percentage complete, tolerant of goals without numbers at all. */
export function goalProgress(goal: BloomGoal): number {
  if (goal.completedAt) return 100;
  const { kind, start = 0, target } = goal.measure;

  if (kind === "checkbox" || kind === "manual") return goal.done ? 100 : 0;

  if (kind === "date") {
    const on = goal.measure.targetOn;
    if (!on) return 0;
    const from = new Date(goal.startDate).getTime();
    const to = new Date(on).getTime();
    if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 0;
    const done = ((Date.now() - from) / (to - from)) * 100;
    return Math.max(0, Math.min(100, Math.round(done)));
  }

  if (typeof target !== "number" || typeof goal.current !== "number") return 0;
  const span = target - start;
  if (span === 0) return goal.current >= target ? 100 : 0;
  const done = ((goal.current - start) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(done)));
}

export function formatGoalValue(value: number | undefined, unit?: string): string {
  if (typeof value !== "number") return "—";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return unit ? `${rounded} ${unit}`.trim() : String(rounded);
}

/** Human summary of how a goal is measured, for cards and review screens. */
export function describeMeasure(goal: BloomGoal): string {
  const { kind, unit, target, targetOn } = goal.measure;
  switch (kind) {
    case "checkbox":
      return "Complete once";
    case "manual":
      return "Marked complete by you";
    case "date":
      return targetOn ? `By ${targetOn}` : "Target date";
    case "percentage":
      return `${target ?? 100}% complete`;
    case "self-assessment":
      return `Self-assessment · target ${target ?? 8}/10`;
    default:
      return target !== undefined
        ? `${formatGoalValue(target, unit)}${kind === "automatic" ? " · tracked automatically" : ""}`
        : goalMeasureMeta[kind].label;
  }
}

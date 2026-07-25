import type { BloomAccent } from "@/features/today/types";

/**
 * Outcome = a destination, Habit = a repeated action, Wellbeing = a felt state,
 * Life Event = a one-off moment you'd like to make happen.
 */
export type GoalType = "outcome" | "habit" | "wellbeing" | "life-event";

/** How Bloom follows a goal along. Add a new method here, then in the tracking registry. */
export type TrackingMethod =
  | "automatic"
  | "checklist"
  | "repetition"
  | "streak"
  | "milestone"
  | "reflection";

/** Optional link to a tracked data stream, used by automatic tracking. */
export type GoalMetric =
  | "weight"
  | "protein"
  | "water"
  | "sleep"
  | "training"
  | "steps"
  | "mood"
  | "journal"
  | "none";

/** Calculated from progress and pace — never set by hand. */
export type GoalStatus = "not-started" | "on-track" | "needs-attention" | "completed";

/** What kind of thing happened, so the timeline can speak plainly about it. */
export type GoalEventKind =
  | "created"
  | "edited"
  | "progress"
  | "checklist"
  | "reflection"
  | "completed"
  | "note"
  | "manual";

export type GoalUpdate = {
  id: string;
  /** ISO date — formatted for display, so entries stay sortable. */
  date: string;
  title: string;
  detail?: string;
  kind: GoalEventKind;
};

/** A dated line in the goal's story. */
export type GoalNote = {
  id: string;
  /** ISO date the note was written. */
  date: string;
  body: string;
  /** Set when the note has been edited since. */
  editedAt?: string;
};


export type CheckItem = {
  id: string;
  label: string;
  done: boolean;
  doneOn?: string;
};

export type ReflectionRating = "much-better" | "better" | "same" | "worse";

export type GoalReflection = {
  id: string;
  date: string;
  rating: ReflectionRating;
  note?: string;
};

export type RepetitionLog = {
  id: string;
  date: string;
  note?: string;
};

export type AutomaticTracking = {
  method: "automatic";
  metric: GoalMetric;
  unit: string;
  start: number;
  current: number;
  target: number;
  /** Recent readings, oldest first — powers the small progress graph. */
  history?: { date: string; value: number }[];
};

export type ChecklistTracking = {
  method: "checklist";
  items: CheckItem[];
};

export type RepetitionTracking = {
  method: "repetition";
  unit: string;
  target: number;
  completed: number;
  logs: RepetitionLog[];
};

export type StreakTracking = {
  method: "streak";
  /** Plain-language cadence, e.g. "every day". */
  cadence: string;
  targetDays: number;
  current: number;
  longest: number;
  /** ISO dates already ticked off. */
  history: string[];
};

export type MilestoneTracking = {
  method: "milestone";
  milestones: CheckItem[];
};

export type ReflectionTracking = {
  method: "reflection";
  cadence: string;
  reflections: GoalReflection[];
};

export type GoalTracking =
  | AutomaticTracking
  | ChecklistTracking
  | RepetitionTracking
  | StreakTracking
  | MilestoneTracking
  | ReflectionTracking;

export type BloomGoal = {
  id: string;
  title: string;
  type: GoalType;
  /** Why this goal matters — the user's own words. */
  why?: string;
  tracking: GoalTracking;
  startDate: string;
  /** Optional deadline — goals are allowed to be open-ended. */
  targetDate?: string;
  accent: BloomAccent;
  /** The goal's story, newest first. */
  notes: GoalNote[];

  /** Placeholder nudge; AI-generated suggestions will replace this. */
  nextStep?: string;
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

export const goalStatusMeta: Record<GoalStatus, { label: string; className: string }> = {
  "on-track": { label: "On Track", className: "bg-success-soft text-success" },
  behind: { label: "Behind", className: "bg-caution-soft text-caution" },
  ahead: { label: "Ahead", className: "bg-sky-soft text-sky" },
};

export const reflectionRatingMeta: Record<
  ReflectionRating,
  { label: string; score: number; className: string }
> = {
  "much-better": { label: "Much better", score: 100, className: "bg-success-soft text-success" },
  better: { label: "Better", score: 75, className: "bg-sage-soft text-sage" },
  same: { label: "About the same", score: 50, className: "bg-muted text-muted-foreground" },
  worse: { label: "Worse", score: 25, className: "bg-caution-soft text-caution" },
};

function clampPct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function checkedProgress(items: CheckItem[]) {
  if (items.length === 0) return 0;
  return clampPct((items.filter((i) => i.done).length / items.length) * 100);
}

/** Progress for any tracking method — the one place each method defines "done". */
export function trackingProgress(tracking: GoalTracking): number {
  switch (tracking.method) {
    case "automatic": {
      const span = tracking.target - tracking.start;
      if (span === 0) return tracking.current >= tracking.target ? 100 : 0;
      return clampPct(((tracking.current - tracking.start) / span) * 100);
    }
    case "checklist":
      return checkedProgress(tracking.items);
    case "milestone":
      return checkedProgress(tracking.milestones);
    case "repetition":
      return tracking.target === 0 ? 0 : clampPct((tracking.completed / tracking.target) * 100);
    case "streak":
      return tracking.targetDays === 0 ? 0 : clampPct((tracking.current / tracking.targetDays) * 100);
    case "reflection": {
      if (tracking.reflections.length === 0) return 0;
      const recent = tracking.reflections.slice(0, 4);
      const avg =
        recent.reduce((sum, r) => sum + reflectionRatingMeta[r.rating].score, 0) / recent.length;
      return clampPct(avg);
    }
  }
}

export function goalProgress(goal: BloomGoal): number {
  if (goal.completedAt) return 100;
  return trackingProgress(goal.tracking);
}

export function formatGoalValue(value: number | undefined, unit?: string): string {
  if (typeof value !== "number") return "—";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return unit ? `${rounded} ${unit}`.trim() : String(rounded);
}

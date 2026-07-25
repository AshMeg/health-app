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
  | "milestone"
  | "reflection"
  | "completed"
  | "note"
  | "paused"
  | "resumed"
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

/**
 * A step on the way to a bigger goal. Milestones are optional and live on the
 * goal itself, so any goal — however it's tracked — can be broken into steps.
 */
export type GoalMilestone = {
  id: string;
  label: string;
  done: boolean;
  /** Short display date the milestone was ticked off. */
  doneOn?: string;
  /** Optional context the user adds to a single step. */
  note?: string;
  /** Optional ISO date the user is aiming for. */
  targetDate?: string;
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

/**
 * Milestone tracking keeps no data of its own — the steps live on the goal, so
 * any goal can gain or lose milestones without changing how it's tracked.
 */
export type MilestoneTracking = {
  method: "milestone";
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
  /** Optional steps. Goals without them behave exactly as they always have. */
  milestones?: GoalMilestone[];
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
  /**
   * Set when the goal is resting in "Not Right Now" — a different season, not a
   * failure. Progress, notes and history are all kept exactly as they were.
   */
  pausedAt?: string;
};

/** Goals resting in "Not Right Now" — kept whole, just out of the way. */
export function isResting(goal: BloomGoal): boolean {
  return Boolean(goal.pausedAt) && !goal.completedAt;
}


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

export const goalStatusMeta: Record<
  GoalStatus,
  { label: string; className: string; dotClassName: string }
> = {
  "on-track": {
    label: "On Track",
    className: "bg-success-soft text-success",
    dotClassName: "bg-success",
  },
  "needs-attention": {
    label: "Needs Attention",
    className: "bg-caution-soft text-caution",
    dotClassName: "bg-caution",
  },
  completed: {
    label: "Completed",
    className: "bg-sky-soft text-sky",
    dotClassName: "bg-sky",
  },
  "not-started": {
    label: "Not Started",
    className: "bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground/40",
  },
};

const DAY = 86_400_000;

/**
 * Status is always calculated, never stored: complete beats everything, then
 * untouched goals, then pace against the deadline where there is one.
 */
export function goalStatus(goal: BloomGoal): GoalStatus {
  const progress = goalProgress(goal);
  if (goal.completedAt || progress >= 100) return "completed";
  if (progress === 0) return "not-started";

  if (goal.targetDate) {
    const start = new Date(goal.startDate).getTime();
    const end = new Date(goal.targetDate).getTime();
    const now = Date.now();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      if (now > end) return "needs-attention";
      const expected = ((now - start) / (end - start)) * 100;
      // A little slack, so a good week isn't undone by a slow one.
      if (progress < expected - 15) return "needs-attention";
    }
  }

  // Without a deadline, a goal only slips if nothing has happened in a while.
  const lastEvent = goal.updates
    .map((u) => new Date(u.date).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a)[0];
  if (lastEvent && Date.now() - lastEvent > 21 * DAY) return "needs-attention";

  return "on-track";
}


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
      // Milestone progress comes from the goal's own steps, not from tracking.
      return 0;
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

export function hasMilestones(goal: BloomGoal): boolean {
  return Boolean(goal.milestones && goal.milestones.length > 0);
}

/** Percentage of milestones ticked off. */
export function milestoneProgress(milestones: GoalMilestone[]): number {
  if (milestones.length === 0) return 0;
  return clampPct((milestones.filter((m) => m.done).length / milestones.length) * 100);
}

/** "3 of 8 milestones complete" — the wording used on cards and detail pages. */
export function milestoneSummary(milestones: GoalMilestone[]): string {
  const done = milestones.filter((m) => m.done).length;
  return `${done} of ${milestones.length} milestone${milestones.length === 1 ? "" : "s"} complete`;
}

/**
 * Milestones lead when a goal has them — otherwise the tracking method decides.
 * Goals without milestones behave exactly as they did before.
 */
export function goalProgress(goal: BloomGoal): number {
  if (goal.completedAt) return 100;
  if (goal.milestones && goal.milestones.length) return milestoneProgress(goal.milestones);
  return trackingProgress(goal.tracking);
}


export function formatGoalValue(value: number | undefined, unit?: string): string {
  if (typeof value !== "number") return "—";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return unit ? `${rounded} ${unit}`.trim() : String(rounded);
}

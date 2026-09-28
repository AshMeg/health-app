import { buildDailySnapshot, isoDate } from "@/features/timeline/snapshot";
import type { BloomEvent, DailySnapshot } from "@/features/timeline/types";

/**
 * Bloom's cross-metric analysis.
 *
 *   events (any source: manual, Oura, Apple Health…)
 *     → daily snapshots (normalised, provider-agnostic)
 *     → comparisons (two groups of days, one outcome)
 *     → patterns with evidence and confidence
 *
 * Nothing here is hard-coded as a finding. A pattern only exists when the
 * user's own recorded days support it, and every pattern carries its evidence.
 */

export type AnalyticsSource =
  | "sleep"
  | "recovery"
  | "mood"
  | "training"
  | "steps"
  | "nutrition"
  | "water"
  | "weight"
  | "cycle";

export const sourceMeta: Record<AnalyticsSource, { label: string; to: string }> = {
  sleep: { label: "Sleep", to: "/sleep" },
  recovery: { label: "Recovery", to: "/recovery" },
  mood: { label: "Mood", to: "/recovery" },
  training: { label: "Training", to: "/training" },
  steps: { label: "Steps", to: "/training" },
  nutrition: { label: "Nutrition", to: "/nutrition" },
  water: { label: "Water", to: "/nutrition" },
  weight: { label: "Weight", to: "/weight" },
  cycle: { label: "Cycle", to: "/cycle" },
};

/** Which goal metrics belong to which analysis source. */
export const sourceGoalMetrics: Record<AnalyticsSource, string[]> = {
  sleep: ["sleep"],
  recovery: [],
  mood: ["mood"],
  training: ["training"],
  steps: ["steps"],
  nutrition: ["protein"],
  water: ["water"],
  weight: ["weight"],
  cycle: [],
};

export type PatternCategory = "Health" | "Wellbeing" | "Lifestyle" | "Cycle";
export type Confidence = "early" | "moderate" | "strong";

export const confidenceLabel: Record<Confidence, string> = {
  early: "Early pattern",
  moderate: "Moderate pattern",
  strong: "Strong pattern",
};

export type AnalyticsPeriod = "30d" | "3m" | "6m" | "1y";
export const periods: { id: AnalyticsPeriod; label: string; days: number; words: string }[] = [
  { id: "30d", label: "30 days", days: 30, words: "the last 30 days" },
  { id: "3m", label: "3 months", days: 91, words: "the last 3 months" },
  { id: "6m", label: "6 months", days: 182, words: "the last 6 months" },
  { id: "1y", label: "1 year", days: 365, words: "the last year" },
];

export type Pattern = {
  id: string;
  title: string;
  statement: string;
  category: PatternCategory;
  sources: AnalyticsSource[];
  confidence: Confidence;
  observations: number;
  groups: { label: string; average: string; value: number; count: number }[];
  compared: string;
  limitation: string;
  /** Standardised difference — used only for ordering, never shown as a score. */
  strength: number;
};

export type StillLearning = {
  id: string;
  title: string;
  sources: AnalyticsSource[];
  have: number;
  need: number;
};

/** Minimum days in each group, and in total, before Bloom says anything. */
const MIN_GROUP = 5;
const MIN_TOTAL = 12;
/** Differences smaller than this (in standard deviations) are treated as noise. */
const MIN_EFFECT = 0.35;

const moodScore: Record<string, number> = {
  Great: 5,
  Calm: 4,
  Okay: 3,
  Flat: 2,
  Tired: 2,
  Low: 1,
};

function nextDay(date: string) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return isoDate(new Date(d.getTime() - d.getTimezoneOffset() * 60_000));
}

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sd(xs: number[]) {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function confidenceFor(n: number, effect: number): Confidence {
  if (n >= 40 && effect >= 0.8) return "strong";
  if (n >= 20 && effect >= 0.5) return "moderate";
  return "early";
}

type Comparison = {
  id: string;
  title: string;
  category: PatternCategory;
  sources: AnalyticsSource[];
  /** Pairs of (group flag, outcome) for each day where both are known. */
  pairs: (days: Map<string, DailySnapshot>) => { inA: boolean; value: number }[];
  groupA: string;
  groupB: string;
  outcome: string;
  format: (v: number) => string;
  /** Sentence when group A is higher / lower. */
  higher: string;
  lower: string;
  compared: string;
  limitation: string;
};

const pct = (v: number) => `${Math.round(v)}%`;
const hours = (v: number) => `${Math.floor(v / 60)}h ${Math.round(v % 60)}m`;
const moodWord = (v: number) => `${v.toFixed(1)} of 5`;

function each(days: Map<string, DailySnapshot>) {
  return [...days.values()];
}

/** Split days by a personal median so "higher" means higher for *you*. */
function byMedian(
  days: Map<string, DailySnapshot>,
  driver: (d: DailySnapshot) => number | undefined,
  outcome: (d: DailySnapshot) => number | undefined,
  lag = 0,
) {
  const rows = each(days).flatMap((d) => {
    const x = driver(d);
    const target = lag ? days.get(nextDay(d.date)) : d;
    const y = target ? outcome(target) : undefined;
    return x === undefined || y === undefined ? [] : [{ x, y }];
  });
  if (!rows.length) return [];
  const m = median(rows.map((r) => r.x));
  return rows.filter((r) => r.x !== m).map((r) => ({ inA: r.x > m, value: r.y }));
}

const mood = (d: DailySnapshot) => (d.mood ? moodScore[d.mood] : undefined);
const trained = (d: DailySnapshot) => d.events.some((e) => e.category === "workout");

const comparisons: Comparison[] = [
  {
    id: "sleep-recovery",
    title: "Your sleep and recovery",
    category: "Health",
    sources: ["sleep", "recovery"],
    pairs: (days) =>
      each(days).flatMap((d) =>
        d.sleepMinutes !== undefined && d.recoveryPercent !== undefined
          ? [{ inA: d.sleepMinutes >= 420, value: d.recoveryPercent }]
          : [],
      ),
    groupA: "After 7+ hours' sleep",
    groupB: "After less than 7 hours",
    outcome: "Average recovery",
    format: pct,
    higher: "Your recovery has tended to be higher after nights when you slept 7 hours or more.",
    lower: "Your recovery has tended to be lower after nights when you slept 7 hours or more.",
    compared: "Sleep duration and same-day recovery",
    limitation: "Recovery can be affected by many things Bloom doesn't see, such as illness or stress.",
  },
  {
    id: "sleep-mood",
    title: "Your sleep and mood",
    category: "Wellbeing",
    sources: ["sleep", "mood"],
    pairs: (days) =>
      each(days).flatMap((d) => {
        const m = mood(d);
        return d.sleepMinutes !== undefined && m !== undefined
          ? [{ inA: d.sleepMinutes >= 420, value: m }]
          : [];
      }),
    groupA: "After 7+ hours' sleep",
    groupB: "After less than 7 hours",
    outcome: "Average mood",
    format: moodWord,
    higher: "Your mood has tended to be more positive after nights with 7 hours' sleep or more.",
    lower: "Your mood has tended to be less positive after nights with 7 hours' sleep or more.",
    compared: "Sleep duration and mood recorded the same day",
    limitation: "Mood is scored from the words you chose (Great 5 … Low 1), which is a simplification.",
  },
  {
    id: "training-recovery",
    title: "Training and next-day recovery",
    category: "Health",
    sources: ["training", "recovery"],
    pairs: (days) =>
      each(days).flatMap((d) => {
        const next = days.get(nextDay(d.date));
        return next?.recoveryPercent !== undefined
          ? [{ inA: !trained(d), value: next.recoveryPercent }]
          : [];
      }),
    groupA: "After rest days",
    groupB: "After training days",
    outcome: "Average recovery",
    format: pct,
    higher: "Your recovery tends to be higher after rest days.",
    lower: "Your recovery tends to be higher after training days.",
    compared: "Whether you logged a workout, and recovery the following day",
    limitation: "Days without a logged workout are counted as rest days, even if you trained without logging it.",
  },
  {
    id: "training-sleep",
    title: "Training and sleep",
    category: "Lifestyle",
    sources: ["training", "sleep"],
    pairs: (days) =>
      each(days).flatMap((d) => {
        const next = days.get(nextDay(d.date));
        return next?.sleepMinutes !== undefined
          ? [{ inA: trained(d), value: next.sleepMinutes }]
          : [];
      }),
    groupA: "After training days",
    groupB: "After rest days",
    outcome: "Average sleep",
    format: hours,
    higher: "You've tended to sleep longer on nights after a training day.",
    lower: "Your sleep has been shorter on nights after a training day.",
    compared: "Whether you logged a workout, and the sleep recorded the next morning",
    limitation: "Unlogged workouts count as rest days.",
  },
  {
    id: "steps-sleep",
    title: "Activity and sleep",
    category: "Lifestyle",
    sources: ["steps", "sleep"],
    pairs: (days) => byMedian(days, (d) => d.steps, (d) => d.sleepMinutes, 1),
    groupA: "After your more active days",
    groupB: "After your less active days",
    outcome: "Average sleep",
    format: hours,
    higher: "You've tended to sleep longer after your more active days.",
    lower: "You've tended to sleep less after your more active days.",
    compared: "Daily steps (split at your own median) and the following night's sleep",
    limitation: "Step counts depend on how consistently they're recorded.",
  },
  {
    id: "water-recovery",
    title: "Hydration and recovery",
    category: "Lifestyle",
    sources: ["water", "recovery"],
    pairs: (days) =>
      each(days).flatMap((d) =>
        d.waterL !== undefined && d.recoveryPercent !== undefined
          ? [{ inA: d.waterL >= 2, value: d.recoveryPercent }]
          : [],
      ),
    groupA: "Days with 2 L of water or more",
    groupB: "Days with less",
    outcome: "Average recovery",
    format: pct,
    higher: "Your recovery has been higher on days you drank 2 L of water or more.",
    lower: "Your recovery has been lower on days you drank 2 L of water or more.",
    compared: "Water logged and recovery the same day",
    limitation: "Only days where water was logged are included.",
  },
  {
    id: "protein-recovery",
    title: "Protein and recovery",
    category: "Health",
    sources: ["nutrition", "recovery"],
    pairs: (days) => byMedian(days, (d) => d.proteinG, (d) => d.recoveryPercent, 1),
    groupA: "After your higher-protein days",
    groupB: "After your lower-protein days",
    outcome: "Average recovery",
    format: pct,
    higher: "Your recovery has tended to be higher the day after a higher-protein day.",
    lower: "Your recovery has tended to be lower the day after a higher-protein day.",
    compared: "Protein logged (split at your own median) and next-day recovery",
    limitation: "Days with partial food logs look like lower-protein days.",
  },
  {
    id: "calories-weight",
    title: "Calories and weight",
    category: "Health",
    sources: ["nutrition", "weight"],
    pairs: (days) =>
      each(days).flatMap((d) => {
        const next = days.get(nextDay(d.date));
        return d.caloriesKcal !== undefined && d.weightKg !== undefined && next?.weightKg !== undefined
          ? [{ inA: false, value: next.weightKg - d.weightKg, kcal: d.caloriesKcal }]
          : [];
      }).map((r, _, all) => {
        const m = median(all.map((a) => a.kcal));
        return { inA: r.kcal > m, value: r.value };
      }),
    groupA: "After your higher-calorie days",
    groupB: "After your lower-calorie days",
    outcome: "Average next-day weight change",
    format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)} kg`,
    higher: "Your weight has tended to rise a little more after your higher-calorie days.",
    lower: "Your weight has tended to change less after your higher-calorie days.",
    compared: "Calories logged (split at your own median) and the change in weight the next morning",
    limitation: "Day-to-day weight moves with water and food weight, so this is normal variation as much as anything.",
  },
  {
    id: "cycle-mood",
    title: "Your cycle and mood",
    category: "Cycle",
    sources: ["cycle", "mood"],
    pairs: (days) =>
      each(days).flatMap((d) => {
        const m = mood(d);
        return d.cycleDay !== undefined && m !== undefined
          ? [{ inA: d.cycleDay <= 7, value: m }]
          : [];
      }),
    groupA: "Cycle days 1–7",
    groupB: "Later in your cycle",
    outcome: "Average mood",
    format: moodWord,
    higher: "In your own records, your mood has tended to be more positive in the first week of your cycle.",
    lower: "In your own records, your mood has tended to be lower in the first week of your cycle.",
    compared: "Cycle day and mood logged the same day",
    limitation: "This is about your recorded history only, not cycles in general.",
  },
];

export type AnalyticsResult = {
  patterns: Pattern[];
  learning: StillLearning[];
  daysWithData: number;
  periodDays: number;
};

export function analyse(events: BloomEvent[], periodDays: number): AnalyticsResult {
  const days = new Map<string, DailySnapshot>();
  const today = new Date();
  for (let i = 0; i < periodDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const snap = buildDailySnapshot(events, isoDate(d));
    if (snap.events.length) days.set(snap.date, snap);
  }

  const patterns: Pattern[] = [];
  const learning: StillLearning[] = [];

  for (const c of comparisons) {
    const pairs = c.pairs(days);
    const a = pairs.filter((p) => p.inA).map((p) => p.value);
    const b = pairs.filter((p) => !p.inA).map((p) => p.value);
    const n = pairs.length;
    if (n === 0) continue;

    if (a.length < MIN_GROUP || b.length < MIN_GROUP || n < MIN_TOTAL) {
      learning.push({
        id: c.id,
        title: c.title,
        sources: c.sources,
        have: n,
        need: Math.max(MIN_TOTAL, MIN_GROUP * 2),
      });
      continue;
    }

    const spread = sd([...a, ...b]);
    const diff = mean(a) - mean(b);
    const effect = spread > 0 ? Math.abs(diff) / spread : 0;
    if (effect < MIN_EFFECT) continue; // no meaningful difference — say nothing

    patterns.push({
      id: c.id,
      title: c.title,
      statement: diff > 0 ? c.higher : c.lower,
      category: c.category,
      sources: c.sources,
      confidence: confidenceFor(n, effect),
      observations: n,
      groups: [
        { label: c.groupA, average: c.format(mean(a)), value: mean(a), count: a.length },
        { label: c.groupB, average: c.format(mean(b)), value: mean(b), count: b.length },
      ],
      compared: `${c.outcome} · ${c.compared}`,
      limitation: c.limitation,
      strength: effect * Math.log(n),
    });
  }

  patterns.sort((x, y) => y.strength - x.strength || y.sources.length - x.sources.length);
  learning.sort((x, y) => y.have - x.have);

  return { patterns, learning, daysWithData: days.size, periodDays };
}

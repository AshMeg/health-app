import type { BloomEvent, MetricKey } from "@/features/timeline/types";
import type { GoalMetric } from "@/features/goals/types";
import type { BloomAccent } from "@/features/today/types";

/**
 * Bloom's shared trend system. Any source — manual logs today, Oura / Apple
 * Health / MyFitnessPal tomorrow — becomes BloomEvents, and every trend is a
 * pure read over them. Only days with a real reading become points: nothing is
 * interpolated or filled in.
 */

export type TrendId =
  | "weight"
  | "bodyFat"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "water"
  | "sleep"
  | "recovery"
  | "hrv"
  | "restingHr"
  | "steps"
  | "trainingSessions"
  | "cycle"
  | "waist";

/** "level" = a reading of state (weight). "flow" = an amount per day (water). */
export type TrendKind = "level" | "flow" | "count";
export type TrendVisual = "line" | "bar" | "step";

export type TrendDefinition = {
  id: TrendId;
  label: string;
  unit: string;
  kind: TrendKind;
  visual: TrendVisual;
  accent: BloomAccent;
  /** How several readings on one day combine. */
  aggregate: "last" | "sum" | "count";
  metric?: MetricKey;
  /** Categories counted when `aggregate` is "count". */
  countCategory?: BloomEvent["category"];
  format: (value: number) => string;
  /** Formats a difference, e.g. "1.4 kg" or "42 min". */
  formatDelta?: (value: number) => string;
  defaultRange: RangeId;
  /** Words for summaries, e.g. "weight". */
  noun: string;
  /** Lower is better for direction-neutral wording — never judged, just described. */
};

const fixed = (d: number, unit: string) => (v: number) => `${v.toFixed(d)} ${unit}`.trim();
const whole = (unit: string) => (v: number) => `${Math.round(v).toLocaleString()}${unit ? ` ${unit}` : ""}`;
const hm = (m: number) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m`;

export const trendDefinitions: Record<TrendId, TrendDefinition> = {
  weight: { id: "weight", label: "Weight", unit: "kg", kind: "level", visual: "line", accent: "sage", aggregate: "last", metric: "weight", format: fixed(1, "kg"), defaultRange: "30d", noun: "weight" },
  bodyFat: { id: "bodyFat", label: "Body fat", unit: "%", kind: "level", visual: "line", accent: "lavender", aggregate: "last", metric: "bodyFat", format: (v) => `${v.toFixed(1)}%`, formatDelta: (v) => `${v.toFixed(1)} points`, defaultRange: "30d", noun: "body fat" },
  calories: { id: "calories", label: "Calories", unit: "kcal", kind: "flow", visual: "bar", accent: "blush", aggregate: "sum", metric: "calories", format: whole("kcal"), defaultRange: "30d", noun: "calories" },
  protein: { id: "protein", label: "Protein", unit: "g", kind: "flow", visual: "bar", accent: "sage", aggregate: "sum", metric: "protein", format: whole("g"), defaultRange: "30d", noun: "protein" },
  carbs: { id: "carbs", label: "Carbs", unit: "g", kind: "flow", visual: "bar", accent: "caution" as BloomAccent, aggregate: "sum", metric: "carbs", format: whole("g"), defaultRange: "30d", noun: "carbohydrates" },
  fat: { id: "fat", label: "Fat", unit: "g", kind: "flow", visual: "bar", accent: "lavender", aggregate: "sum", metric: "fat", format: whole("g"), defaultRange: "30d", noun: "fat" },
  water: { id: "water", label: "Water", unit: "L", kind: "flow", visual: "bar", accent: "sky", aggregate: "sum", metric: "water", format: fixed(1, "L"), defaultRange: "30d", noun: "water" },
  sleep: { id: "sleep", label: "Sleep", unit: "min", kind: "flow", visual: "bar", accent: "sky", aggregate: "last", metric: "sleep", format: hm, formatDelta: (v) => `${Math.round(v)} min`, defaultRange: "30d", noun: "sleep" },
  recovery: { id: "recovery", label: "Recovery", unit: "%", kind: "level", visual: "line", accent: "sage", aggregate: "last", metric: "recovery", format: (v) => `${Math.round(v)}%`, formatDelta: (v) => `${Math.round(v)} points`, defaultRange: "30d", noun: "recovery" },
  hrv: { id: "hrv", label: "HRV", unit: "ms", kind: "level", visual: "line", accent: "lavender", aggregate: "last", metric: "hrv", format: whole("ms"), defaultRange: "30d", noun: "HRV" },
  restingHr: { id: "restingHr", label: "Resting heart rate", unit: "bpm", kind: "level", visual: "line", accent: "blush", aggregate: "last", metric: "restingHr", format: whole("bpm"), defaultRange: "30d", noun: "resting heart rate" },
  steps: { id: "steps", label: "Steps", unit: "", kind: "flow", visual: "bar", accent: "lavender", aggregate: "last", metric: "steps", format: whole(""), formatDelta: whole("steps"), defaultRange: "30d", noun: "daily steps" },
  trainingSessions: { id: "trainingSessions", label: "Sessions", unit: "", kind: "count", visual: "bar", accent: "lavender", aggregate: "count", countCategory: "workout", format: (v) => `${v} session${v === 1 ? "" : "s"}`, defaultRange: "30d", noun: "training sessions" },
  cycle: { id: "cycle", label: "Cycle day", unit: "", kind: "level", visual: "step", accent: "blush", aggregate: "last", metric: "cycle", format: (v) => `Day ${Math.round(v)}`, defaultRange: "3m", noun: "cycle day" },
  waist: { id: "waist", label: "Waist", unit: "cm", kind: "level", visual: "line", accent: "sage", aggregate: "last", metric: "measurement", format: fixed(1, "cm"), defaultRange: "3m", noun: "waist" },
};

export type RangeId = "7d" | "30d" | "3m" | "6m" | "1y";
export const ranges: { id: RangeId; label: string; days: number; words: string }[] = [
  { id: "7d", label: "7 days", days: 7, words: "7 days" },
  { id: "30d", label: "30 days", days: 30, words: "30 days" },
  { id: "3m", label: "3 months", days: 91, words: "3 months" },
  { id: "6m", label: "6 months", days: 182, words: "6 months" },
  { id: "1y", label: "1 year", days: 365, words: "year" },
];

export type TrendPoint = { date: string; value: number; synced: boolean };

function localDay(at: string) {
  const d = new Date(at);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function dayOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localDay(d.toISOString());
}

/** Every real daily point for a trend, oldest first. */
export function buildSeries(events: BloomEvent[], id: TrendId): TrendPoint[] {
  const def = trendDefinitions[id];
  const byDay = new Map<string, { value: number; synced: boolean; at: string }>();
  const ordered = [...events].sort((a, b) => a.at.localeCompare(b.at));
  for (const e of ordered) {
    let v: number | undefined;
    if (def.aggregate === "count") {
      if (e.category !== def.countCategory) continue;
      v = 1;
    } else {
      const raw = def.metric ? e.metrics?.[def.metric] : undefined;
      if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
      v = raw;
    }
    const day = localDay(e.at);
    const prev = byDay.get(day);
    const value = def.aggregate === "last" || !prev ? v : prev.value + v;
    byDay.set(day, { value, synced: (prev?.synced ?? false) || e.source === "sync", at: e.at });
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, p]) => ({ date, value: Math.round(p.value * 100) / 100, synced: p.synced }));
}

export function pointsInRange(points: TrendPoint[], range: RangeId, offsetDays = 0) {
  const days = ranges.find((r) => r.id === range)!.days;
  const from = dayOffset(days - 1 + offsetDays);
  const to = dayOffset(offsetDays);
  return points.filter((p) => p.date >= from && p.date <= to);
}

/** Ranges worth offering: short ones always, longer only once history reaches back. */
export function availableRanges(points: TrendPoint[]): Set<RangeId> {
  const out = new Set<RangeId>(["7d", "30d"]);
  if (!points.length) return out;
  const oldest = points[0].date;
  ranges.forEach((r, i) => {
    if (i < 2) return;
    if (oldest < dayOffset(ranges[i - 1].days)) out.add(r.id);
  });
  return out;
}

export const MIN_POINTS = 2;

/** One or two plain, factual sentences. Returns [] when there's too little data. */
export function summarise(
  id: TrendId,
  all: TrendPoint[],
  range: RangeId,
  target?: number,
): string[] {
  const def = trendDefinitions[id];
  const pts = pointsInRange(all, range);
  const words = ranges.find((r) => r.id === range)!.words;
  if (pts.length < MIN_POINTS) return [];
  const delta = def.formatDelta ?? def.format;
  const out: string[] = [];
  const avg = pts.reduce((n, p) => n + p.value, 0) / pts.length;

  if (def.kind === "level") {
    const change = pts.at(-1)!.value - pts[0].value;
    out.push(
      Math.abs(change) < 0.05
        ? `Your ${def.noun} is unchanged over the last ${words}.`
        : `Your ${def.noun} is ${change < 0 ? "down" : "up"} ${delta(Math.abs(change))} over the last ${words}.`,
    );
  } else if (def.kind === "count") {
    const total = pts.reduce((n, p) => n + p.value, 0);
    out.push(`${total} ${def.noun} logged in the last ${words}.`);
  } else {
    out.push(`You've averaged ${def.format(avg)} on the ${pts.length} day${pts.length === 1 ? "" : "s"} you logged ${def.noun} in the last ${words}.`);
    if (target !== undefined) {
      const hit = pts.filter((p) => p.value >= target).length;
      out.push(`You reached your ${def.format(target)} target on ${hit} of those ${pts.length} days.`);
    }
    const prev = pointsInRange(all, range, ranges.find((r) => r.id === range)!.days);
    if (prev.length >= 3) {
      const prevAvg = prev.reduce((n, p) => n + p.value, 0) / prev.length;
      const diff = avg - prevAvg;
      if (Math.abs(diff) >= Math.abs(prevAvg) * 0.02)
        out.push(`That's ${diff > 0 ? "up" : "down"} ${delta(Math.abs(diff))} on average compared with the previous ${words}.`);
    }
  }
  return out;
}

/** Which trend a measurable goal should show, if any. */
export const goalMetricTrend: Partial<Record<GoalMetric, TrendId>> = {
  weight: "weight",
  protein: "protein",
  water: "water",
  sleep: "sleep",
  steps: "steps",
  training: "trainingSessions",
};

/** Converts a goal target into the trend's own unit (e.g. hours → minutes). */
export function goalTargetInTrendUnit(id: TrendId, target: number, unit: string) {
  if (id === "sleep" && /h/i.test(unit) && !/min/i.test(unit)) return target * 60;
  if (id === "water" && /ml/i.test(unit)) return target / 1000;
  return target;
}

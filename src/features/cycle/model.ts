import { localDate } from "@/features/measurements/model";
import type { BloomEvent } from "@/features/timeline/types";

/**
 * Cycle history and estimates — derived only from the periods the user has
 * recorded. Each period is one shared BloomEvent (category "cycle",
 * origin PERIOD_ORIGIN, `at` = first day, optional `periodEnd`). Older quick
 * add entries saying "Period started" count too. Nothing is assumed: no
 * universal 28-day cycle, no fixed period length.
 *
 * Future sources may add ovulation signals (category "cycle",
 * origin OVULATION_SIGNAL_ORIGIN). They are kept distinct from Bloom's own
 * estimate and are never generated here.
 */

export const PERIOD_ORIGIN = "cycle-period";
export const OVULATION_SIGNAL_ORIGIN = "cycle-ovulation-signal";

/** Gaps outside this range are treated as missed logs, not real cycles. */
const MIN_CYCLE = 15;
const MAX_CYCLE = 60;
/** Typical luteal length used to place the estimated ovulation window. */
const LUTEAL = 14;

export type Phase = "menstrual" | "follicular" | "ovulation" | "luteal";

export const phaseMeta: Record<Phase, { label: string; emoji: string; tone: string; soft: string }> = {
  menstrual: { label: "Menstrual", emoji: "🩸", tone: "bg-blush", soft: "bg-blush-soft" },
  follicular: { label: "Follicular", emoji: "🌱", tone: "bg-sage", soft: "bg-sage-soft" },
  ovulation: { label: "Estimated ovulation window", emoji: "🌸", tone: "bg-blush/70", soft: "bg-blush-soft" },
  luteal: { label: "Luteal", emoji: "🌙", tone: "bg-lavender", soft: "bg-lavender-soft" },
};

export type Period = { id: string; start: string; end?: string; notes?: string; event: BloomEvent };
export type Cycle = { start: string; length: number; periodDays?: number };

export type Confidence = "high" | "moderate" | "early";

export type CycleState = {
  periods: Period[];
  /** Completed cycles, newest first, only plausible lengths. */
  cycles: Cycle[];
  current?: { start: string; day: number; periodEnd?: string };
  stats?: { average: number; min: number; max: number; spread: number; irregular: boolean; count: number };
  periodLength?: number;
  confidence?: Confidence;
  nextPeriod?: { from: string; to: string; mid: string };
  ovulation?: { from: string; to: string };
  phase?: Phase;
  segments?: { phase: Phase; from: number; to: number }[];
};

const DAY = 86_400_000;
export const toDate = (iso: string) => new Date(`${iso}T12:00:00`);
export const addDays = (iso: string, n: number) => localDate(new Date(toDate(iso).getTime() + n * DAY));
export const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
};

export function isPeriodStart(e: BloomEvent) {
  if (e.category !== "cycle") return false;
  return e.origin === PERIOD_ORIGIN || e.metrics?.symptoms === "Period started";
}

export function periodsOf(events: BloomEvent[]): Period[] {
  const byDay = new Map<string, Period>();
  for (const e of events.filter(isPeriodStart)) {
    const start = localDate(e.at);
    const existing = byDay.get(start);
    // Prefer the richer Cycle-page record when two land on the same day.
    if (!existing || (e.origin === PERIOD_ORIGIN && existing.event.origin !== PERIOD_ORIGIN)) {
      byDay.set(start, { id: e.id, start, end: e.periodEnd, notes: e.notes, event: e });
    }
  }
  return [...byDay.values()].sort((a, b) => b.start.localeCompare(a.start));
}

export function analyseCycle(events: BloomEvent[], today = localDate()): CycleState {
  const periods = periodsOf(events).filter((p) => p.start <= today);
  const state: CycleState = { periods, cycles: [] };
  if (!periods.length) return state;

  for (let i = 0; i < periods.length - 1; i++) {
    const length = daysBetween(periods[i + 1].start, periods[i].start);
    if (length < MIN_CYCLE || length > MAX_CYCLE) continue;
    const p = periods[i + 1];
    state.cycles.push({ start: p.start, length, periodDays: p.end ? daysBetween(p.start, p.end) + 1 : undefined });
  }

  const latest = periods[0];
  state.current = { start: latest.start, day: daysBetween(latest.start, today) + 1, periodEnd: latest.end };

  const durations = periods.flatMap((p) => (p.end && p.end >= p.start ? [daysBetween(p.start, p.end) + 1] : []));
  if (durations.length) state.periodLength = Math.round(mean(durations));

  const recent = state.cycles.slice(0, 6).map((c) => c.length);
  if (recent.length) {
    const spread = recent.length > 1 ? sd(recent) : 0;
    const min = Math.min(...recent);
    const max = Math.max(...recent);
    state.stats = {
      average: Math.round(mean(recent)),
      min,
      max,
      spread,
      irregular: recent.length > 1 && (max - min > 7 || spread > 3),
      count: state.cycles.length,
    };
    state.confidence = state.cycles.length >= 6 && !state.stats.irregular ? "high" : state.cycles.length >= 3 ? "moderate" : "early";

    // Wider ranges when history is short or varies — avoid false precision.
    const avg = state.stats.average;
    const half = Math.max(
      state.confidence === "high" ? 1 : state.confidence === "moderate" ? 2 : 3,
      Math.ceil(spread),
      state.stats.irregular ? Math.ceil((max - min) / 2) : 0,
    );
    let mid = addDays(latest.start, avg);
    // If today is already past the estimate, the period is simply late — don't invent a new date.
    if (mid < today) mid = today;
    state.nextPeriod = { from: addDays(mid, -half), to: addDays(mid, half), mid };

    // Ovulation window only with at least two completed cycles.
    if (state.cycles.length >= 2 && avg - LUTEAL > (state.periodLength ?? 1)) {
      const ov = avg - LUTEAL; // cycle day (0-based offset from start)
      const ovHalf = Math.max(1, Math.ceil(half / 2));
      state.ovulation = { from: addDays(latest.start, ov - ovHalf), to: addDays(latest.start, ov + ovHalf) };
      const len = Math.max(avg, state.current.day);
      const menEnd = state.current.periodEnd
        ? daysBetween(latest.start, state.current.periodEnd) + 1
        : state.periodLength ?? 0;
      const ovFrom = ov - ovHalf + 1;
      const ovTo = ov + ovHalf + 1;
      state.segments = [
        ...(menEnd ? [{ phase: "menstrual" as Phase, from: 1, to: menEnd }] : []),
        { phase: "follicular", from: menEnd + 1, to: ovFrom - 1 },
        { phase: "ovulation", from: ovFrom, to: ovTo },
        { phase: "luteal", from: ovTo + 1, to: len },
      ].filter((s) => s.to >= s.from);
      state.phase = state.segments.find((s) => state.current!.day >= s.from && state.current!.day <= s.to)?.phase;
    }
  }

  // Without enough history for the full picture, we can still say "period" when it's recorded.
  if (!state.phase) {
    const d = state.current.day;
    const end = state.current.periodEnd ? daysBetween(latest.start, state.current.periodEnd) + 1 : undefined;
    if (end ? d <= end : state.periodLength ? d <= state.periodLength : false) state.phase = "menstrual";
  }

  return state;
}

/**
 * Days in the late luteal phase (the 5 days before a recorded period) for
 * completed cycles only — so Analytics never relies on predictions.
 */
export function lateLutealDays(events: BloomEvent[]): { late: Set<string>; known: Set<string> } {
  const starts = periodsOf(events).map((p) => p.start).sort();
  const late = new Set<string>();
  const known = new Set<string>();
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetween(starts[i - 1], starts[i]);
    if (len < MIN_CYCLE || len > MAX_CYCLE) continue;
    for (let d = 0; d < len; d++) {
      const day = addDays(starts[i - 1], d);
      known.add(day);
      if (d >= len - 5) late.add(day);
    }
  }
  return { late, known };
}

/** Cycle day for a date from recorded period starts, if one is known. */
export function cycleDayOn(starts: string[], date: string) {
  const prior = starts.filter((s) => s <= date).sort().pop();
  if (!prior) return undefined;
  const d = daysBetween(prior, date) + 1;
  return d <= MAX_CYCLE ? d : undefined;
}

export const shortDate = (iso: string) => toDate(iso).toLocaleDateString(undefined, { day: "numeric", month: "long" });
export function rangeText(from: string, to: string) {
  const a = toDate(from);
  const b = toDate(to);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${b.toLocaleDateString(undefined, { month: "long" })}`;
  return `${shortDate(from)} – ${shortDate(to)}`;
}

import type { BloomEvent, DailySnapshot, EventCategory } from "./types";

/** Categories Bloom expects to see on a normal day. */
const expected: EventCategory[] = ["weight", "water", "sleep", "food", "mood", "journal"];

export const isoDate = (value: string | Date = new Date()) =>
  (typeof value === "string" ? new Date(value) : value).toISOString().slice(0, 10);

/** Local calendar day of an event, so evening entries don't slide into tomorrow. */
function localDay(at: string) {
  const d = new Date(at);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Builds the hidden summary of a single day from the shared event list. The
 * Dashboard, insights and future AI prompts all read this rather than reaching
 * into individual features.
 */
export function buildDailySnapshot(
  events: BloomEvent[],
  date: string = isoDate(),
): DailySnapshot {
  const dayEvents = events
    .filter((e) => localDay(e.at) === date)
    .sort((a, b) => b.at.localeCompare(a.at));

  // Oldest first, so "latest wins" for level metrics and sums build in order.
  const ordered = [...dayEvents].reverse();

  const snapshot: DailySnapshot = {
    date,
    journalWritten: false,
    medicationTaken: false,
    goalsCompleted: 0,
    goalStepsCompleted: 0,
    missingLogs: [],
    events: dayEvents,
  };

  let water = 0;
  let steps = 0;
  let protein = 0;
  let calories = 0;
  let carbs = 0;
  let fat = 0;

  for (const event of ordered) {
    const m = event.metrics ?? {};

    snapshot.weightKg = num(m.weight) ?? snapshot.weightKg;
    snapshot.bodyFatPercent = num(m.bodyFat) ?? snapshot.bodyFatPercent;
    snapshot.cycleDay = num(m.cycle) ?? snapshot.cycleDay;
    snapshot.sleepMinutes = num(m.sleep) ?? snapshot.sleepMinutes;
    snapshot.recoveryPercent = num(m.recovery) ?? snapshot.recoveryPercent;
    snapshot.hrv = num(m.hrv) ?? snapshot.hrv;
    snapshot.mood = str(m.mood) ?? snapshot.mood;
    snapshot.stress = str(m.stress) ?? snapshot.stress;
    snapshot.workout = str(m.training) ?? snapshot.workout;

    water += num(m.water) ?? 0;
    steps = num(m.steps) ?? steps;
    protein += num(m.protein) ?? 0;
    calories += num(m.calories) ?? 0;
    carbs += num(m.carbs) ?? 0;
    fat += num(m.fat) ?? 0;

    if (event.category === "journal") snapshot.journalWritten = true;
    if (event.category === "medication") snapshot.medicationTaken = true;
    if (event.category === "goal") {
      if (event.detail?.toLowerCase().includes("step")) snapshot.goalStepsCompleted += 1;
      if (event.title.toLowerCase().includes("completed")) snapshot.goalsCompleted += 1;
    }
  }

  if (water) snapshot.waterL = round(water);
  if (steps) snapshot.steps = steps;
  if (protein) snapshot.proteinG = Math.round(protein);
  if (calories) snapshot.caloriesKcal = Math.round(calories);
  if (carbs) snapshot.carbsG = Math.round(carbs);
  if (fat) snapshot.fatG = Math.round(fat);

  const seen = new Set(dayEvents.map((e) => e.category));
  snapshot.missingLogs = expected.filter((c) => !seen.has(c));

  return snapshot;
}

/** The last `days` snapshots, newest first — the basis for trends. */
export function buildRecentSnapshots(events: BloomEvent[], days = 7): DailySnapshot[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return buildDailySnapshot(events, isoDate(d));
  });
}

/** "7h 38m" from stored minutes. */
export function formatSleep(minutes?: number): string | undefined {
  if (!minutes) return undefined;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

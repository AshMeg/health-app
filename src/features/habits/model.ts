import { useEffect, useState } from "react";

import { localDate } from "@/features/measurements/model";
import type { BloomEvent } from "@/features/timeline/types";

/**
 * Habits — a first-class entity, never a goal type. The habit definition
 * lives here; every check-in is a shared BloomEvent (category "habit",
 * `habitId`, `value` = amount done), so Analytics and Bloom intelligence can
 * read completion, targets and dates from the one timeline.
 */

export type HabitFrequency =
  | { kind: "daily" }
  | { kind: "weekly"; times: number }
  /** Specific weekdays, 0 = Sunday … 6 = Saturday. */
  | { kind: "custom"; days: number[] };

export type HabitMethod = "yes-no" | "quantity" | "duration" | "repetitions";

export type Habit = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  goalId?: string;
  frequency: HabitFrequency;
  method: HabitMethod;
  /** Amount per check-in for quantity/duration/repetitions. */
  target?: number;
  unit?: string;
  createdAt: string;
  archivedAt?: string;
};

export const methodMeta: Record<HabitMethod, { label: string; example: string; unit?: string }> = {
  "yes-no": { label: "Yes / No", example: "Took vitamins" },
  quantity: { label: "Quantity", example: "Drink 2 litres of water", unit: "litres" },
  duration: { label: "Duration", example: "Meditate for 10 minutes", unit: "minutes" },
  repetitions: { label: "Repetitions", example: "3 sets of exercises", unit: "reps" },
};

export const habitIcons = ["🌿", "💧", "🚶", "🏋️", "🧘", "📖", "💊", "🥗", "😴", "✍️", "🎵", "☀️"];
export const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KEY = "bloom.habits.v1";
let store: Habit[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) store = JSON.parse(raw) as Habit[];
  } catch {
    /* ignore */
  }
}

function write(next: Habit[]) {
  store = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* session only */
  }
  listeners.forEach((l) => l());
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(store);
  useEffect(() => {
    const l = () => setHabits(store);
    listeners.add(l);
    load();
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    habits,
    active: habits.filter((h) => !h.archivedAt),
    archived: habits.filter((h) => h.archivedAt),
  };
}

export function addHabit(h: Omit<Habit, "id" | "createdAt">) {
  load();
  const habit: Habit = { ...h, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  write([...store, habit]);
  return habit;
}

export function updateHabit(id: string, patch: Partial<Habit>) {
  load();
  write(store.map((h) => (h.id === id ? { ...h, ...patch } : h)));
}

export function frequencyText(f: HabitFrequency) {
  if (f.kind === "daily") return "Every day";
  if (f.kind === "weekly") return `${f.times} time${f.times === 1 ? "" : "s"} a week`;
  return f.days.length ? `Every ${f.days.map((d) => weekdayNames[d]).join(", ")}` : "Custom days";
}

export function targetText(h: Habit) {
  if (h.method === "yes-no" || !h.target) return "Done / not done";
  return `${h.target} ${h.unit ?? methodMeta[h.method].unit ?? ""}`.trim();
}

export const checkInsFor = (events: BloomEvent[], habitId: string) =>
  events.filter((e) => e.category === "habit" && e.habitId === habitId);

/** Total done per local day. */
export function dailyTotals(events: BloomEvent[], habitId: string) {
  const map = new Map<string, number>();
  for (const e of checkInsFor(events, habitId)) {
    const d = localDate(e.at);
    map.set(d, (map.get(d) ?? 0) + (e.value ?? 1));
  }
  return map;
}

const met = (h: Habit, amount: number | undefined) =>
  amount !== undefined && (h.method === "yes-no" || !h.target ? amount > 0 : amount >= h.target);

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDate(d);
}

export type Consistency = {
  /** Scheduled occasions looked at, newest window. */
  done: number;
  of: number;
  unit: "times" | "weeks";
  /** All-time. */
  allDone: number;
  allOf: number;
  lastDone?: string;
  /** Latest scheduled occasions, oldest first, for the history strip. */
  recent: { date: string; label: string; done: boolean; amount?: number }[];
  /** Consecutive scheduled occasions completed, most recent first. Shown quietly. */
  run: number;
};

/**
 * Consistency over the last 21 scheduled days (daily/custom) or 8 weeks
 * (weekly). The current day/week only counts once it's done, so today never
 * shows as "missed" before it's over.
 */
export function consistency(h: Habit, events: BloomEvent[], today = localDate()): Consistency {
  const totals = dailyTotals(events, h.id);
  const firstLog = [...totals.keys()].sort()[0];
  const created = localDate(h.createdAt);
  const start = firstLog && firstLog < created ? firstLog : created;
  const lastDone = [...totals.entries()].filter(([, v]) => met(h, v)).map(([d]) => d).sort().at(-1);

  const occasions: { date: string; label: string; done: boolean; amount?: number }[] = [];
  if (h.frequency.kind === "weekly") {
    const times = h.frequency.times;
    // Weeks start Monday.
    const t = new Date(`${today}T12:00:00`);
    let weekStart = addDays(today, -((t.getDay() + 6) % 7));
    while (weekStart >= addDays(start, -6)) {
      let count = 0;
      for (let i = 0; i < 7; i++) if (met(h, totals.get(addDays(weekStart, i)))) count++;
      const current = weekStart > addDays(today, -7);
      const done = count >= times;
      if (!current || done) occasions.push({ date: weekStart, label: `Week of ${weekStart}`, done, amount: count });
      weekStart = addDays(weekStart, -7);
    }
  } else {
    const days = h.frequency.kind === "custom" ? h.frequency.days : [0, 1, 2, 3, 4, 5, 6];
    for (let d = today; d >= start; d = addDays(d, -1)) {
      if (!days.includes(new Date(`${d}T12:00:00`).getDay())) continue;
      const amount = totals.get(d);
      const done = met(h, amount);
      if (d === today && !done) continue;
      occasions.push({ date: d, label: d, done, amount });
    }
  }
  // occasions are newest first here
  const windowSize = h.frequency.kind === "weekly" ? 8 : 21;
  const win = occasions.slice(0, windowSize);
  let run = 0;
  for (const o of occasions) {
    if (!o.done) break;
    run++;
  }
  return {
    done: win.filter((o) => o.done).length,
    of: win.length,
    unit: h.frequency.kind === "weekly" ? "weeks" : "times",
    allDone: occasions.filter((o) => o.done).length,
    allOf: occasions.length,
    lastDone,
    recent: win.slice().reverse(),
    run,
  };
}

export function consistencyText(c: Consistency) {
  if (!c.of) return "Just getting started — every check-in counts.";
  if (c.unit === "weeks")
    return `You've reached this in ${c.done} of the last ${c.of} week${c.of === 1 ? "" : "s"}.`;
  return `You've completed this habit ${c.done} of the last ${c.of} time${c.of === 1 ? "" : "s"}.`;
}

/** Active bees: something done in the last 7 days. Resting bees never leave. */
export function isBuzzing(c: Consistency, today = localDate()) {
  return !!c.lastDone && c.lastDone > addDays(today, -7);
}

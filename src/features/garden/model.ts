import type { BloomGoal } from "@/features/goals/types";
import type { BloomEvent } from "@/features/timeline/types";

/**
 * The Garden's data model. Everything here is derived from goals and the
 * shared event timeline — the Garden never keeps its own copy of a record.
 * New plant kinds, areas or growth rules plug in by extending these builders.
 */

export type Season = "spring" | "summer" | "autumn" | "winter";

export function seasonFor(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export const seasonCopy: Record<Season, string> = {
  spring: "Spring in your garden — everything is beginning again.",
  summer: "Summer in your garden — warm, full and busy.",
  autumn: "Autumn in your garden — a softer season for looking back.",
  winter: "Winter in your garden — quiet, resting and still yours.",
};

export const MEMORY_ORIGIN = "memory";

/** Growth stages, youngest first. More stages can be added later. */
export type GrowthStage = "seedling" | "bud" | "bloom" | "mature";

export type FlowerVariety = "daisy" | "tulip" | "rose" | "bell";

export type GardenFlower = {
  id: string;
  goalId: string;
  title: string;
  accent: BloomGoal["accent"];
  variety: FlowerVariety;
  stage: GrowthStage;
  completedOn: string;
  photoCount: number;
};

export type GardenButterfly = {
  id: string;
  title: string;
  date: string;
  event: BloomEvent;
};

export type HabitState = {
  goalId: string;
  title: string;
  active: boolean;
  lastActivity?: string;
  activityCount: number;
  streak?: number;
};

export type GardenMonth = {
  key: string; // YYYY-MM
  year: number;
  month: number;
  flowers: GardenFlower[];
  butterflies: GardenButterfly[];
  photos: string[];
  reflections: { goalId: string; goalTitle: string; body: string; date: string }[];
};

export type GardenYear = { year: number; months: GardenMonth[]; size: number };

const varietyFor: Record<BloomGoal["type"], FlowerVariety> = {
  outcome: "tulip",
  habit: "daisy",
  wellbeing: "bell",
  "life-event": "rose",
};

const DAY = 86_400_000;

/** Flowers mature with time and with the reflection that surrounds them. */
export function growthStage(goal: BloomGoal, now = new Date()): GrowthStage {
  const completed = new Date(goal.completedAt ?? now).getTime();
  const days = Math.max(0, (now.getTime() - completed) / DAY);
  const care = goal.notes.length + (goal.photos?.length ?? 0) * 2;
  const score = days / 14 + care;
  if (score < 1) return "seedling";
  if (score < 3) return "bud";
  if (score < 6) return "bloom";
  return "mature";
}

export function buildFlowers(completed: BloomGoal[]): GardenFlower[] {
  return completed.map((goal) => ({
    id: `flower-${goal.id}`,
    goalId: goal.id,
    title: goal.title,
    accent: goal.accent,
    variety: varietyFor[goal.type],
    stage: growthStage(goal),
    completedOn: (goal.completedAt ?? goal.startDate).slice(0, 10),
    photoCount: goal.photos?.length ?? 0,
  }));
}

export function isMemory(event: BloomEvent) {
  return event.origin === MEMORY_ORIGIN;
}

export function buildButterflies(events: BloomEvent[]): GardenButterfly[] {
  return events
    .filter(isMemory)
    .map((event) => ({ id: event.id, title: event.title, date: event.at.slice(0, 10), event }));
}

function lastOf(dates: string[]) {
  return dates.length ? [...dates].sort().at(-1) : undefined;
}

/** Habits are dormant after a quiet week — never removed. */
export function buildHabits(goals: BloomGoal[], now = new Date()): HabitState[] {
  return goals
    .filter(
      (g) =>
        g.type === "habit" || g.tracking.method === "streak" || g.tracking.method === "repetition",
    )
    .map((goal) => {
      const t = goal.tracking;
      let dates: string[] = [];
      let streak: number | undefined;
      if (t.method === "streak") {
        dates = t.history;
        streak = t.current;
      } else if (t.method === "repetition") {
        dates = t.logs.map((l) => l.date);
      } else {
        dates = goal.updates.map((u) => u.date);
      }
      dates = dates.filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d));
      const lastActivity = lastOf(dates);
      const active =
        !goal.pausedAt &&
        !!lastActivity &&
        now.getTime() - new Date(lastActivity).getTime() < 7 * DAY;
      return {
        goalId: goal.id,
        title: goal.title,
        active,
        lastActivity,
        activityCount: dates.length,
        streak,
      };
    });
}

export function buildYears(input: {
  flowers: GardenFlower[];
  butterflies: GardenButterfly[];
  goals: BloomGoal[];
  now?: Date;
}): GardenYear[] {
  const months = new Map<string, GardenMonth>();
  const month = (date: string) => {
    const key = date.slice(0, 7);
    let m = months.get(key);
    if (!m) {
      m = {
        key,
        year: Number(key.slice(0, 4)),
        month: Number(key.slice(5, 7)) - 1,
        flowers: [],
        butterflies: [],
        photos: [],
        reflections: [],
      };
      months.set(key, m);
    }
    return m;
  };

  const goalById = new Map(input.goals.map((g) => [g.id, g]));
  for (const f of input.flowers) {
    const m = month(f.completedOn);
    m.flowers.push(f);
    for (const p of goalById.get(f.goalId)?.photos ?? []) m.photos.push(p.src);
  }
  for (const b of input.butterflies) {
    const m = month(b.date);
    m.butterflies.push(b);
    m.photos.push(...(b.event.photos ?? []));
  }
  for (const g of input.goals) {
    for (const r of g.reflections ?? [])
      month(r.date).reflections.push({ goalId: g.id, goalTitle: g.title, body: r.body, date: r.date });
    for (const n of g.notes) {
      if (!months.has(n.date.slice(0, 7)) && !g.completedAt) continue;
      month(n.date).reflections.push({ goalId: g.id, goalTitle: g.title, body: n.body, date: n.date });
    }
  }

  const years = new Map<number, GardenMonth[]>();
  years.set((input.now ?? new Date()).getFullYear(), []);
  for (const m of months.values()) {
    if (!years.has(m.year)) years.set(m.year, []);
    years.get(m.year)!.push(m);
  }
  return [...years.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, ms]) => ({
      year,
      months: ms.sort((a, b) => a.key.localeCompare(b.key)),
      size: ms.reduce((n, m) => n + m.flowers.length + m.butterflies.length, 0),
    }));
}

/** Deterministic pseudo-random so the garden keeps its shape between visits. */
export function seeded(id: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Downscales an image file to a small JPEG data URL so it fits in local storage. */
export function fileToPhoto(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

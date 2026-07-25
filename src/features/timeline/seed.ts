import type { BloomEvent } from "./types";

function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

let n = 0;
const id = () => `seed-${(n += 1)}`;

/**
 * A believable few days of history so every screen has something to react to.
 * These are ordinary events — nothing treats them differently from data the
 * user records themselves.
 */
export const seedEvents: BloomEvent[] = [
  {
    id: id(),
    at: at(0, 6, 48),
    category: "sleep",
    source: "sync",
    title: "Sleep synced",
    detail: "7h 38m",
    value: 458,
    unit: "min",
    metrics: { sleep: 458 },
    origin: "Oura",
  },
  {
    id: id(),
    at: at(0, 6, 50),
    category: "recovery",
    source: "sync",
    title: "Recovery updated",
    detail: "68% · HRV 54 ms",
    value: 68,
    unit: "%",
    metrics: { recovery: 68, hrv: 54, restingHr: 52 },
    origin: "Oura",
  },
  {
    id: id(),
    at: at(0, 7, 15),
    category: "weight",
    source: "manual",
    title: "Weight logged",
    detail: "71.4 kg",
    value: 71.4,
    unit: "kg",
    metrics: { weight: 71.4, bodyFat: 27.1 },
  },
  {
    id: id(),
    at: at(0, 8, 2),
    category: "mood",
    source: "manual",
    title: "Mood recorded",
    detail: "Calm · stress medium",
    metrics: { mood: "Calm", stress: "Medium" },
  },
  {
    id: id(),
    at: at(0, 8, 30),
    category: "cycle",
    source: "manual",
    title: "Cycle day 12",
    detail: "Follicular phase",
    value: 12,
    metrics: { cycle: 12 },
  },
  {
    id: id(),
    at: at(0, 9, 5),
    category: "water",
    source: "manual",
    title: "Water added",
    detail: "0.3 L",
    value: 0.3,
    unit: "L",
    metrics: { water: 0.3 },
  },
  {
    id: id(),
    at: at(1, 20, 10),
    category: "food",
    source: "sync",
    title: "Food synced",
    detail: "1,624 kcal · 118 g protein",
    metrics: { calories: 1624, protein: 118, carbs: 162, fat: 54 },
    origin: "MyFitnessPal",
  },
  {
    id: id(),
    at: at(1, 18, 20),
    category: "workout",
    source: "manual",
    title: "Workout completed",
    detail: "Strength · 48 min",
    metrics: { training: "Strength" },
  },
  {
    id: id(),
    at: at(1, 21, 40),
    category: "steps",
    source: "sync",
    title: "Steps synced",
    detail: "9,204 steps",
    value: 9204,
    metrics: { steps: 9204 },
    origin: "Apple Health",
  },
  {
    id: id(),
    at: at(1, 22, 5),
    category: "journal",
    source: "manual",
    title: "Journal written",
    detail: "A steady day. Training felt easier than last week.",
    metrics: { journal: "written" },
  },
  {
    id: id(),
    at: at(2, 7, 30),
    category: "weight",
    source: "manual",
    title: "Weight logged",
    detail: "71.6 kg",
    value: 71.6,
    unit: "kg",
    metrics: { weight: 71.6 },
  },
  {
    id: id(),
    at: at(3, 9, 0),
    category: "measurement",
    source: "manual",
    title: "Measurement updated",
    detail: "Waist 78.5 cm",
    value: 78.5,
    unit: "cm",
    metrics: { measurement: 78.5 },
  },
];

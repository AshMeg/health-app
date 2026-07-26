import type { DailySnapshot, EventCategory } from "@/features/timeline/types";
import { formatSleep } from "@/features/timeline/snapshot";
import type { BloomAccent } from "@/features/today/types";

/** One reading pulled out of a day's snapshot. */
export type MetricReader = {
  label: string;
  unit?: string;
  read: (day: DailySnapshot) => string | undefined;
};

/**
 * Each metric page answers exactly one question. Everything else about the
 * page — the stats, the logging shortcuts, the history — is derived from here.
 */
export type MetricPageConfig = {
  id: string;
  title: string;
  /** The single question this page exists to answer. */
  question: string;
  intro: string;
  accent: BloomAccent;
  /** Events shown in this page's history. */
  categories: EventCategory[];
  /** Quick Add specs offered as logging shortcuts. */
  quickAddIds: string[];
  readers: MetricReader[];
  /** What this metric is connected to elsewhere in Bloom. */
  connectedTo: string;
};

const one = (value?: number, digits = 0) =>
  value === undefined ? undefined : value.toFixed(digits);

export const metricPages: Record<string, MetricPageConfig> = {
  weight: {
    id: "weight",
    title: "Weight",
    question: "Is my weight moving in the direction I want?",
    intro: "Your latest reading, how it compares with recent days, and every weight you've logged.",
    accent: "sage",
    categories: ["weight"],
    quickAddIds: ["weight"],
    connectedTo: "Nutrition, Training and any weight goal you've set",
    readers: [
      { label: "Weight", unit: "kg", read: (d) => one(d.weightKg, 1) },
      { label: "Body fat", unit: "%", read: (d) => one(d.bodyFatPercent, 1) },
    ],
  },
  nutrition: {
    id: "nutrition",
    title: "Nutrition",
    question: "Am I fuelling myself well today?",
    intro: "Calories, protein and water as they build through the day.",
    accent: "blush",
    categories: ["food", "water"],
    quickAddIds: ["food", "water"],
    connectedTo: "Weight, Training and Recovery",
    readers: [
      { label: "Calories", unit: "kcal", read: (d) => one(d.caloriesKcal) },
      { label: "Protein", unit: "g", read: (d) => one(d.proteinG) },
      { label: "Carbs", unit: "g", read: (d) => one(d.carbsG) },
      { label: "Fat", unit: "g", read: (d) => one(d.fatG) },
      { label: "Water", unit: "L", read: (d) => one(d.waterL, 1) },
    ],
  },
  sleep: {
    id: "sleep",
    title: "Sleep",
    question: "Am I getting enough rest?",
    intro: "Last night compared with the rest of your week.",
    accent: "sky",
    categories: ["sleep"],
    quickAddIds: ["sleep"],
    connectedTo: "Recovery, Mood and Training",
    readers: [{ label: "Sleep", read: (d) => formatSleep(d.sleepMinutes) }],
  },
  training: {
    id: "training",
    title: "Training",
    question: "Am I moving as often as I intend to?",
    intro: "What you've done recently, and how steady the pattern has been.",
    accent: "lavender",
    categories: ["workout", "steps"],
    quickAddIds: ["workout"],
    connectedTo: "Recovery, Weight and Nutrition",
    readers: [
      { label: "Today's session", read: (d) => d.workout },
      { label: "Steps", read: (d) => (d.steps ? d.steps.toLocaleString() : undefined) },
    ],
  },
  recovery: {
    id: "recovery",
    title: "Recovery",
    question: "How ready is my body today?",
    intro: "Readiness, heart rate variability and how you've been feeling.",
    accent: "sage",
    categories: ["recovery", "mood"],
    quickAddIds: ["mood"],
    connectedTo: "Sleep, Training and Mood",
    readers: [
      { label: "Recovery", unit: "%", read: (d) => one(d.recoveryPercent) },
      { label: "HRV", unit: "ms", read: (d) => one(d.hrv) },
      { label: "Mood", read: (d) => d.mood },
      { label: "Stress", read: (d) => d.stress },
    ],
  },
  cycle: {
    id: "cycle",
    title: "Cycle",
    question: "Where am I in my cycle, and what's typical here?",
    intro: "Your cycle day and everything you've noted alongside it.",
    accent: "blush",
    categories: ["cycle"],
    quickAddIds: ["period"],
    connectedTo: "Mood, Training, Recovery and Weight",
    readers: [{ label: "Cycle day", read: (d) => one(d.cycleDay) }],
  },
  measurements: {
    id: "measurements",
    title: "Measurements",
    question: "How is my body shape changing over time?",
    intro: "Measurements change slowly — this is the long view.",
    accent: "sage",
    categories: ["measurement"],
    quickAddIds: ["measurement"],
    connectedTo: "Weight and Training",
    readers: [{ label: "Body fat", unit: "%", read: (d) => one(d.bodyFatPercent, 1) }],
  },
  journal: {
    id: "journal",
    title: "Journal",
    question: "What's been on my mind lately?",
    intro: "Your own words, kept alongside everything else Bloom knows.",
    accent: "stone",
    categories: ["journal", "life-event"],
    quickAddIds: ["journal", "life-event"],
    connectedTo: "Mood, Recovery and your goals",
    readers: [
      { label: "Written today", read: (d) => (d.journalWritten ? "Yes" : undefined) },
      { label: "Mood", read: (d) => d.mood },
    ],
  },
};

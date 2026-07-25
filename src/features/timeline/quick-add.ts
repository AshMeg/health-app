import type { EventCategory, MetricKey } from "./types";

/**
 * The Quick Add menu. Each entry describes one thing a user can record and
 * exactly which metrics it feeds, so a new logger only needs a line here.
 */
export type QuickAddField =
  | { kind: "number"; label: string; unit?: string; metric: MetricKey; placeholder?: string }
  | { kind: "choice"; label: string; metric: MetricKey; options: string[] }
  | { kind: "text"; label: string; metric?: MetricKey; placeholder?: string };

export type QuickAddSpec = {
  id: string;
  label: string;
  category: EventCategory;
  /** Headline written into the shared timeline. */
  title: string;
  fields: QuickAddField[];
};

export const quickAddSpecs: QuickAddSpec[] = [
  {
    id: "weight",
    label: "Weight",
    category: "weight",
    title: "Weight logged",
    fields: [
      { kind: "number", label: "Weight", unit: "kg", metric: "weight", placeholder: "71.4" },
      { kind: "number", label: "Body fat", unit: "%", metric: "bodyFat", placeholder: "optional" },
    ],
  },
  {
    id: "water",
    label: "Water",
    category: "water",
    title: "Water added",
    fields: [{ kind: "number", label: "Amount", unit: "L", metric: "water", placeholder: "0.5" }],
  },
  {
    id: "mood",
    label: "Mood",
    category: "mood",
    title: "Mood recorded",
    fields: [
      {
        kind: "choice",
        label: "How are you feeling?",
        metric: "mood",
        options: ["Great", "Calm", "Okay", "Flat", "Tired", "Low"],
      },
      {
        kind: "choice",
        label: "Stress",
        metric: "stress",
        options: ["Low", "Medium", "High"],
      },
    ],
  },
  {
    id: "journal",
    label: "Journal",
    category: "journal",
    title: "Journal written",
    fields: [
      { kind: "text", label: "What's on your mind?", metric: "journal", placeholder: "A few words" },
    ],
  },
  {
    id: "period",
    label: "Period",
    category: "cycle",
    title: "Cycle updated",
    fields: [
      {
        kind: "choice",
        label: "What happened?",
        metric: "symptoms",
        options: ["Period started", "Period ended", "Ovulation logged", "Symptom noted"],
      },
      { kind: "number", label: "Cycle day", metric: "cycle", placeholder: "optional" },
    ],
  },
  {
    id: "workout",
    label: "Workout",
    category: "workout",
    title: "Workout completed",
    fields: [
      {
        kind: "choice",
        label: "Type",
        metric: "training",
        options: ["Strength", "Run", "Walk", "Cycle", "Swim", "Yoga", "Other"],
      },
      { kind: "text", label: "Notes", placeholder: "optional" },
    ],
  },
  {
    id: "food",
    label: "Food",
    category: "food",
    title: "Food logged",
    fields: [
      { kind: "number", label: "Calories", unit: "kcal", metric: "calories", placeholder: "620" },
      { kind: "number", label: "Protein", unit: "g", metric: "protein", placeholder: "38" },
    ],
  },
  {
    id: "sleep",
    label: "Sleep",
    category: "sleep",
    title: "Sleep logged",
    fields: [
      { kind: "number", label: "Duration", unit: "min", metric: "sleep", placeholder: "450" },
    ],
  },
  {
    id: "medication",
    label: "Medication",
    category: "medication",
    title: "Medication taken",
    fields: [{ kind: "text", label: "What did you take?", metric: "medication" }],
  },
  {
    id: "measurement",
    label: "Measurement",
    category: "measurement",
    title: "Measurement updated",
    fields: [
      { kind: "number", label: "Waist", unit: "cm", metric: "measurement", placeholder: "78.5" },
    ],
  },
  {
    id: "life-event",
    label: "Life event",
    category: "life-event",
    title: "Life event recorded",
    fields: [{ kind: "text", label: "What happened?", placeholder: "Holiday, illness, big day…" }],
  },
];

/**
 * Bloom's shared data model.
 *
 * Everything recorded anywhere in Bloom — a weight, a journal entry, a goal
 * step ticked off — becomes a `BloomEvent`. The timeline, the daily snapshot,
 * goal progress and (later) AI context are all derived from this one list, so
 * features never have to know about each other.
 */

/** Every measurable thing Bloom knows about. */
export type MetricKey =
  | "weight"
  | "bodyFat"
  | "water"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "steps"
  | "sleep"
  | "hrv"
  | "recovery"
  | "restingHr"
  | "mood"
  | "stress"
  | "cycle"
  | "symptoms"
  | "training"
  | "journal"
  | "medication"
  | "measurement";

/** The area of Bloom an event came from. */
export type EventCategory =
  | "weight"
  | "water"
  | "food"
  | "workout"
  | "sleep"
  | "recovery"
  | "cycle"
  | "mood"
  | "journal"
  | "medication"
  | "measurement"
  | "steps"
  | "goal"
  | "document"
  | "life-event"
  | "habit";

/** Manual entry by the user, or data arriving from a connected service. */
export type EventSource = "manual" | "sync";

export type BloomEvent = {
  id: string;
  /** ISO timestamp — the timeline is ordered by this. */
  at: string;
  category: EventCategory;
  source: EventSource;
  /** Plain-language headline, e.g. "Weight logged". */
  title: string;
  /** Optional supporting line, e.g. "71.4 kg". */
  detail?: string;
  /** Numeric reading where the event has one. */
  value?: number;
  unit?: string;
  /** Metrics this event carries, used to build the daily snapshot. */
  metrics?: Partial<Record<MetricKey, number | string>>;
  /** The goal this event belongs to, when it came from (or affected) one. */
  goalId?: string;
  /** Where in Bloom the event was created, for future filtering. */
  origin?: string;
  /** Longer free text, e.g. a life memory's description. */
  description?: string;
  /** Private notes attached to the event (life memories). */
  notes?: string;
  /** Downscaled photo data URLs attached to the event. */
  photos?: string[];
  /** Which body measurement a measurement event records ("waist", "hips", "custom-forearm"). */
  measure?: string;
  /** Last day of a recorded period (YYYY-MM-DD), when the user chooses to log it. */
  periodEnd?: string;
  /** The habit a habit check-in belongs to (category "habit"). */
  habitId?: string;
  /** Memories: whether the user has planted it in the Garden. Undefined = planted (older memories). */
  inGarden?: boolean;
  /** Memories: a journal entry this memory is connected to (same content, never copied). */
  journalEntryId?: string;
};

export type EventCategoryMeta = {
  label: string;
  /** The metrics this category feeds into. */
  metrics: MetricKey[];
  accent: "sage" | "lavender" | "blush" | "sky" | "stone";
};

export const eventCategoryMeta: Record<EventCategory, EventCategoryMeta> = {
  weight: { label: "Weight", metrics: ["weight", "bodyFat"], accent: "sage" },
  water: { label: "Water", metrics: ["water"], accent: "sky" },
  food: { label: "Food", metrics: ["calories", "protein", "carbs", "fat"], accent: "blush" },
  workout: { label: "Training", metrics: ["training", "steps"], accent: "lavender" },
  sleep: { label: "Sleep", metrics: ["sleep"], accent: "sky" },
  recovery: { label: "Recovery", metrics: ["recovery", "hrv", "restingHr"], accent: "sage" },
  cycle: { label: "Cycle", metrics: ["cycle", "symptoms"], accent: "blush" },
  mood: { label: "Mood", metrics: ["mood", "stress"], accent: "lavender" },
  journal: { label: "Journal", metrics: ["journal"], accent: "stone" },
  medication: { label: "Medication", metrics: ["medication"], accent: "stone" },
  measurement: { label: "Measurements", metrics: ["measurement"], accent: "sage" },
  steps: { label: "Steps", metrics: ["steps"], accent: "lavender" },
  goal: { label: "Goals", metrics: [], accent: "sage" },
  document: { label: "Documents", metrics: [], accent: "stone" },
  "life-event": { label: "Life events", metrics: [], accent: "blush" },
  habit: { label: "Habits", metrics: [], accent: "sage" },
};

/** A hidden, automatically maintained summary of one day. */
export type DailySnapshot = {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  weightKg?: number;
  bodyFatPercent?: number;
  cycleDay?: number;
  /** Set by Analytics from completed recorded cycles: the 5 days before a period. */
  cycleLateLuteal?: boolean;
  sleepMinutes?: number;
  recoveryPercent?: number;
  hrv?: number;
  proteinG?: number;
  caloriesKcal?: number;
  carbsG?: number;
  fatG?: number;
  steps?: number;
  waterL?: number;
  mood?: string;
  stress?: string;
  workout?: string;
  journalWritten: boolean;
  medicationTaken: boolean;
  goalsCompleted: number;
  goalStepsCompleted: number;
  /** Categories Bloom expected today but hasn't seen. */
  missingLogs: EventCategory[];
  /** Every event that landed on this day, newest first. */
  events: BloomEvent[];
};

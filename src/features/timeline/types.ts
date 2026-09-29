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
  | "fibre"
  | "sugar"
  | "satFat"
  | "salt"
  | "sodium"
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
  | "measurement"
  | "nap"
  | "distance"
  | "workoutMinutes"
  /** A feeling at a particular moment — separate from the day's mood. */
  | "moodObservation"
  /** Optional 1–5 strength of the day's mood. */
  | "moodIntensity";

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
  /** ISO timestamp of when it happened — the timeline, trends and goals use this. */
  at: string;
  /** When it was entered into Bloom (internal provenance, not shown). */
  loggedAt?: string;
  /** When it was last changed. */
  editedAt?: string;
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
  /** Memory status on a shared record. Memory-origin events default to true; others to false. */
  memory?: boolean;
  /** Journal status on a shared record. Journal-category events default to true; others to false. */
  inJournal?: boolean;
  /** Cycle day logs (origin "cycle-day"): flow, symptoms and energy for one day. */
  flow?: string;
  symptoms?: string[];
  energy?: string;
  /** Food entries (category "food"): what was eaten. Nutrients live in `metrics`; unknown = absent, never 0. */
  food?: FoodDetails;
  /** Sleep entries: night sleep or a nap, each its own event. */
  sleep?: SleepDetails;
  /** Workout entries: what the user did. Blank = unknown, never 0. */
  workout?: WorkoutDetails;
  /** Imported records: which provider produced it (e.g. "health-connect"). Absent = manual. */
  sourceProvider?: string;
  /** The provider's own id for the record, used to prevent duplicate imports. */
  sourceRecordId?: string;
  /** When the provider last changed the record. */
  sourceUpdatedAt?: string;
  /** When Bloom imported it. */
  importedAt?: string;
};

export type SleepDetails = { kind: "night" | "nap"; minutes: number; start?: string; end?: string };

export type WorkoutDetails = {
  type: string;
  distanceKm?: number;
  durationMin?: number;
  calories?: number;
  avgHr?: number;
  elevationM?: number;
  steps?: number;
  laps?: number;
  water?: "pool" | "open";
  exercises?: string;
  sets?: number;
  reps?: number;
  loadKg?: number;
  style?: string;
};

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "other";

export type FoodDetails = {
  name: string;
  /** Numeric amount and unit kept apart ("150" + "g"), when known. */
  quantity?: number;
  unit?: string;
  /** Free serving description when it isn't a number ("1 medium", "2 slices"). */
  serving?: string;
  meal?: MealSlot;
  /** Optional time eaten, HH:MM. Without it the entry has a date only. */
  time?: string;
  /** "manual" today; a provider name for future food databases. */
  provider?: string;
  updatedAt?: string;
};

/** One piece of the user's life can live in Journal, Memories, or both — never copied. */
export function isJournalEntry(e: BloomEvent) {
  return e.category === "journal" ? e.inJournal !== false : e.inJournal === true;
}

export type EventCategoryMeta = {
  label: string;
  /** The metrics this category feeds into. */
  metrics: MetricKey[];
  accent: "sage" | "lavender" | "blush" | "sky" | "stone";
};

export const eventCategoryMeta: Record<EventCategory, EventCategoryMeta> = {
  weight: { label: "Weight", metrics: ["weight", "bodyFat"], accent: "sage" },
  water: { label: "Water", metrics: ["water"], accent: "sky" },
  food: { label: "Food", metrics: ["calories", "protein", "carbs", "fat", "fibre", "sugar", "satFat", "salt"], accent: "blush" },
  workout: { label: "Training", metrics: ["training", "steps", "distance", "workoutMinutes"], accent: "lavender" },
  sleep: { label: "Sleep", metrics: ["sleep", "nap"], accent: "sky" },
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
  napMinutes?: number;
  distanceKm?: number;
  workoutMinutes?: number;
  recoveryPercent?: number;
  hrv?: number;
  proteinG?: number;
  caloriesKcal?: number;
  carbsG?: number;
  fatG?: number;
  fibreG?: number;
  sugarG?: number;
  satFatG?: number;
  saltG?: number;
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

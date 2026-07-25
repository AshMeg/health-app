import type { MetricKey } from "./types";

/**
 * The data relationship layer: what each metric is influenced by, and what it
 * influences in turn. Nothing reads a hard-coded pairing — insights, snapshots
 * and (later) AI prompts all ask this map instead.
 */
export const metricRelationships: Record<MetricKey, MetricKey[]> = {
  weight: [
    "calories",
    "protein",
    "cycle",
    "sleep",
    "stress",
    "recovery",
    "training",
    "water",
    "steps",
  ],
  bodyFat: ["weight", "protein", "training", "calories"],
  water: ["weight", "training", "recovery", "steps"],
  calories: ["weight", "training", "steps", "protein", "carbs", "fat"],
  protein: ["weight", "training", "recovery", "sleep", "calories"],
  carbs: ["calories", "training", "weight"],
  fat: ["calories", "weight"],
  steps: ["calories", "recovery", "sleep", "weight"],
  sleep: ["recovery", "hrv", "mood", "stress", "protein", "training"],
  hrv: ["sleep", "recovery", "stress", "training", "cycle"],
  recovery: ["sleep", "hrv", "training", "stress", "restingHr", "cycle"],
  restingHr: ["recovery", "sleep", "training", "stress"],
  mood: ["sleep", "cycle", "stress", "journal", "training", "steps"],
  stress: ["sleep", "hrv", "mood", "recovery", "journal"],
  cycle: ["mood", "weight", "recovery", "sleep", "symptoms", "hrv"],
  symptoms: ["cycle", "mood", "sleep", "recovery"],
  training: ["recovery", "sleep", "protein", "calories", "hrv", "steps"],
  journal: ["mood", "stress", "sleep"],
  medication: ["mood", "symptoms", "sleep"],
  measurement: ["weight", "training", "protein"],
};

export const metricLabels: Record<MetricKey, string> = {
  weight: "Weight",
  bodyFat: "Body fat",
  water: "Water",
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  steps: "Steps",
  sleep: "Sleep",
  hrv: "HRV",
  recovery: "Recovery",
  restingHr: "Resting heart rate",
  mood: "Mood",
  stress: "Stress",
  cycle: "Cycle",
  symptoms: "Symptoms",
  training: "Training",
  journal: "Journal",
  medication: "Medication",
  measurement: "Measurements",
};

/** Everything Bloom would look at when explaining a change in this metric. */
export function relatedMetrics(metric: MetricKey): MetricKey[] {
  return metricRelationships[metric] ?? [];
}

/** True when two metrics are meaningfully connected, in either direction. */
export function areRelated(a: MetricKey, b: MetricKey): boolean {
  return relatedMetrics(a).includes(b) || relatedMetrics(b).includes(a);
}

/** Metrics that sit at the intersection of several — good insight candidates. */
export function sharedInfluences(metrics: MetricKey[]): MetricKey[] {
  if (metrics.length < 2) return [];
  const [first, ...rest] = metrics;
  return relatedMetrics(first).filter((m) =>
    rest.every((other) => relatedMetrics(other).includes(m)),
  );
}

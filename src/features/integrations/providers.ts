import type { NewEvent } from "@/features/timeline/store";
import type { ProviderAdapter, ProviderId, ProviderRecord } from "./types";

/**
 * Provider adapters. Adding a provider means adding one entry here — the
 * Dashboard, Analytics and metric pages only ever see BloomEvents.
 *
 * None of these can connect yet: Apple Health and Health Connect need Bloom's
 * phone app, the rest need provider credentials. Their mapping is real so a
 * backend or native bridge only has to fetch records and call importRecords.
 */

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function base(r: ProviderRecord, name: string): Pick<NewEvent, "source" | "at" | "sourceProvider" | "sourceRecordId" | "sourceUpdatedAt" | "origin"> {
  return {
    source: "sync",
    at: r.at,
    sourceProvider: r.provider,
    sourceRecordId: r.recordId,
    sourceUpdatedAt: r.updatedAt,
    origin: `import:${name}`,
  };
}

const fmtSleep = (m: number) => `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;

/** Shared canonical mappers — every provider uses these, so records look identical. */
export const canonical = {
  weight(r: ProviderRecord, kg: number | undefined, name: string): NewEvent | null {
    if (kg === undefined || kg <= 0) return null;
    return { ...base(r, name), category: "weight", title: "Weight", detail: `${kg} kg`, value: kg, unit: "kg", metrics: { weight: kg } };
  },
  sleep(r: ProviderRecord, minutes: number | undefined, name: string, kind: "night" | "nap" = "night"): NewEvent | null {
    if (minutes === undefined || minutes <= 0) return null;
    return {
      ...base(r, name),
      category: "sleep",
      title: kind === "nap" ? "Nap" : "Sleep",
      detail: fmtSleep(minutes),
      sleep: { kind, minutes },
      metrics: kind === "nap" ? { nap: minutes } : { sleep: minutes },
    };
  },
  steps(r: ProviderRecord, steps: number | undefined, name: string): NewEvent | null {
    if (steps === undefined || steps < 0) return null;
    return { ...base(r, name), category: "steps", title: "Steps", detail: `${steps.toLocaleString("en-GB")} steps`, value: steps, metrics: { steps } };
  },
  workout(r: ProviderRecord, name: string): NewEvent | null {
    const type = typeof r.fields.type === "string" ? r.fields.type : "Workout";
    const distanceKm = num(r.fields.distanceKm);
    const durationMin = num(r.fields.durationMin);
    const parts = [distanceKm && `${distanceKm} km`, durationMin && `${durationMin} min`].filter(Boolean);
    return {
      ...base(r, name),
      category: "workout",
      title: type,
      detail: parts.join(" · ") || undefined,
      workout: { type, distanceKm, durationMin, calories: num(r.fields.calories), avgHr: num(r.fields.avgHr) },
      metrics: { training: type, ...(distanceKm ? { distance: distanceKm } : {}), ...(durationMin ? { workoutMinutes: durationMin } : {}) },
    };
  },
  recovery(r: ProviderRecord, name: string): NewEvent | null {
    const recovery = num(r.fields.readiness);
    const hrv = num(r.fields.hrv);
    const restingHr = num(r.fields.restingHr);
    if (recovery === undefined && hrv === undefined && restingHr === undefined) return null;
    const metrics: NewEvent["metrics"] = {};
    if (recovery !== undefined) metrics.recovery = recovery;
    if (hrv !== undefined) metrics.hrv = hrv;
    if (restingHr !== undefined) metrics.restingHr = restingHr;
    return { ...base(r, name), category: "recovery", title: "Recovery", detail: recovery !== undefined ? `${recovery}%` : undefined, metrics };
  },
  food(r: ProviderRecord, name: string): NewEvent | null {
    const calories = num(r.fields.calories);
    const foodName = typeof r.fields.name === "string" ? r.fields.name : undefined;
    if (calories === undefined || !foodName) return null;
    const metrics: NewEvent["metrics"] = { calories };
    for (const k of ["protein", "carbs", "fat", "fibre", "sugar", "sodium"] as const) {
      const v = num(r.fields[k]);
      if (v !== undefined) metrics[k] = v; // unknown stays absent, never 0
    }
    return { ...base(r, name), category: "food", title: foodName, detail: `${calories} kcal`, metrics, food: { name: foodName, provider: r.provider } } as NewEvent;
  },
  water(r: ProviderRecord, litres: number | undefined, name: string): NewEvent | null {
    if (litres === undefined || litres <= 0) return null;
    return { ...base(r, name), category: "water", title: "Water", detail: `${litres} L`, value: litres, unit: "L", metrics: { water: litres } };
  },
};

/** A standard mapper for platforms that expose many record types. */
function platformMapper(name: string, types: Record<string, (r: ProviderRecord) => NewEvent | null>) {
  return (r: ProviderRecord) => types[r.type]?.(r) ?? null;
}

export const adapters: ProviderAdapter[] = [
  {
    id: "apple-health",
    name: "Apple Health",
    group: "platforms",
    tagline: "Health and fitness data from your iPhone and Apple Watch",
    availability: "needs-app",
    availabilityNote: "Apple Health can only be read from an iPhone app. Bloom doesn't have one yet, so this can't connect from the web.",
    permissions: ["activity", "sleep", "body", "heart", "nutrition", "cycle"],
    mappings: [
      { from: "HKQuantityTypeIdentifierBodyMass", to: "Weight" },
      { from: "HKCategoryTypeIdentifierSleepAnalysis", to: "Sleep" },
      { from: "HKQuantityTypeIdentifierStepCount", to: "Steps" },
      { from: "HKWorkout", to: "Workout" },
      { from: "HKQuantityTypeIdentifierDietaryWater", to: "Water" },
    ],
    mapToBloomRecord: platformMapper("Apple Health", {
      HKQuantityTypeIdentifierBodyMass: (r) => canonical.weight(r, num(r.fields.kg), "Apple Health"),
      HKCategoryTypeIdentifierSleepAnalysis: (r) => canonical.sleep(r, num(r.fields.minutes), "Apple Health"),
      HKQuantityTypeIdentifierStepCount: (r) => canonical.steps(r, num(r.fields.count), "Apple Health"),
      HKWorkout: (r) => canonical.workout(r, "Apple Health"),
      HKQuantityTypeIdentifierDietaryWater: (r) => canonical.water(r, num(r.fields.litres), "Apple Health"),
    }),
  },
  {
    id: "health-connect",
    name: "Google Health Connect",
    group: "platforms",
    tagline: "Health and fitness data stored in Health Connect on your Android device",
    availability: "needs-app",
    availabilityNote: "Health Connect can only be read from an Android app. Bloom doesn't have one yet, so this can't connect from the web.",
    permissions: ["activity", "sleep", "body", "heart", "nutrition", "cycle"],
    mappings: [
      { from: "WeightRecord", to: "Weight" },
      { from: "SleepSessionRecord", to: "Sleep" },
      { from: "StepsRecord", to: "Steps" },
      { from: "ExerciseSessionRecord", to: "Workout" },
      { from: "HydrationRecord", to: "Water" },
      { from: "NutritionRecord", to: "Food" },
    ],
    mapToBloomRecord: platformMapper("Health Connect", {
      WeightRecord: (r) => canonical.weight(r, num(r.fields.kg), "Health Connect"),
      SleepSessionRecord: (r) => canonical.sleep(r, num(r.fields.minutes), "Health Connect"),
      StepsRecord: (r) => canonical.steps(r, num(r.fields.count), "Health Connect"),
      ExerciseSessionRecord: (r) => canonical.workout(r, "Health Connect"),
      HydrationRecord: (r) => canonical.water(r, num(r.fields.litres), "Health Connect"),
      NutritionRecord: (r) => canonical.food(r, "Health Connect"),
    }),
  },
  {
    id: "zepp",
    name: "Zepp / Amazfit",
    group: "wearables",
    tagline: "Steps, workouts, sleep and heart rate from your Amazfit watch",
    availability: "needs-provider-access",
    availabilityNote: "Needs developer access from Zepp before Bloom can connect. Zepp can also share to Health Connect on Android.",
    permissions: ["activity", "sleep", "heart"],
    mappings: [
      { from: "activity", to: "Steps" },
      { from: "sport", to: "Workout" },
      { from: "sleep", to: "Sleep" },
    ],
    mapToBloomRecord: platformMapper("Zepp", {
      activity: (r) => canonical.steps(r, num(r.fields.steps), "Zepp"),
      sport: (r) => canonical.workout(r, "Zepp"),
      sleep: (r) => canonical.sleep(r, num(r.fields.minutes), "Zepp"),
    }),
  },
  {
    id: "oura",
    name: "Oura",
    group: "wearables",
    tagline: "Sleep, readiness and activity from your Oura ring",
    availability: "needs-provider-access",
    availabilityNote: "Needs an Oura developer app to be set up for Bloom before it can connect.",
    permissions: ["activity", "sleep", "heart"],
    mappings: [
      { from: "daily_sleep / sleep", to: "Sleep" },
      { from: "daily_readiness", to: "Recovery" },
      { from: "daily_activity", to: "Steps" },
      { from: "workout", to: "Workout" },
    ],
    mapToBloomRecord: platformMapper("Oura", {
      sleep: (r) => canonical.sleep(r, num(r.fields.minutes), "Oura"),
      daily_readiness: (r) => canonical.recovery(r, "Oura"),
      daily_activity: (r) => canonical.steps(r, num(r.fields.steps), "Oura"),
      workout: (r) => canonical.workout(r, "Oura"),
    }),
  },
  {
    id: "garmin",
    name: "Garmin",
    group: "wearables",
    tagline: "Activities, steps and sleep from Garmin Connect",
    availability: "needs-provider-access",
    availabilityNote: "Garmin only shares data with approved partners. Bloom would need to apply to Garmin's programme.",
    permissions: ["activity", "sleep", "heart"],
    mappings: [
      { from: "activities", to: "Workout" },
      { from: "dailies", to: "Steps" },
      { from: "sleeps", to: "Sleep" },
    ],
    mapToBloomRecord: platformMapper("Garmin", {
      activities: (r) => canonical.workout(r, "Garmin"),
      dailies: (r) => canonical.steps(r, num(r.fields.steps), "Garmin"),
      sleeps: (r) => canonical.sleep(r, num(r.fields.minutes), "Garmin"),
    }),
  },
  {
    id: "fitbit",
    name: "Fitbit",
    group: "wearables",
    tagline: "Steps, sleep, heart rate and weight from Fitbit",
    availability: "needs-provider-access",
    availabilityNote: "Needs a Fitbit developer app to be set up for Bloom before it can connect.",
    permissions: ["activity", "sleep", "body", "heart"],
    mappings: [
      { from: "activities/steps", to: "Steps" },
      { from: "sleep", to: "Sleep" },
      { from: "body/weight", to: "Weight" },
      { from: "activities/list", to: "Workout" },
    ],
    mapToBloomRecord: platformMapper("Fitbit", {
      "activities/steps": (r) => canonical.steps(r, num(r.fields.steps), "Fitbit"),
      sleep: (r) => canonical.sleep(r, num(r.fields.minutes), "Fitbit"),
      "body/weight": (r) => canonical.weight(r, num(r.fields.kg), "Fitbit"),
      "activities/list": (r) => canonical.workout(r, "Fitbit"),
    }),
  },
  {
    id: "myfitnesspal",
    name: "MyFitnessPal",
    group: "nutrition",
    tagline: "Food and nutrition from your MyFitnessPal diary",
    availability: "needs-provider-access",
    availabilityNote: "MyFitnessPal has no open API. It needs a partner agreement with MyFitnessPal.",
    permissions: ["nutrition"],
    mappings: [{ from: "diary entry", to: "Food" }],
    mapToBloomRecord: platformMapper("MyFitnessPal", {
      diary: (r) => canonical.food(r, "MyFitnessPal"),
    }),
  },
];

export const adapterById = Object.fromEntries(adapters.map((a) => [a.id, a])) as Record<ProviderId, ProviderAdapter>;

export const providerName = (id?: string) =>
  id ? (adapterById[id as ProviderId]?.name ?? id) : "Manual";

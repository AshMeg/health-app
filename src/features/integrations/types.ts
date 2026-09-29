import type { EventCategory } from "@/features/timeline/types";

/**
 * Integration layer types. Every provider feeds the same BloomEvent model —
 * imported records differ from manual ones only by their source fields.
 */
export type ProviderId =
  | "apple-health"
  | "health-connect"
  | "zepp"
  | "oura"
  | "garmin"
  | "fitbit"
  | "myfitnesspal";

export type ProviderGroup = "platforms" | "wearables" | "nutrition";

/** What it would take to make this provider live. Honest, never "coming soon". */
export type Availability =
  | "supported" // works in Bloom today
  | "needs-app" // needs Bloom's iPhone/Android app (native health permissions)
  | "needs-provider-access" // needs developer/partner credentials from the provider
  | "not-supported";

export type ConnectionState =
  | "not-connected"
  | "connecting"
  | "connected"
  | "syncing"
  | "needs-attention"
  | "unavailable";

/** Permission groups a user can grant separately. */
export type PermissionGroup = "activity" | "sleep" | "body" | "heart" | "nutrition" | "cycle";

export type HistoryRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

/** A record as a provider hands it over, before normalisation. */
export type ProviderRecord = {
  provider: ProviderId;
  /** The provider's own id — required, it drives deduplication. */
  recordId: string;
  /** Provider-side type name, e.g. "SleepSessionRecord". */
  type: string;
  /** When it happened (ISO). */
  at: string;
  updatedAt?: string;
  fields: Record<string, number | string | undefined>;
};

export type SyncResult = {
  provider: ProviderId;
  attemptedAt: string;
  status: "success" | "partial" | "failed";
  imported: number;
  skipped: number;
  duplicates: number;
  errors: number;
  added: Partial<Record<EventCategory, number>>;
  message?: string;
};

/** The common interface every provider adapter implements. */
export type ProviderAdapter = {
  id: ProviderId;
  name: string;
  group: ProviderGroup;
  tagline: string;
  availability: Availability;
  /** Plain-language reason shown when not available. */
  availabilityNote: string;
  /** Only data types the provider genuinely offers. */
  permissions: PermissionGroup[];
  /** Provider type → Bloom record, shown in advanced details. */
  mappings: { from: string; to: string }[];
  /** Turns one provider record into a Bloom event, or null to skip it. */
  mapToBloomRecord: (record: ProviderRecord) => import("@/features/timeline/store").NewEvent | null;
};

export const permissionMeta: Record<PermissionGroup, { label: string; items: string; why: string }> = {
  activity: { label: "Activity", items: "Steps, distance, workouts", why: "Show your training and count workouts towards goals and habits" },
  sleep: { label: "Sleep", items: "Sleep duration, naps", why: "Show sleep trends and look for patterns with recovery and mood" },
  body: { label: "Body", items: "Weight, body fat", why: "Keep your weight history and weight goals up to date" },
  heart: { label: "Heart & recovery", items: "Resting heart rate, HRV, readiness", why: "Show recovery and how it relates to sleep and training" },
  nutrition: { label: "Nutrition", items: "Calories, macros, hydration", why: "Fill in your food log and nutrition trends" },
  cycle: { label: "Cycle", items: "Period days", why: "Build your cycle history and estimates" },
};

export const historyRanges: { id: HistoryRange; label: string; days: number | null }[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "3m", label: "Last 3 months", days: 91 },
  { id: "6m", label: "Last 6 months", days: 182 },
  { id: "1y", label: "Last year", days: 365 },
  { id: "all", label: "Available history", days: null },
];

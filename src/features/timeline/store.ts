import { seedEvents } from "./seed";
import type { BloomEvent, SleepDetails, WorkoutDetails, EventCategory, EventSource, MetricKey } from "./types";

const STORAGE_KEY = "bloom.events.v1";

/**
 * The one shared event store. Kept in a module-level list so every screen sees
 * the same data, and mirrored to localStorage so it survives a refresh. Swap
 * the read/write pair for server functions once events are persisted.
 */
let store: BloomEvent[] = seedEvents;
let hydratedOnce = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function byNewest(a: BloomEvent, b: BloomEvent) {
  return b.at.localeCompare(a.at);
}

function write(next: BloomEvent[]) {
  store = [...next].sort(byNewest);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — events stay for this session */
  }
  emit();
}

export function hydrateEvents() {
  if (hydratedOnce) return;
  hydratedOnce = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BloomEvent[];
      if (Array.isArray(parsed)) store = [...parsed].sort(byNewest);
    }
  } catch {
    /* ignore malformed storage */
  }
  emit();
}

export function isHydrated() {
  return hydratedOnce;
}

export function getEvents(): BloomEvent[] {
  return store;
}

export function subscribeToEvents(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type NewEvent = {
  category: EventCategory;
  title: string;
  detail?: string;
  source?: EventSource;
  value?: number;
  unit?: string;
  metrics?: Partial<Record<MetricKey, number | string>>;
  goalId?: string;
  origin?: string;
  description?: string;
  notes?: string;
  photos?: string[];
  measure?: string;
  periodEnd?: string;
  habitId?: string;
  inGarden?: boolean;
  journalEntryId?: string;
  memory?: boolean;
  inJournal?: boolean;
  /** Cycle day logs (origin "cycle-day"): flow, symptoms and energy for one day. */
  flow?: string;
  symptoms?: string[];
  energy?: string;
  sleep?: SleepDetails;
  workout?: WorkoutDetails;
  /** Defaults to now — pass an ISO string to backdate an entry. */
  at?: string;
  sourceProvider?: string;
  sourceRecordId?: string;
  sourceUpdatedAt?: string;
  importedAt?: string;
};

/** Adds many events in one write (imports). */
export function logEvents(inputs: NewEvent[]): BloomEvent[] {
  const now = new Date().toISOString();
  const created = inputs.map((input, i) => ({
    id: `e-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    at: input.at ?? now,
    source: input.source ?? "manual",
    ...input,
    loggedAt: now,
  })) as BloomEvent[];
  write([...created, ...store]);
  return created;
}

/**
 * Records one thing that happened. Everything in Bloom logs through here, so
 * the timeline, snapshots and goals all learn about it at the same moment.
 */
export function logEvent(input: NewEvent): BloomEvent {
  const event: BloomEvent = {
    id: `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: input.at ?? new Date().toISOString(),
    source: input.source ?? "manual",
    ...input,
    loggedAt: new Date().toISOString(),
  };
  write([event, ...store]);
  return event;
}

export function removeEvent(id: string) {
  write(store.filter((e) => e.id !== id));
}

/** Edits an existing event in place (used by Quick Notes). */
export function updateEvent(id: string, patch: Partial<Omit<BloomEvent, "id">>) {
  write(store.map((e) => (e.id === id ? { ...e, ...patch, editedAt: new Date().toISOString() } : e)));
}

export function clearEvents() {
  write([]);
}

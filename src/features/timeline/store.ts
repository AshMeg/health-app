import { seedEvents } from "./seed";
import type { BloomEvent, EventCategory, EventSource, MetricKey } from "./types";

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
  /** Defaults to now — pass an ISO string to backdate an entry. */
  at?: string;
};

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
  };
  write([event, ...store]);
  return event;
}

export function removeEvent(id: string) {
  write(store.filter((e) => e.id !== id));
}

export function clearEvents() {
  write([]);
}

import { useEffect, useSyncExternalStore } from "react";

/**
 * Personal target weight — a user-level reference point, not a Goal.
 * Kept as a list of target records so changes over time can be shown later;
 * the latest record without `clearedAt` is the current target. Changing it
 * never touches logged weight readings.
 */
export type TargetWeightRecord = {
  id: string;
  kg: number;
  setAt: string;
  clearedAt?: string;
};

type State = {
  history: TargetWeightRecord[];
  /** Weight goals the user explicitly marked as steps towards the target. */
  linkedGoalIds: string[];
};

const KEY = "bloom.weight.target.v1";
let state: State = { history: [], linkedGoalIds: [] };
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { history: [], linkedGoalIds: [], ...JSON.parse(raw) };
  } catch {
    /* keep empty */
  }
}

function commit(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function currentTarget(s: State = state): TargetWeightRecord | undefined {
  const last = s.history[s.history.length - 1];
  return last && !last.clearedAt ? last : undefined;
}

export function setTargetWeight(kg: number) {
  hydrate();
  const now = new Date().toISOString();
  const history = state.history.map((r) => (r.clearedAt ? r : { ...r, clearedAt: now }));
  commit({ ...state, history: [...history, { id: `tw${Date.now().toString(36)}`, kg, setAt: now }] });
}

export function clearTargetWeight() {
  hydrate();
  const now = new Date().toISOString();
  commit({ ...state, history: state.history.map((r) => (r.clearedAt ? r : { ...r, clearedAt: now })) });
}

export function toggleGoalLink(goalId: string) {
  hydrate();
  const has = state.linkedGoalIds.includes(goalId);
  commit({
    ...state,
    linkedGoalIds: has ? state.linkedGoalIds.filter((g) => g !== goalId) : [...state.linkedGoalIds, goalId],
  });
}

const EMPTY: State = { history: [], linkedGoalIds: [] };
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useTargetWeight() {
  const s = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  useEffect(() => {
    if (!hydrated) {
      hydrate();
      listeners.forEach((l) => l());
    }
  }, []);
  return { target: currentTarget(s), history: s.history, linkedGoalIds: s.linkedGoalIds };
}

/** Plain, non-judgemental distance wording. */
export function distanceToTarget(current: number, target: number): string {
  const diff = Math.round((current - target) * 10) / 10;
  if (Math.abs(diff) < 0.1) return "You're at your target";
  return `${Math.abs(diff).toFixed(1)} kg to target`;
}

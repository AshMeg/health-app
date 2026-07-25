import { useCallback, useEffect, useMemo, useState } from "react";

import { seedGoals } from "../mock-data";
import type { BloomGoal } from "../types";

const STORAGE_KEY = "bloom.goals.v3";

/**
 * Placeholder goal store. Goals live in localStorage so created goals survive
 * a refresh; swap this for server functions once goals are persisted.
 */
export function useGoals() {
  const [goals, setGoals] = useState<BloomGoal[]>(seedGoals);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BloomGoal[];
        if (Array.isArray(parsed)) setGoals(parsed);
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: BloomGoal[]) => {
    setGoals(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — goals stay for this session */
    }
  }, []);

  const addGoal = useCallback(
    (goal: BloomGoal) => {
      persist([goal, ...goals]);
    },
    [goals, persist],
  );

  const removeGoal = useCallback(
    (id: string) => persist(goals.filter((g) => g.id !== id)),
    [goals, persist],
  );

  const clearAll = useCallback(() => persist([]), [persist]);

  const getGoal = useCallback((id: string) => goals.find((g) => g.id === id), [goals]);

  const { active, complete } = useMemo(() => {
    return {
      active: goals.filter((g) => !g.completedAt),
      complete: goals.filter((g) => g.completedAt),
    };
  }, [goals]);

  return { goals, active, complete, hydrated, addGoal, removeGoal, clearAll, getGoal };
}

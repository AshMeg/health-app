import { useCallback, useEffect, useMemo, useState } from "react";

import { saveGardenMemory } from "../garden";
import { seedGoals } from "../mock-data";
import { describeMilestoneChange, describeTrackingChange, makeUpdate } from "../timeline";
import { goalProgress, type BloomGoal, type GoalMilestone, type GoalTracking } from "../types";

const STORAGE_KEY = "bloom.goals.v5";

/** Earlier versions kept milestones inside tracking; they now live on the goal. */
function migrate(goals: BloomGoal[]): BloomGoal[] {
  return goals.map((goal) => {
    const tracking = goal.tracking as GoalTracking & { milestones?: GoalMilestone[] };
    if (tracking.method !== "milestone" || !tracking.milestones) return goal;
    return {
      ...goal,
      milestones: goal.milestones ?? tracking.milestones,
      tracking: { method: "milestone" },
    };
  });
}

/**
 * Placeholder goal store. Goals live in localStorage so created goals survive
 * a refresh; swap this for server functions once goals are persisted.
 */
export function useGoals() {
  const [goals, setGoals] = useState<BloomGoal[]>(seedGoals);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      // Fall back to the previous key so goals made before milestones survive.
      const raw =
        window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("bloom.goals.v4");
      if (raw) {
        const parsed = JSON.parse(raw) as BloomGoal[];
        if (Array.isArray(parsed)) {
          const migrated = migrate(parsed);
          setGoals(migrated);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
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

  /** Applies a change to one goal and keeps the timeline honest. */
  const mutate = useCallback(
    (id: string, change: (goal: BloomGoal) => BloomGoal) => {
      persist(
        goals.map((goal) => {
          if (goal.id !== id) return goal;
          const next = change(goal);
          // Reaching 100% closes the goal and records the moment.
          if (!next.completedAt && goalProgress(next) >= 100) {
            return {
              ...next,
              completedAt: new Date().toISOString().slice(0, 10),
              updates: [makeUpdate("completed", "Goal completed"), ...next.updates],
            };
          }
          return next;
        }),
      );
    },
    [goals, persist],
  );

  const addGoal = useCallback((goal: BloomGoal) => persist([goal, ...goals]), [goals, persist]);

  const updateGoal = useCallback(
    (id: string, patch: Partial<BloomGoal>) => mutate(id, (goal) => ({ ...goal, ...patch })),
    [mutate],
  );

  /** Tracking changes describe themselves in the timeline. */
  const updateTracking = useCallback(
    (id: string, tracking: GoalTracking) =>
      mutate(id, (goal) => ({
        ...goal,
        tracking,
        updates: [...describeTrackingChange(goal.tracking, tracking).reverse(), ...goal.updates],
      })),
    [mutate],
  );

  /** Milestone edits describe themselves in the timeline. */
  const setMilestones = useCallback(
    (id: string, milestones: GoalMilestone[]) =>
      mutate(id, (goal) => ({
        ...goal,
        milestones,
        updates: [
          ...describeMilestoneChange(goal.milestones ?? [], milestones).reverse(),
          ...goal.updates,
        ],
      })),
    [mutate],
  );

  const addNote = useCallback(
    (id: string, body: string) =>
      mutate(id, (goal) => ({
        ...goal,
        notes: [
          {
            id: `n${Date.now().toString(36)}`,
            date: new Date().toISOString(),
            body: body.trim(),
          },
          ...goal.notes,
        ],
        updates: [makeUpdate("note", "Note added", body.trim()), ...goal.updates],
      })),
    [mutate],
  );

  const editNote = useCallback(
    (id: string, noteId: string, body: string) =>
      mutate(id, (goal) => ({
        ...goal,
        notes: goal.notes.map((n) =>
          n.id === noteId ? { ...n, body: body.trim(), editedAt: new Date().toISOString() } : n,
        ),
        updates: [makeUpdate("note", "Note edited", body.trim()), ...goal.updates],
      })),
    [mutate],
  );

  const deleteNote = useCallback(
    (id: string, noteId: string) =>
      mutate(id, (goal) => ({
        ...goal,
        notes: goal.notes.filter((n) => n.id !== noteId),
        updates: [makeUpdate("note", "Note deleted"), ...goal.updates],
      })),
    [mutate],
  );

  /** A timeline entry the user writes themselves. */
  const addManualUpdate = useCallback(
    (id: string, title: string, detail?: string) =>
      mutate(id, (goal) => ({
        ...goal,
        updates: [makeUpdate("manual", title.trim(), detail?.trim() || undefined), ...goal.updates],
      })),
    [mutate],
  );

  /** Keeps the completed goal as a Garden Memory for the future Garden. */
  const addToGarden = useCallback(
    (id: string) => {
      const goal = goals.find((g) => g.id === id);
      if (!goal) return;
      saveGardenMemory(goal);
      mutate(id, (g) => ({
        ...g,
        updates: [makeUpdate("completed", "Added to your Garden"), ...g.updates],
      }));
    },
    [goals, mutate],
  );

  const removeGoal = useCallback(
    (id: string) => persist(goals.filter((g) => g.id !== id)),
    [goals, persist],
  );

  const clearAll = useCallback(() => persist([]), [persist]);

  const getGoal = useCallback((id: string) => goals.find((g) => g.id === id), [goals]);

  const { active, complete } = useMemo(
    () => ({
      active: goals.filter((g) => !g.completedAt),
      complete: goals.filter((g) => g.completedAt),
    }),
    [goals],
  );

  return {
    goals,
    active,
    complete,
    hydrated,
    addGoal,
    updateGoal,
    updateTracking,
    setMilestones,
    addNote,
    editNote,
    deleteNote,
    addManualUpdate,
    addToGarden,
    removeGoal,
    clearAll,
    getGoal,
  };
}

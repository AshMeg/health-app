import { useCallback, useEffect, useMemo, useState } from "react";

import { syncGoalsWithEvent } from "@/features/timeline/goal-sync";
import { logEvent } from "@/features/timeline/store";
import type { BloomEvent } from "@/features/timeline/types";
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
 * Placeholder goal store. Goals live in localStorage so created goals survive a
 * refresh, and in a small module-level store so every screen showing goals —
 * cards, Today widgets, detail pages — stays in step. Swap this for server
 * functions once goals are persisted.
 */
let store: BloomGoal[] = seedGoals;
let hydratedOnce = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function writeStore(next: BloomGoal[]) {
  store = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — goals stay for this session */
  }
  emit();
}

function hydrateStore() {
  if (hydratedOnce) return;
  hydratedOnce = true;
  try {
    // Fall back to the previous key so goals made before milestones survive.
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("bloom.goals.v4");
    if (raw) {
      const parsed = JSON.parse(raw) as BloomGoal[];
      if (Array.isArray(parsed)) {
        const migrated = migrate(parsed);
        store = migrated;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
    }
  } catch {
    /* ignore malformed storage */
  }
  emit();
}

/** Closes a goal the moment it reaches 100%, and tells the shared timeline. */
function withCompletion(goal: BloomGoal): BloomGoal {
  if (goal.completedAt || goalProgress(goal) < 100) return goal;
  logEvent({
    category: "goal",
    title: "Goal completed",
    detail: goal.title,
    goalId: goal.id,
    origin: "Goals",
  });
  return {
    ...goal,
    completedAt: new Date().toISOString().slice(0, 10),
    updates: [makeUpdate("completed", "Goal completed"), ...goal.updates],
  };
}

/**
 * Lets goals respond to anything logged elsewhere in Bloom — a weight, a glass
 * of water, a journal entry. Called by Bloom Context after an event is stored.
 */
export function recordEventForGoals(event: BloomEvent) {
  const results = syncGoalsWithEvent(store, event);
  if (!results.length) return results;

  writeStore(
    store.map((goal) => {
      const result = results.find((r) => r.goalId === goal.id);
      if (!result) return goal;
      return withCompletion({
        ...goal,
        tracking: result.tracking,
        updates: [makeUpdate("progress", result.reason, "Updated automatically."), ...goal.updates],
      });
    }),
  );

  return results;
}



export function useGoals() {
  const [goals, setGoals] = useState<BloomGoal[]>(store);
  const [hydrated, setHydrated] = useState(hydratedOnce);

  useEffect(() => {
    const listener = () => {
      setGoals(store);
      setHydrated(hydratedOnce);
    };
    listeners.add(listener);
    hydrateStore();
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const persist = useCallback((next: BloomGoal[]) => writeStore(next), []);

  /** Applies a change to one goal and keeps the timeline honest. */
  const mutate = useCallback(
    (id: string, change: (goal: BloomGoal) => BloomGoal) => {
      persist(goals.map((goal) => (goal.id === id ? withCompletion(change(goal)) : goal)));
    },
    [goals, persist],
  );

  const addGoal = useCallback(
    (goal: BloomGoal) => {
      logEvent({
        category: "goal",
        title: "Goal created",
        detail: goal.title,
        goalId: goal.id,
        origin: "Goals",
      });
      persist([goal, ...goals]);
    },
    [goals, persist],
  );


  const updateGoal = useCallback(
    (id: string, patch: Partial<BloomGoal>) => mutate(id, (goal) => ({ ...goal, ...patch })),
    [mutate],
  );

  /** A deliberate edit from the Edit Goal screen — recorded as one entry. */
  const editGoal = useCallback(
    (id: string, patch: Partial<BloomGoal>, changed: string[]) =>
      mutate(id, (goal) => ({
        ...goal,
        ...patch,
        updates: changed.length
          ? [makeUpdate("edited", "Goal edited", `Updated ${changed.join(", ")}.`), ...goal.updates]
          : goal.updates,
      })),
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

  /** Milestone edits describe themselves, here and in the shared timeline. */
  const setMilestones = useCallback(
    (id: string, milestones: GoalMilestone[]) =>
      mutate(id, (goal) => {
        const before = goal.milestones ?? [];
        for (const step of milestones) {
          const prev = before.find((m) => m.id === step.id);
          if (prev && !prev.done && step.done) {
            logEvent({
              category: "goal",
              title: "Goal step completed",
              detail: `${step.label} · ${goal.title}`,
              goalId: goal.id,
              origin: "Goals",
            });
          }
        }
        return {
          ...goal,
          milestones,
          updates: [...describeMilestoneChange(before, milestones).reverse(), ...goal.updates],
        };
      }),
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

  /** "Not Right Now" — the goal rests, keeping every bit of its history. */
  const pauseGoal = useCallback(
    (id: string) =>
      mutate(id, (goal) => {
        logEvent({
          category: "goal",
          title: "Goal moved to Not Right Now",
          detail: goal.title,
          goalId: goal.id,
          origin: "Goals",
        });
        return {
          ...goal,
          pausedAt: new Date().toISOString(),
          updates: [
            makeUpdate("paused", "Moved to Not Right Now", "Resting for now — nothing is lost."),
            ...goal.updates,
          ],
        };
      }),
    [mutate],
  );

  /** Back into Active Goals, exactly where it left off. */
  const resumeGoal = useCallback(
    (id: string) =>
      mutate(id, (goal) => {
        logEvent({
          category: "goal",
          title: "Goal resumed",
          detail: goal.title,
          goalId: goal.id,
          origin: "Goals",
        });
        return {
          ...goal,
          pausedAt: undefined,
          updates: [makeUpdate("resumed", "Back in your active goals"), ...goal.updates],
        };
      }),
    [mutate],
  );


  const removeGoal = useCallback(
    (id: string) => persist(goals.filter((g) => g.id !== id)),
    [goals, persist],
  );

  const clearAll = useCallback(() => persist([]), [persist]);

  const getGoal = useCallback((id: string) => goals.find((g) => g.id === id), [goals]);

  const { active, complete, resting } = useMemo(
    () => ({
      active: goals.filter((g) => !g.completedAt && !g.pausedAt),
      complete: goals.filter((g) => g.completedAt),
      resting: goals.filter((g) => g.pausedAt && !g.completedAt),
    }),
    [goals],
  );

  return {
    goals,
    active,
    complete,
    resting,
    hydrated,
    addGoal,
    updateGoal,
    editGoal,
    updateTracking,
    setMilestones,
    addNote,
    editNote,
    deleteNote,
    addManualUpdate,
    addToGarden,
    pauseGoal,
    resumeGoal,
    removeGoal,
    clearAll,
    getGoal,
  };
}

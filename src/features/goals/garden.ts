import type { BloomAccent } from "@/features/today/types";
import type { BloomGoal, GoalType } from "./types";

/**
 * A completed goal, kept as a keepsake. The Garden UI doesn't exist yet — this
 * is the store it will read from when it does, so nothing is lost in the meantime.
 */
export type GardenMemory = {
  id: string;
  goalId: string;
  title: string;
  type: GoalType;
  why?: string;
  accent: BloomAccent;
  startedOn: string;
  completedOn: string;
  /** A snapshot of the story: how many notes and updates it gathered. */
  noteCount: number;
  updateCount: number;
  /** The last thing the user wrote about it, if anything. */
  closingNote?: string;
  plantedAt: string;
};

const STORAGE_KEY = "bloom.garden-memories.v1";

export function readGardenMemories(): GardenMemory[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as GardenMemory[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toGardenMemory(goal: BloomGoal): GardenMemory {
  return {
    id: `memory-${goal.id}`,
    goalId: goal.id,
    title: goal.title,
    type: goal.type,
    why: goal.why,
    accent: goal.accent,
    startedOn: goal.startDate,
    completedOn: goal.completedAt ?? new Date().toISOString().slice(0, 10),
    noteCount: goal.notes.length,
    updateCount: goal.updates.length,
    closingNote: goal.notes[0]?.body,
    plantedAt: new Date().toISOString(),
  };
}

/** Saves a memory, replacing any earlier one for the same goal. */
export function saveGardenMemory(goal: BloomGoal): GardenMemory {
  const memory = toGardenMemory(goal);
  try {
    const next = [memory, ...readGardenMemories().filter((m) => m.goalId !== goal.id)];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the memory stays for this session only */
  }
  return memory;
}

export function hasGardenMemory(goalId: string): boolean {
  return readGardenMemories().some((m) => m.goalId === goalId);
}

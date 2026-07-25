import type {
  BloomGoal,
  GoalMetric,
  GoalTracking,
  ReflectionRating,
} from "@/features/goals/types";
import type { BloomEvent, EventCategory } from "./types";

/** Which tracked metric an event feeds, when it feeds one at all. */
const categoryMetric: Partial<Record<EventCategory, GoalMetric>> = {
  weight: "weight",
  water: "water",
  food: "protein",
  sleep: "sleep",
  workout: "training",
  steps: "steps",
  mood: "mood",
  journal: "journal",
};

/** Words that tie a free-text goal title to an area of Bloom. */
const categoryKeywords: Partial<Record<EventCategory, string[]>> = {
  weight: ["weight", "kg", "lose", "lb", "scale"],
  water: ["water", "hydrat", "drink", "litre", "liter"],
  food: ["protein", "calorie", "eat", "food", "macro", "nutrition", "meal"],
  sleep: ["sleep", "bed", "rest", "night"],
  workout: ["train", "workout", "gym", "run", "session", "exercise", "yoga", "walk", "swim"],
  steps: ["step", "walk", "move"],
  mood: ["mood", "calm", "stress", "feel"],
  journal: ["journal", "reflect", "write", "diary", "gratitude"],
  medication: ["medication", "supplement", "vitamin", "pill"],
  measurement: ["waist", "measure", "chest", "hips"],
  cycle: ["cycle", "period"],
};

/** Metrics that accumulate through the day rather than replacing the last read. */
const cumulative: GoalMetric[] = ["water", "protein", "steps", "training"];

const moodRating: Record<string, ReflectionRating> = {
  great: "much-better",
  happy: "much-better",
  energised: "much-better",
  calm: "better",
  content: "better",
  okay: "same",
  flat: "same",
  tired: "worse",
  low: "worse",
  anxious: "worse",
};

function matchesCategory(goal: BloomGoal, category: EventCategory): boolean {
  const words = categoryKeywords[category] ?? [];
  const haystack = `${goal.title} ${goal.why ?? ""}`.toLowerCase();
  return words.some((w) => haystack.includes(w));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export type GoalSyncResult = {
  goalId: string;
  tracking: GoalTracking;
  /** Plain-language line for the goal's own timeline. */
  reason: string;
};

/**
 * Works out how one event moves the goals it relates to. Pure — it returns the
 * new tracking for each affected goal and leaves saving to the caller.
 */
export function syncGoalsWithEvent(goals: BloomGoal[], event: BloomEvent): GoalSyncResult[] {
  const metric = categoryMetric[event.category];
  const results: GoalSyncResult[] = [];

  for (const goal of goals) {
    if (goal.completedAt || goal.pausedAt) continue;
    const tracking = goal.tracking;

    switch (tracking.method) {
      case "automatic": {
        if (!metric || tracking.metric !== metric) break;
        if (typeof event.value !== "number") break;
        const current = cumulative.includes(metric)
          ? Math.round((tracking.current + event.value) * 100) / 100
          : event.value;
        if (current === tracking.current) break;
        results.push({
          goalId: goal.id,
          tracking: {
            ...tracking,
            current,
            history: [...(tracking.history ?? []), { date: todayIso(), value: current }].slice(-30),
          },
          reason: `${event.title} — now ${current} ${tracking.unit}`.trim(),
        });
        break;
      }

      case "repetition": {
        if (!matchesCategory(goal, event.category)) break;
        results.push({
          goalId: goal.id,
          tracking: {
            ...tracking,
            completed: tracking.completed + 1,
            logs: [
              {
                id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                date: new Date().toISOString(),
                note: event.detail,
              },
              ...tracking.logs,
            ],
          },
          reason: `${event.title} counted towards this goal`,
        });
        break;
      }

      case "streak": {
        if (!matchesCategory(goal, event.category)) break;
        const today = todayIso();
        if (tracking.history.includes(today)) break;
        const current = tracking.current + 1;
        results.push({
          goalId: goal.id,
          tracking: {
            ...tracking,
            current,
            longest: Math.max(tracking.longest, current),
            history: [...tracking.history, today],
          },
          reason: `${event.title} kept the streak going`,
        });
        break;
      }

      case "reflection": {
        if (event.category !== "journal" && event.category !== "mood") break;
        const mood = String(event.metrics?.mood ?? "").toLowerCase();
        const rating = moodRating[mood] ?? "same";
        results.push({
          goalId: goal.id,
          tracking: {
            ...tracking,
            reflections: [
              {
                id: `rf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                date: new Date().toISOString(),
                rating,
                note: event.detail,
              },
              ...tracking.reflections,
            ],
          },
          reason: `${event.title} added a reflection`,
        });
        break;
      }

      default:
        break;
    }
  }

  return results;
}

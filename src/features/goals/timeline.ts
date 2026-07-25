import type { GoalEventKind, GoalMilestone, GoalTracking, GoalUpdate } from "./types";

export const isoToday = () => new Date().toISOString().slice(0, 10);

export function makeUpdate(
  kind: GoalEventKind,
  title: string,
  detail?: string,
): GoalUpdate {
  return {
    id: `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    kind,
    title,
    detail,
  };
}

/**
 * Turns a milestone change into plain-language timeline entries, so the goal
 * records its own story without the user having to write it down.
 */
export function describeMilestoneChange(
  prev: GoalMilestone[],
  next: GoalMilestone[],
): GoalUpdate[] {
  const events: GoalUpdate[] = [];

  for (const item of next) {
    const before = prev.find((m) => m.id === item.id);
    if (!before) {
      events.push(makeUpdate("milestone", "Milestone added", item.label));
      continue;
    }
    if (!before.done && item.done) {
      events.push(makeUpdate("milestone", "Milestone completed", item.label));
    } else if (before.done && !item.done) {
      events.push(makeUpdate("edited", "Milestone reopened", item.label));
    }
  }

  for (const item of prev) {
    if (!next.find((m) => m.id === item.id)) {
      events.push(makeUpdate("edited", "Milestone removed", item.label));
    }
  }

  return events;
}

/**
 * Turns a tracking change into plain-language timeline entries, so the goal
 * records its own story without the user having to write it down.
 */
export function describeTrackingChange(
  prev: GoalTracking,
  next: GoalTracking,
): GoalUpdate[] {
  if (prev.method !== next.method) {
    return [makeUpdate("edited", "Tracking method changed", `Now tracked by ${next.method}.`)];
  }

  const events: GoalUpdate[] = [];

  if (prev.method === "checklist" && next.method === "checklist") {
    for (const item of next.items) {
      const before = prev.items.find((i) => i.id === item.id);
      if (before && !before.done && item.done) {
        events.push(makeUpdate("checklist", "Checklist item completed", item.label));
      }
      if (!before) {
        events.push(makeUpdate("edited", "Checklist item added", item.label));
      }
    }
    for (const item of prev.items) {
      if (!next.items.find((i) => i.id === item.id)) {
        events.push(makeUpdate("edited", "Checklist item removed", item.label));
      }
    }
  }


  if (prev.method === "automatic" && next.method === "automatic" && prev.current !== next.current) {
    events.push(
      makeUpdate("progress", "Progress updated", `Now at ${next.current} ${next.unit}`.trim()),
    );
  }

  if (prev.method === "repetition" && next.method === "repetition") {
    if (next.completed > prev.completed) {
      events.push(
        makeUpdate("progress", "Logged another one", `${next.completed} of ${next.target} ${next.unit}`),
      );
    } else if (next.completed < prev.completed) {
      events.push(makeUpdate("edited", "Count adjusted", `Now ${next.completed} of ${next.target}`));
    }
  }

  if (prev.method === "streak" && next.method === "streak" && next.current !== prev.current) {
    events.push(
      next.current > prev.current
        ? makeUpdate("progress", "Streak continued", `${next.current} day${next.current === 1 ? "" : "s"} in a row`)
        : makeUpdate("edited", "Streak reset", "Starting again from today."),
    );
  }

  if (prev.method === "reflection" && next.method === "reflection") {
    const added = next.reflections.filter(
      (r) => !prev.reflections.some((p) => p.id === r.id),
    );
    for (const r of added) {
      events.push(makeUpdate("reflection", "Reflection added", r.note));
    }
  }

  return events;
}

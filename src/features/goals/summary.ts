import { formatGoalDate } from "./format";
import {
  goalProgress,
  goalStatus,
  hasMilestones,
  type BloomGoal,
  type GoalMilestone,
} from "./types";

const DAY = 86_400_000;

/** "mid September" — soft enough for an estimate, precise enough to be useful. */
function softDate(date: Date): string {
  const day = date.getDate();
  const part = day <= 10 ? "early" : day <= 20 ? "mid" : "late";
  const month = date.toLocaleDateString(undefined, { month: "long" });
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return `${part} ${month}${sameYear ? "" : ` ${date.getFullYear()}`}`;
}

/** Projects a finish date from how fast the goal has moved so far. */
function estimatedFinish(goal: BloomGoal): string | null {
  const progress = goalProgress(goal);
  if (progress <= 0 || progress >= 100) return null;
  const start = new Date(goal.startDate).getTime();
  if (Number.isNaN(start)) return null;
  const elapsed = Date.now() - start;
  if (elapsed < DAY) return null;
  const projected = start + (elapsed / progress) * 100;
  return softDate(new Date(projected));
}

function stepsPhrase(milestones: GoalMilestone[]): string {
  const done = milestones.filter((m) => m.done).length;
  return `${done} of ${milestones.length} steps completed`;
}

function nextUndoneStep(milestones: GoalMilestone[]): string | null {
  return milestones.find((m) => !m.done)?.label ?? null;
}

/** "Lost 1.6 kg of 5 kg" for downward goals, "1.6 of 5 kg" for upward ones. */
function automaticPhrase(goal: BloomGoal): string | null {
  if (goal.tracking.method !== "automatic") return null;
  const { start, current, target, unit } = goal.tracking;
  const moved = Math.abs(current - start);
  const span = Math.abs(target - start);
  const round = (n: number) => (Number.isInteger(n) ? n : Math.round(n * 10) / 10);
  const suffix = unit ? ` ${unit}` : "";
  if (span === 0) return `${round(current)}${suffix} recorded`;
  const verb = target < start ? "Lost " : "";
  return `${verb}${round(moved)}${suffix} of ${round(span)}${suffix}`;
}

/**
 * The instant read of a goal, shown right under its title. Each tracking
 * method gets the wording that actually answers "where am I?".
 */
export function goalSummaryParts(goal: BloomGoal): string[] {
  const progress = goalProgress(goal);
  const parts: string[] = [];

  if (goal.completedAt) {
    parts.push("Complete");
    parts.push(`Finished ${formatGoalDate(goal.completedAt)}`);
    return parts;
  }

  const milestones = goal.milestones ?? [];

  if (hasMilestones(goal)) {
    parts.push(`${progress}% complete`, stepsPhrase(milestones));
    const next = nextUndoneStep(milestones);
    if (next) parts.push(`Next step: ${next}`);
  } else {
    switch (goal.tracking.method) {
      case "automatic": {
        parts.push(`${progress}% complete`);
        const phrase = automaticPhrase(goal);
        if (phrase) parts.push(phrase);
        break;
      }
      case "checklist": {
        const { items } = goal.tracking;
        const done = items.filter((i) => i.done).length;
        parts.push(`${done} of ${items.length} completed`);
        const next = items.find((i) => !i.done)?.label;
        if (next) parts.push(`Next step: ${next}`);
        break;
      }
      case "repetition": {
        const { completed, target, unit } = goal.tracking;
        parts.push(`${completed} of ${target} ${unit || "times"} completed`);
        break;
      }
      case "streak": {
        const { current, targetDays, cadence } = goal.tracking;
        parts.push(`${current} of ${targetDays} days`, cadence);
        break;
      }
      case "reflection": {
        const count = goal.tracking.reflections.length;
        parts.push(
          count ? `${count} reflection${count === 1 ? "" : "s"} so far` : "No reflections yet",
        );
        break;
      }
      case "milestone":
        parts.push("No steps yet");
        break;
    }
  }

  parts.push(`Started ${formatGoalDate(goal.startDate)}`);

  if (goal.pausedAt) {
    parts.push("Resting for now");
    return parts;
  }

  const finish = estimatedFinish(goal);
  if (goal.targetDate) {
    parts.push(`Due ${formatGoalDate(goal.targetDate)}`);
  } else if (finish) {
    parts.push(`Estimated completion ${finish}`);
  }

  const status = goalStatus(goal);
  if (status === "on-track") parts.push("On track");
  if (status === "needs-attention") parts.push("Needs a little attention");

  return parts;
}

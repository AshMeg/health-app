import { Link } from "@tanstack/react-router";
import { ArrowRight, Circle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { GoalCard } from "@/features/goals/components/goal-card";
import type { BloomGoal } from "@/features/goals/types";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { formatSleep } from "@/features/timeline/snapshot";
import { eventCategoryMeta } from "@/features/timeline/types";

/**
 * The calm daily home: one focus goal, a quiet snapshot, one next step.
 * Everything else stays one tap deeper on its own page.
 */

/** Most recently active goal, preferring one with something to do today. */
function pickFocus(goals: BloomGoal[]): BloomGoal | undefined {
  const lastActivity = (g: BloomGoal) => g.updates[0]?.date ?? "";
  return [...goals].sort((a, b) => {
    const step = Number(Boolean(b.nextStep)) - Number(Boolean(a.nextStep));
    return step || lastActivity(b).localeCompare(lastActivity(a));
  })[0];
}

function useFocusGoal() {
  const { goals } = useBloomContext();
  return pickFocus(goals.active);
}

export function FocusGoalWidget() {
  const goal = useFocusGoal();
  return (
    <section className="space-y-3">
      {goal ? (
        <GoalCard goal={goal} />
      ) : (
        <Card className="rounded-3xl border-transparent bg-card shadow-none">
          <CardContent className="p-7 text-sm text-muted-foreground">
            Nothing needs your attention right now.
          </CardContent>
        </Card>
      )}
      <Link to="/goals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        View all goals <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

type Signal = { id: string; label: string; value: string; to: string };

export function HealthSnapshotWidget() {
  const { today } = useBloomContext();
  const all: (Signal | null)[] = [
    today.sleepMinutes ? { id: "sleep", label: "Sleep", value: formatSleep(today.sleepMinutes) ?? "", to: "/sleep" } : null,
    today.recoveryPercent ? { id: "recovery", label: "Recovery", value: `${today.recoveryPercent}%`, to: "/recovery" } : null,
    today.caloriesKcal ? { id: "nutrition", label: "Nutrition", value: `${today.caloriesKcal.toLocaleString()} kcal`, to: "/nutrition" } : null,
    today.steps ? { id: "activity", label: "Activity", value: `${today.steps.toLocaleString()} steps`, to: "/training" } : null,
    today.weightKg ? { id: "weight", label: "Weight", value: `${today.weightKg} kg`, to: "/weight" } : null,
    today.cycleDay ? { id: "cycle", label: "Cycle", value: `Day ${today.cycleDay}`, to: "/cycle" } : null,
    today.waterL ? { id: "water", label: "Water", value: `${today.waterL} L`, to: "/nutrition" } : null,
    today.mood ? { id: "mood", label: "Mood", value: today.mood, to: "/recovery" } : null,
  ];
  const signals = all.filter((s): s is Signal => Boolean(s)).slice(0, 4);

  if (!signals.length) {
    return <p className="px-1 text-sm text-muted-foreground">Nothing recorded yet today.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {signals.map((s) => (
        <Link
          key={s.id}
          to={s.to}
          className="rounded-2xl bg-card/60 px-4 py-3 transition hover:bg-card"
        >
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="mt-0.5 truncate font-display text-base">{s.value}</p>
        </Link>
      ))}
    </div>
  );
}

export function NextStepWidget() {
  const { today } = useBloomContext();
  const goal = useFocusGoal();
  const missing = goal ? today.missingLogs[0] : undefined;
  const step = goal?.nextStep ?? (missing ? `Log today's ${eventCategoryMeta[missing].label.toLowerCase()}` : undefined);

  if (!step) {
    return <p className="px-1 text-sm text-muted-foreground">You're all caught up for today.</p>;
  }

  return (
    <Card className="rounded-3xl border-transparent bg-sage-soft/50 shadow-none">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{step}</p>
            {goal ? <p className="truncate text-xs text-muted-foreground">{goal.title}</p> : null}
          </div>
        </div>
        {goal ? (
          <Link to="/goals/$goalId" params={{ goalId: goal.id }} className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
            View goal →
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

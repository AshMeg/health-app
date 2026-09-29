import { Link } from "@tanstack/react-router";
import { ArrowRight, Circle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { goalProgress, type BloomGoal } from "@/features/goals/types";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { formatSleep } from "@/features/timeline/snapshot";
import { eventCategoryMeta } from "@/features/timeline/types";
import { say } from "@/features/voice/tone";
import { usePersonality } from "@/features/voice/use-personality";

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
  const { personality } = usePersonality();
  if (!goal) return <p className="px-1 text-sm text-muted-foreground">{say("noFocus", personality)}</p>;
  const pct = Math.round(goalProgress(goal));
  return (
    <Link
      to="/goals/$goalId"
      params={{ goalId: goal.id }}
      className="flex items-center justify-between gap-4 rounded-2xl bg-card/70 px-5 py-4 transition hover:bg-card"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{goal.title}</p>
        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-sage" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="shrink-0 text-sm text-muted-foreground">{pct}% · View goal →</span>
    </Link>
  );
}

type Signal = { id: string; label: string; value: string; to: string };

export function HealthSnapshotWidget() {
  const { today } = useBloomContext();
  const { personality } = usePersonality();
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
    return <p className="px-1 text-sm text-muted-foreground">{say("nothingToday", personality)}</p>;
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
  const { personality } = usePersonality();
  const missing = goal ? today.missingLogs[0] : undefined;
  const step = goal?.nextStep ?? (missing ? `Log today's ${eventCategoryMeta[missing].label.toLowerCase()}` : undefined);

  if (!step) {
    return <p className="px-1 text-sm text-muted-foreground">{say("allCaughtUp", personality)}</p>;
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

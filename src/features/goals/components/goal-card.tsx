import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GoalAccentDot, GoalProgressBar } from "./goal-progress-bar";
import {
  describeMeasure,
  formatGoalValue,
  goalProgress,
  goalStatusMeta,
  goalTypeMeta,
  type BloomGoal,
} from "../types";

export function GoalStatusPill({ goal }: { goal: BloomGoal }) {
  const meta = goalStatusMeta[goal.status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function GoalTypePill({ goal }: { goal: BloomGoal }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
      {goalTypeMeta[goal.type].label}
    </span>
  );
}

export function GoalCard({ goal }: { goal: BloomGoal }) {
  const progress = goalProgress(goal);

  return (
    <Card className="group relative rounded-3xl border-transparent bg-card shadow-soft transition-shadow hover:shadow-md">
      <CardContent className="space-y-6 p-7 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2.5">
              <GoalAccentDot accent={goal.accent} />
              <h3 className="truncate text-lg font-medium sm:text-xl">
                <Link
                  to="/goals/$goalId"
                  params={{ goalId: goal.id }}
                  className="outline-none after:absolute after:inset-0 focus-visible:underline"
                >
                  {goal.title}
                </Link>
              </h3>
            </div>
            <GoalTypePill goal={goal} />
          </div>
          <GoalStatusPill goal={goal} />
        </div>

        <div className="space-y-2">
          <GoalProgressBar value={progress} accent={goal.accent} label={goal.title} tall />
          <p className="text-xs text-muted-foreground">{progress}% of the way there</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5">
          {typeof goal.measure.target === "number" ? (
            <>
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-base font-medium">
                  {formatGoalValue(goal.current, goal.measure.unit)}
                </p>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-base font-medium">
                  {formatGoalValue(goal.measure.target, goal.measure.unit)}
                </p>
              </div>
            </>
          ) : (
            <div className="col-span-2 min-w-0 space-y-1">
              <p className="text-xs text-muted-foreground">How it's measured</p>
              <p className="text-base font-medium">{describeMeasure(goal)}</p>
            </div>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
          Open goal
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </CardContent>
    </Card>
  );
}

import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GoalAccentDot, GoalProgressBar } from "./goal-progress-bar";
import { trackingRegistry } from "./tracking/registry";
import { goalProgress, goalStatusMeta, goalTypeMeta, type BloomGoal } from "../types";

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

/** Placeholder nudge — AI-generated suggestions will replace these. */
export function GoalNextStep({ goal }: { goal: BloomGoal }) {
  if (!goal.nextStep || goal.completedAt) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/60 px-4 py-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-muted-foreground">Today's next step</p>
        <p className="text-sm leading-relaxed">{goal.nextStep}</p>
      </div>
    </div>
  );
}

export function GoalCard({ goal }: { goal: BloomGoal }) {
  const progress = goalProgress(goal);
  const definition = trackingRegistry[goal.tracking.method];

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
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{definition.summary(goal.tracking)}</span>
            <span>{progress}% of the way there</span>
          </div>
        </div>

        <GoalNextStep goal={goal} />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-5">
          <span className="text-xs text-muted-foreground">{definition.label}</span>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
            Open goal
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}


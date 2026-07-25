import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GoalAccentDot, GoalProgressBar } from "./goal-progress-bar";
import { trackingRegistry } from "./tracking/registry";
import {
  goalProgress,
  goalStatus,
  goalStatusMeta,
  goalTypeMeta,
  milestoneSummary,
  type BloomGoal,
} from "../types";

/** Milestone counts win on cards — they're the clearest read of where you are. */
function goalSummary(goal: BloomGoal): string {
  if (goal.milestones && goal.milestones.length) return milestoneSummary(goal.milestones);
  return trackingRegistry[goal.tracking.method].summary(goal.tracking);
}

export function GoalStatusPill({ goal }: { goal: BloomGoal }) {
  const meta = goalStatusMeta[goalStatus(goal)];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        meta.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClassName)} />
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
            <span>{goalSummary(goal)}</span>
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

/** Denser card for when someone is juggling several goals at once. */
export function GoalCardCompact({ goal }: { goal: BloomGoal }) {
  const progress = goalProgress(goal);


  return (
    <Card className="group relative rounded-3xl border-transparent bg-card shadow-soft transition-shadow hover:shadow-md">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <GoalAccentDot accent={goal.accent} />
            <h3 className="truncate text-sm font-medium">
              <Link
                to="/goals/$goalId"
                params={{ goalId: goal.id }}
                className="outline-none after:absolute after:inset-0 focus-visible:underline"
              >
                {goal.title}
              </Link>
            </h3>
          </div>
          <GoalStatusPill goal={goal} />
        </div>

        <GoalProgressBar value={progress} accent={goal.accent} label={goal.title} />

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{goalSummary(goal)}</span>
          <span className="shrink-0">{progress}%</span>
        </div>

        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {goalTypeMeta[goal.type].label}
        </span>
      </CardContent>
    </Card>
  );
}



import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoalActionsMenu } from "./goal-actions-menu";
import { GoalAccentDot, GoalProgressBar } from "./goal-progress-bar";
import { formatGoalDate } from "../format";
import { goalProgress, type BloomGoal } from "../types";

/**
 * A goal resting in "Not Right Now" — everything kept, waiting for a season
 * where it fits again.
 */
export function RestingGoalCard({
  goal,
  onResume,
}: {
  goal: BloomGoal;
  onResume: () => void;
}) {
  const progress = goalProgress(goal);

  return (
    <Card className="relative rounded-3xl border-transparent bg-muted/40 shadow-none">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <GoalAccentDot accent={goal.accent} />
            <h3 className="truncate text-sm font-medium">
              <Link
                to="/goals/$goalId"
                params={{ goalId: goal.id }}
                className="outline-none focus-visible:underline"
              >
                {goal.title}
              </Link>
            </h3>
          </div>
          <GoalActionsMenu goal={goal} />
        </div>

        <GoalProgressBar value={progress} accent={goal.accent} label={goal.title} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {progress}% so far · paused {goal.pausedAt ? formatGoalDate(goal.pausedAt) : "recently"}
          </p>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={onResume}>
            <RotateCcw className="h-3.5 w-3.5" />
            Resume goal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

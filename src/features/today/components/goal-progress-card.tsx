import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoalCard, GoalCardCompact } from "@/features/goals/components/goal-card";
import { useGoals } from "@/features/goals/hooks/use-goals";

/**
 * Shows every active goal. One or two get the full card; beyond that the
 * layout switches to compact cards that scroll sideways rather than pushing
 * the rest of Today off the screen.
 */
export function GoalsWidget() {
  const { active } = useGoals();

  if (!active.length) {
    return (
      <Card className="rounded-3xl border-transparent bg-card shadow-soft">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-base font-medium">Every garden starts with a single seed</p>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            Set your first goal and Bloom will keep it in view.
          </p>
          <Button asChild variant="secondary" className="gap-1.5">
            <Link to="/goals">
              Create a goal
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (active.length <= 2) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {active.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    );
  }

  return (
    // Negative margin lets cards run to the edge while keeping the scroll area padded.
    <div className="-mx-1 overflow-x-auto px-1 pb-2">
      <div className="flex gap-4">
        {active.map((goal) => (
          <div key={goal.id} className="w-[17rem] shrink-0 sm:w-[19rem]">
            <GoalCardCompact goal={goal} />
          </div>
        ))}
      </div>
    </div>
  );
}

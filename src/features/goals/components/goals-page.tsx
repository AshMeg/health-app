import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateGoalDialog } from "./create-goal-dialog";
import { GoalCard } from "./goal-card";
import { GoalsEmptyState } from "./goals-empty-state";
import { useGoals } from "../hooks/use-goals";

export function GoalsPage() {
  const { active, complete, addGoal } = useGoals();
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 pb-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
            Your Goals
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Small actions grow into lasting change.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Create Goal
        </Button>
      </header>

      {active.length === 0 && complete.length === 0 ? (
        <GoalsEmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="space-y-10">
          <section className="space-y-5">
            <h2 className="text-sm text-muted-foreground">Active goals</h2>
            {active.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {active.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing growing right now — start something new when you're ready.
              </p>
            )}
          </section>

          {complete.length ? (
            <section className="space-y-5">
              <h2 className="text-sm text-muted-foreground">Complete</h2>
              <div className="grid gap-5 lg:grid-cols-2">
                {complete.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <CreateGoalDialog open={creating} onOpenChange={setCreating} onCreate={addGoal} />
    </div>
  );
}

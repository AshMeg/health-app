import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useHabits } from "../model";
import { HabitCard } from "./habit-card";
import { HabitDialog } from "./habit-dialog";

/** On a goal: the habits that help it along. */
export function LinkedHabits({ goalId }: { goalId: string }) {
  const { active } = useHabits();
  const [open, setOpen] = useState(false);
  const linked = active.filter((h) => h.goalId === goalId);
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground/80">Habits that support this goal</h2>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add habit
        </Button>
      </div>
      {linked.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {linked.map((h) => (
            <HabitCard key={h.id} habit={h} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No habits linked yet. Small repeated steps often help a goal grow.</p>
      )}
      <HabitDialog open={open} onOpenChange={setOpen} defaultGoalId={goalId} />
    </section>
  );
}

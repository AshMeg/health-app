import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useHabits } from "../model";
import { HabitCard } from "./habit-card";
import { HabitDialog } from "./habit-dialog";

export function HabitsSection() {
  const { active, archived } = useHabits();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add habit
        </Button>
      </div>

      {active.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {active.map((h) => (
            <HabitCard key={h.id} habit={h} />
          ))}
        </div>
      ) : (
        <Card className="rounded-[2rem] border-transparent bg-card shadow-soft">
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-5 p-10 text-center">
            <span className="text-3xl" aria-hidden>🐝</span>
            <div className="max-w-sm space-y-2">
              <p className="font-display text-xl font-medium sm:text-2xl">Small things become big changes.</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Build a habit that supports the life you're creating.
              </p>
            </div>
            <Button onClick={() => setOpen(true)}>Add your first habit</Button>
          </CardContent>
        </Card>
      )}

      {archived.length ? (
        <section className="space-y-3">
          <h2 className="text-sm text-muted-foreground">Archived — history kept</h2>
          <div className="flex flex-wrap gap-2">
            {archived.map((h) => (
              <Link
                key={h.id}
                to="/goals/habits/$habitId"
                params={{ habitId: h.id }}
                className="rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted/70"
              >
                {h.icon} {h.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <HabitDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

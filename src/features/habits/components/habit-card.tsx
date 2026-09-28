import { Link } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";

import { consistency, consistencyText, frequencyText, isBuzzing, targetText, type Habit } from "../model";
import { HabitCheckIn } from "./habit-check-in";

export function HabitCard({ habit }: { habit: Habit }) {
  const { events } = useBloomContext();
  const c = consistency(habit, events);
  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-soft">
      <CardContent className="space-y-4 p-6">
        <Link to="/goals/habits/$habitId" params={{ habitId: habit.id }} className="flex items-start gap-3 hover:opacity-80">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-lg" aria-hidden>
            {habit.icon}
          </span>
          <span className="min-w-0 space-y-0.5">
            <span className="block font-medium">{habit.name}</span>
            <span className="block text-xs text-muted-foreground">
              {frequencyText(habit.frequency)} · {targetText(habit)}
            </span>
          </span>
          <span className="ml-auto text-xs text-muted-foreground">{isBuzzing(c) ? "🐝" : "💤"}</span>
        </Link>
        <p className="text-sm text-muted-foreground">{consistencyText(c)}</p>
        {habit.archivedAt ? null : <HabitCheckIn habit={habit} />}
      </CardContent>
    </Card>
  );
}

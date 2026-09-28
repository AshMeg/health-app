import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localDate } from "@/features/measurements/model";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent } from "@/features/timeline/store";

import { checkInsFor, dailyTotals, methodMeta, type Habit } from "../model";

/** Log today's check-in. Yes/No toggles; amounts add up across the day. */
export function HabitCheckIn({ habit }: { habit: Habit }) {
  const { events, record } = useBloomContext();
  const today = localDate();
  const done = dailyTotals(events, habit.id).get(today);
  const [amount, setAmount] = useState("");
  const unit = habit.unit ?? methodMeta[habit.method].unit ?? "";

  const log = (value: number) =>
    record({
      category: "habit",
      habitId: habit.id,
      title: habit.name,
      detail: habit.method === "yes-no" ? "Done" : `${value} ${unit}`.trim(),
      value,
      unit: habit.method === "yes-no" ? undefined : unit,
      goalId: habit.goalId,
      origin: "habit",
    });

  if (habit.method === "yes-no") {
    const todays = checkInsFor(events, habit.id).filter((e) => localDate(e.at) === today);
    return done ? (
      <Button size="sm" variant="secondary" className="rounded-full" onClick={() => todays.forEach((e) => removeEvent(e.id))}>
        <Check className="h-3.5 w-3.5" /> Done today
      </Button>
    ) : (
      <Button size="sm" className="rounded-full" onClick={() => log(1)}>
        Mark done
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {done ?? 0}/{habit.target} {unit} today
      </span>
      <Input
        type="number"
        min={0}
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-8 w-20 rounded-full"
        aria-label={`Amount for ${habit.name}`}
        placeholder={unit}
      />
      <Button
        size="sm"
        className="h-8 rounded-full"
        disabled={!(Number(amount) > 0)}
        onClick={() => {
          log(Number(amount));
          setAmount("");
        }}
      >
        Log
      </Button>
    </div>
  );
}

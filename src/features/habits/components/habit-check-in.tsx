import { useState } from "react";
import { Check, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { localDate } from "@/features/measurements/model";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent, updateEvent } from "@/features/timeline/store";

import { checkInsFor, methodMeta, reachedTarget, type Habit } from "../model";

/**
 * "Mark as complete" is the one action every habit has. Measured habits open
 * a small "How much did you do?" box; the actual amount is kept, and falling
 * short of the target still counts as completed.
 */
export function HabitCheckIn({ habit }: { habit: Habit }) {
  const { events, record } = useBloomContext();
  const today = localDate();
  const todays = checkInsFor(events, habit.id).filter((e) => localDate(e.at) === today);
  const total = todays.reduce((a, e) => a + (e.value ?? 0), 0);
  const unit = habit.unit || methodMeta[habit.method]?.unit || "";
  const measured = habit.method !== "completion";
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const detailFor = (v: number) => (measured ? `${v} ${unit}`.trim() : "Completed");
  const save = (value: number) => {
    const [first, ...rest] = todays;
    rest.forEach((e) => removeEvent(e.id));
    if (first) updateEvent(first.id, { value, detail: detailFor(value), unit: measured ? unit : undefined });
    else
      record({
        category: "habit",
        habitId: habit.id,
        title: habit.name,
        detail: detailFor(value),
        value,
        unit: measured ? unit : undefined,
        goalId: habit.goalId,
        origin: "habit",
      });
  };

  if (!measured) {
    return todays.length ? (
      <Button size="sm" variant="secondary" className="rounded-full" onClick={() => todays.forEach((e) => removeEvent(e.id))}>
        <Check className="h-3.5 w-3.5" /> Completed today
      </Button>
    ) : (
      <Button size="sm" className="rounded-full" onClick={() => save(1)}>
        Mark as complete
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {todays.length ? (
        <span className="text-xs text-muted-foreground">
          <Check className="mr-1 inline h-3.5 w-3.5 text-sage" />
          Completed · {total} {unit}
          {habit.target ? ` of ${habit.target}` : ""}
          {reachedTarget(habit, total) ? " · target reached" : ""}
        </span>
      ) : null}
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setAmount(todays.length ? String(total) : habit.target ? String(habit.target) : "");
        }}
      >
        <PopoverTrigger asChild>
          <Button size="sm" variant={todays.length ? "ghost" : "default"} className="rounded-full">
            {todays.length ? (
              <>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </>
            ) : (
              "Mark as complete"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3 rounded-2xl">
          <p className="text-sm font-medium">How much did you do?</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              step="any"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 w-24 rounded-full"
              aria-label={`Amount for ${habit.name}`}
            />
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          <div className="flex justify-between gap-2">
            {todays.length ? (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  todays.forEach((e) => removeEvent(e.id));
                  setOpen(false);
                }}
              >
                Not today
              </Button>
            ) : (
              <span />
            )}
            <Button
              size="sm"
              className="rounded-full"
              disabled={!(Number(amount) > 0)}
              onClick={() => {
                save(Number(amount));
                setOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

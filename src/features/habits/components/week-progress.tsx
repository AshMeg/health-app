import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { cn } from "@/lib/utils";

import { thisWeek, type Habit } from "../model";

/** "This week: 2 of 3 completed" with the days it happened. A 4th completion still counts. */
export function WeekProgress({ habit }: { habit: Habit }) {
  const { events } = useBloomContext();
  if (habit.frequency.kind !== "weekly") return null;
  const { days, count } = thisWeek(habit, events);
  const times = habit.frequency.times;
  return (
    <div className="space-y-2">
      <p className="text-sm">
        This week: {count} of {times} completed{count > times ? " — more than planned" : ""}
      </p>
      <div className="flex gap-1.5">
        {days.map((d) => (
          <span
            key={d.date}
            title={d.date}
            className={cn(
              "flex h-7 w-9 items-center justify-center rounded-full text-[11px]",
              d.done ? "bg-sage/70 text-foreground" : d.future ? "bg-muted/40 text-muted-foreground/60" : "bg-muted text-muted-foreground",
            )}
          >
            {d.done ? "✓ " : ""}
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

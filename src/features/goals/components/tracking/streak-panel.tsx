import { useState } from "react";
import { Flame } from "lucide-react";

import { EventDateField, validPastDate } from "@/components/shared/event-date-field";
import { formatDay, isFuture, shiftDate, todayLocal } from "@/lib/event-date";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BloomAccent } from "@/features/today/types";
import type { StreakTracking } from "../../types";

const accentSoft: Record<BloomAccent, string> = {
  sage: "bg-sage-soft text-sage",
  lavender: "bg-lavender-soft text-lavender",
  blush: "bg-blush-soft text-blush",
  sky: "bg-sky-soft text-sky",
  stone: "bg-stone-soft text-stone",
};

const accentDot: Record<BloomAccent, string> = {
  sage: "bg-sage",
  lavender: "bg-lavender",
  blush: "bg-blush",
  sky: "bg-sky",
  stone: "bg-stone",
};

function lastDays(count: number) {
  const today = todayLocal();
  return Array.from({ length: count }, (_, i) => shiftDate(today, i - count + 1));
}

/** Streaks recomputed from the dates themselves, so past days count where they happened. */
function streaks(history: string[]) {
  const set = new Set(history);
  let longest = 0;
  let run = 0;
  for (const d of [...set].sort()) {
    run = set.has(shiftDate(d, -1)) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let cursor = set.has(todayLocal()) ? todayLocal() : shiftDate(todayLocal(), -1);
  while (set.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }
  return { current, longest };
}

/** Current and longest streak, with a fortnight of dots as a calendar preview. */
export function StreakPanel({
  tracking,
  accent = "sage",
  onChange,
}: {
  tracking: StreakTracking;
  accent?: BloomAccent;
  onChange: (next: StreakTracking) => void;
}) {
  const today = todayLocal();
  const doneToday = tracking.history.includes(today);
  const days = lastDays(14);
  const [other, setOther] = useState(shiftDate(today, -1));

  const toggle = (day: string) => {
    if (isFuture(day)) return;
    const history = tracking.history.includes(day)
      ? tracking.history.filter((d) => d !== day)
      : [...tracking.history, day].sort();
    const s = streaks(history);
    // Keep an older longest streak recorded before history was kept by date.
    onChange({ ...tracking, history, current: s.current, longest: s.longest });
  };
  const markToday = () => !doneToday && toggle(today);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cn("space-y-1 rounded-2xl px-5 py-4", accentSoft[accent])}>
          <p className="flex items-center gap-1.5 text-xs">
            <Flame className="h-3.5 w-3.5" />
            Current streak
          </p>
          <p className="font-display text-3xl font-medium text-foreground">
            {tracking.current}
            <span className="ml-1.5 text-base text-muted-foreground">days</span>
          </p>
        </div>
        <div className="space-y-1 rounded-2xl bg-muted/60 px-5 py-4">
          <p className="text-xs text-muted-foreground">Longest streak</p>
          <p className="font-display text-3xl font-medium">
            {tracking.longest}
            <span className="ml-1.5 text-base text-muted-foreground">days</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Last two weeks · {tracking.cadence}</p>
        <div className="flex flex-wrap gap-1.5">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              title={`${formatDay(day)} — ${tracking.history.includes(day) ? "done (tap to undo)" : "tap to mark done"}`}
              aria-label={`${formatDay(day)}: ${tracking.history.includes(day) ? "done" : "not marked"}`}
              className={cn(
                "h-6 w-6 rounded-lg transition-transform hover:scale-110",
                tracking.history.includes(day) ? accentDot[accent] : "bg-muted",
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Tap a day to mark or undo it.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Button onClick={markToday} disabled={doneToday} variant="secondary">
          {doneToday ? "Done for today" : "Mark today complete"}
        </Button>
        <div className="flex items-end gap-2">
          <div className="w-40">
            <EventDateField id="streak-date" date={other} onDateChange={setOther} label="Or an earlier day" />
          </div>
          <Button variant="ghost" disabled={!validPastDate(other) || tracking.history.includes(other)} onClick={() => toggle(other)}>
            Mark done
          </Button>
        </div>
      </div>
    </div>
  );
}

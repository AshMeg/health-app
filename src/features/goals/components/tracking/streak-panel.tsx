import { Flame } from "lucide-react";

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
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
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
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = tracking.history.includes(today);
  const days = lastDays(14);

  const markToday = () => {
    if (doneToday) return;
    const current = tracking.current + 1;
    onChange({
      ...tracking,
      current,
      longest: Math.max(tracking.longest, current),
      history: [...tracking.history, today],
    });
  };

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
        <div className="flex flex-wrap gap-1.5" aria-hidden>
          {days.map((day) => (
            <span
              key={day}
              className={cn(
                "h-6 w-6 rounded-lg",
                tracking.history.includes(day) ? accentDot[accent] : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      <Button onClick={markToday} disabled={doneToday} variant="secondary">
        {doneToday ? "Done for today" : "Mark today complete"}
      </Button>
    </div>
  );
}

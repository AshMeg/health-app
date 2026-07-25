import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BloomAccent } from "@/features/today/types";
import { GoalProgressBar } from "../goal-progress-bar";
import type { RepetitionTracking } from "../../types";

/** "12 / 20 completed" plus a progress bar, for goals done many times over. */
export function RepetitionPanel({
  tracking,
  accent = "sage",
  onChange,
}: {
  tracking: RepetitionTracking;
  accent?: BloomAccent;
  onChange: (next: RepetitionTracking) => void;
}) {
  const pct = tracking.target ? Math.min(100, (tracking.completed / tracking.target) * 100) : 0;

  const log = () => {
    if (tracking.completed >= tracking.target) return;
    const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" });
    onChange({
      ...tracking,
      completed: tracking.completed + 1,
      logs: [{ id: `r${Date.now().toString(36)}`, date }, ...tracking.logs].slice(0, 20),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="font-display text-3xl font-medium">
          {tracking.completed}
          <span className="text-muted-foreground"> / {tracking.target}</span>
          <span className="ml-2 text-base text-muted-foreground">completed</span>
        </p>
        <Button onClick={log} variant="secondary" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Log one
        </Button>
      </div>

      <GoalProgressBar value={pct} accent={accent} label="Repetitions completed" tall />

      {tracking.logs.length ? (
        <div className="flex flex-wrap gap-2">
          {tracking.logs.slice(0, 8).map((entry) => (
            <span
              key={entry.id}
              className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
            >
              {entry.date}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing logged yet — each time you do it, tap “Log one”.
        </p>
      )}
    </div>
  );
}

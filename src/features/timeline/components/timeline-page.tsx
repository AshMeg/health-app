import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useBloomContext } from "../hooks/use-bloom-context";
import { formatSleep } from "../snapshot";
import { eventCategoryMeta, type EventCategory } from "../types";
import { QuickAddBar } from "@/features/today/components/quick-add-bar";
import { TimelineFeed } from "./timeline-feed";

const filters: (EventCategory | "all")[] = [
  "all",
  "weight",
  "water",
  "food",
  "workout",
  "sleep",
  "recovery",
  "cycle",
  "mood",
  "journal",
  "medication",
  "measurement",
  "goal",
  "life-event",
];

/** Bloom's source of truth: everything recorded, in order, from every feature. */
export function TimelinePage() {
  const { events, today } = useBloomContext();
  const [filter, setFilter] = useState<EventCategory | "all">("all");

  const shown = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.category === filter)),
    [events, filter],
  );

  const snapshotLines = [
    today.weightKg ? `Weight ${today.weightKg} kg` : null,
    today.cycleDay ? `Cycle day ${today.cycleDay}` : null,
    today.sleepMinutes ? `Sleep ${formatSleep(today.sleepMinutes)}` : null,
    today.recoveryPercent ? `Recovery ${today.recoveryPercent}%` : null,
    today.proteinG ? `Protein ${today.proteinG} g` : null,
    today.caloriesKcal ? `Calories ${today.caloriesKcal.toLocaleString()}` : null,
    today.steps ? `Steps ${today.steps.toLocaleString()}` : null,
    today.waterL ? `Water ${today.waterL} L` : null,
    today.mood ? `Mood ${today.mood}` : null,
    today.workout ? `Workout ${today.workout}` : null,
    today.goalsCompleted ? `${today.goalsCompleted} goal(s) completed` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-20">
      <div className="space-y-2">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
          Timeline
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Everything recorded in Bloom, in one place. Logs, syncs and goal moments all land here.
        </p>
      </div>

      <QuickAddBar />

      <Card className="rounded-3xl border-transparent bg-card shadow-none">
        <CardContent className="space-y-3 px-7 py-6">
          <p className="text-sm font-medium">Today&apos;s snapshot</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {snapshotLines.length ? snapshotLines.join(" · ") : "Nothing recorded yet today."}
          </p>
          {today.missingLogs.length ? (
            <p className="text-xs text-muted-foreground">
              Still to log: {today.missingLogs.map((c) => eventCategoryMeta[c].label).join(", ")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button
              key={f}
              size="sm"
              variant="ghost"
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-full font-normal",
                filter === f ? "bg-sage-soft text-sage" : "text-muted-foreground",
              )}
            >
              {f === "all" ? "Everything" : eventCategoryMeta[f].label}
            </Button>
          ))}
        </div>
      </div>

      <TimelineFeed events={shown} empty="Nothing in this part of Bloom yet." />
    </div>
  );
}

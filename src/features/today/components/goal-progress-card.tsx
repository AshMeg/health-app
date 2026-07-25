import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BloomAccent, Goal } from "../types";

const accentBar: Record<BloomAccent, string> = {
  sage: "bg-sage",
  lavender: "bg-lavender",
  blush: "bg-blush",
  sky: "bg-sky",
  stone: "bg-stone",
};

const accentTrack: Record<BloomAccent, string> = {
  sage: "bg-sage-soft",
  lavender: "bg-lavender-soft",
  blush: "bg-blush-soft",
  sky: "bg-sky-soft",
  stone: "bg-stone-soft",
};

const accentDot: Record<BloomAccent, string> = {
  sage: "bg-sage",
  lavender: "bg-lavender",
  blush: "bg-blush",
  sky: "bg-sky",
  stone: "bg-stone",
};

function GoalBar({ goal, tall }: { goal: Goal; tall?: boolean }) {
  const value = Math.min(100, Math.max(0, goal.progress));
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "w-full overflow-hidden rounded-full",
          accentTrack[goal.accent],
          tall ? "h-2.5" : "h-2",
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} progress`}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", accentBar[goal.accent])}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{value}% of the way there</p>
    </div>
  );
}

export function PrimaryGoalCard({ goal }: { goal: Goal }) {
  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-soft">
      <CardContent className="space-y-6 p-7 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", accentDot[goal.accent])} />
              <h3 className="truncate text-lg font-medium sm:text-xl">{goal.name}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{goal.note}</p>
          </div>
        </div>

        <GoalBar goal={goal} tall />

        <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">{goal.currentLabel}</p>
            <p className="text-base font-medium">{goal.currentValue}</p>
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">{goal.targetLabel}</p>
            <p className="text-base font-medium">{goal.targetValue}</p>
          </div>
        </div>

        {goal.estimate ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{goal.estimate}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SupportingGoalRow({ goal }: { goal: Goal }) {
  return (
    <div className="space-y-3 py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accentDot[goal.accent])} />
          <p className="truncate text-sm font-medium">{goal.name}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {goal.currentValue} <span className="opacity-60">of</span> {goal.targetValue}
        </p>
      </div>
      <GoalBar goal={goal} />
    </div>
  );
}

export function GoalsWidget({ goals }: { goals: Goal[] }) {
  const primary = goals.filter((g) => g.emphasis === "primary");
  const supporting = goals.filter((g) => g.emphasis === "supporting");

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {primary.map((goal) => (
          <PrimaryGoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      {supporting.length ? (
        <Card className="rounded-3xl border-transparent bg-card/70 shadow-none">
          <CardContent className="divide-y divide-border/50 px-7 py-6 sm:px-8">
            {supporting.map((goal) => (
              <SupportingGoalRow key={goal.id} goal={goal} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

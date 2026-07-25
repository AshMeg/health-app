import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GoalCard, TrafficLight } from "../types";

const dotStyles: Record<TrafficLight, string> = {
  good: "bg-success shadow-[0_0_0_4px_color-mix(in_oklab,var(--success)_18%,transparent)]",
  watch: "bg-caution shadow-[0_0_0_4px_color-mix(in_oklab,var(--caution)_18%,transparent)]",
  off: "bg-destructive shadow-[0_0_0_4px_color-mix(in_oklab,var(--destructive)_18%,transparent)]",
};

export function GoalProgressCard({ goal }: { goal: GoalCard }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none transition-colors hover:bg-accent/30">
      <CardContent className="flex items-start gap-3 p-5">
        <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", dotStyles[goal.status])} />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium tracking-tight">{goal.name}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{goal.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalProgressGrid({ goals }: { goals: GoalCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => (
        <GoalProgressCard key={goal.id} goal={goal} />
      ))}
    </div>
  );
}

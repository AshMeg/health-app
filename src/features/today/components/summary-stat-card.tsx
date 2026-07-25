import { Card, CardContent } from "@/components/ui/card";
import type { SummaryStat } from "../types";

export function SummaryStatCard({ stat }: { stat: SummaryStat }) {
  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-none">
      <CardContent className="space-y-1.5 p-6">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <p className="font-display text-xl font-medium">
          {stat.value}
          {stat.unit ? (
            <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.unit}</span>
          ) : null}
        </p>
        {stat.detail ? <p className="text-xs text-muted-foreground">{stat.detail}</p> : null}
      </CardContent>
    </Card>
  );
}

export function SummaryGrid({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <SummaryStatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}

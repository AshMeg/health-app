import { Card, CardContent } from "@/components/ui/card";
import type { SummaryStat } from "../types";

export function SummaryStatCard({ stat }: { stat: SummaryStat }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs text-muted-foreground">{stat.label}</p>
        <p className="text-lg font-semibold tracking-tight">
          {stat.value}
          {stat.unit ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">{stat.unit}</span>
          ) : null}
        </p>
        {stat.detail ? <p className="text-xs text-muted-foreground">{stat.detail}</p> : null}
      </CardContent>
    </Card>
  );
}

export function SummaryGrid({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <SummaryStatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SummaryStat } from "../types";

export function SummaryStatCard({ stat }: { stat: SummaryStat }) {
  const body = (
    <CardContent className="space-y-1.5 p-6">
      <p className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        {stat.label}
        {stat.to ? (
          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </p>
      <p className="font-display text-xl font-medium">
        {stat.value}
        {stat.unit ? (
          <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.unit}</span>
        ) : null}
      </p>
      {stat.detail ? <p className="text-xs text-muted-foreground">{stat.detail}</p> : null}
    </CardContent>
  );

  const card = (
    <Card
      className={cn(
        "rounded-3xl border-transparent bg-card shadow-none",
        stat.to && "group relative transition-shadow hover:shadow-soft",
      )}
    >
      {body}
    </Card>
  );

  // Every dashboard number opens the page that explains it.
  if (!stat.to) return card;
  return (
    <Link to={stat.to} aria-label={`Open ${stat.label}`} className="block">
      {card}
    </Link>
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

import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { goalMetricPage } from "@/features/metrics/config";
import { TrendPanel } from "@/features/trends/components/trend-panel";
import { goalMetricTrend, goalTargetInTrendUnit, trendDefinitions } from "@/features/trends/series";
import { goalProgress, type BloomGoal } from "../types";

/**
 * Only measurable (automatic) goals get a graph. Checklists, steps, streaks,
 * repetitions and reflections already show progress in their own panels —
 * not every goal needs a chart.
 */
export function GoalTrend({ goal }: { goal: BloomGoal }) {
  const t = goal.tracking;
  if (t.method !== "automatic") return null;
  const trend = goalMetricTrend[t.metric];
  if (!trend) return null;
  const page = goalMetricPage[t.metric];
  const def = trendDefinitions[trend];
  const target = goalTargetInTrendUnit(trend, t.target, t.unit);
  const fmt = (v: number) => `${v.toLocaleString()} ${t.unit}`.trim();

  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-soft">
      <CardContent className="space-y-6 p-7 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-medium">{def.label} over time</h2>
          {page ? (
            <Link
              to={`/${page}` as "/weight"}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Open {page.charAt(0).toUpperCase() + page.slice(1)} →
            </Link>
          ) : null}
        </div>
        <dl className="grid grid-cols-3 gap-3">
          {[
            ["Current", fmt(t.current)],
            ["Target", fmt(t.target)],
            ["Progress", `${goalProgress(goal)}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-muted/50 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="font-display text-lg font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <TrendPanel bare trends={[trend]} target={target} targetLabel={`Goal ${fmt(t.target)}`} />
      </CardContent>
    </Card>
  );
}

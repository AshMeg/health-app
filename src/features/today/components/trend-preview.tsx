import { useMemo } from "react";
import { Link } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { TrendSparkline } from "@/features/trends/components/trend-panel";
import { buildSeries, pointsInRange, trendDefinitions, type TrendId } from "@/features/trends/series";

/** Small Dashboard preview of a trend — the full story lives on the metric page. */
export function TrendPreview({ id, to }: { id: TrendId; to: string }) {
  const { events } = useBloomContext();
  const def = trendDefinitions[id];
  const all = useMemo(() => buildSeries(events, id), [events, id]);
  const month = pointsInRange(all, "30d");
  const latest = all.at(-1);
  const change = month.length >= 2 ? month.at(-1)!.value - month[0].value : undefined;

  return (
    <Link to={to} className="block">
      <Card className="rounded-3xl border-transparent bg-card shadow-none transition hover:shadow-soft">
        <CardContent className="space-y-3 p-6">
          {latest ? (
            <>
              <TrendSparkline id={id} />
              <p className="font-display text-2xl font-medium">{def.format(latest.value)}</p>
              <p className="text-sm text-muted-foreground">
                {change === undefined
                  ? "Log a few more days to see how this is changing."
                  : Math.abs(change) < 0.05
                    ? "Steady over the last 30 days"
                    : `${change < 0 ? "↓" : "↑"} ${(def.formatDelta ?? def.format)(Math.abs(change))} over the last 30 days`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No {def.noun} logged yet.</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

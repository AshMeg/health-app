import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { BloomAccent } from "@/features/today/types";
import type { AutomaticTracking } from "../../types";
import { formatGoalValue } from "../../types";

const accentStroke: Record<BloomAccent, string> = {
  sage: "stroke-sage",
  lavender: "stroke-lavender",
  blush: "stroke-blush",
  sky: "stroke-sky",
  stone: "stroke-stone",
};

const accentFill: Record<BloomAccent, string> = {
  sage: "fill-sage/10",
  lavender: "fill-lavender/10",
  blush: "fill-blush/10",
  sky: "fill-sky/10",
  stone: "fill-stone/10",
};

/** Small trend graph for goals Bloom can calculate from logged data. */
export function AutomaticPanel({
  tracking,
  accent = "sage",
}: {
  tracking: AutomaticTracking;
  accent?: BloomAccent;
}) {
  const points = tracking.history ?? [];

  const path = useMemo(() => {
    if (points.length < 2) return null;
    const values = points.map((p) => p.value);
    const min = Math.min(...values, tracking.target);
    const max = Math.max(...values, tracking.target);
    const span = max - min || 1;
    const step = 100 / (points.length - 1);
    const coords = points.map((p, i) => {
      const x = i * step;
      const y = 40 - ((p.value - min) / span) * 34 - 3;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return {
      line: `M ${coords.join(" L ")}`,
      area: `M 0,40 L ${coords.join(" L ")} L 100,40 Z`,
    };
  }, [points, tracking.target]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Reading label="Now" value={formatGoalValue(tracking.current, tracking.unit)} />
        <Reading label="Started at" value={formatGoalValue(tracking.start, tracking.unit)} />
        <Reading label="Target" value={formatGoalValue(tracking.target, tracking.unit)} />
      </div>

      {path ? (
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="h-28 w-full"
          role="img"
          aria-label="Progress trend"
        >
          <path d={path.area} className={cn("stroke-none", accentFill[accent])} />
          <path
            d={path.line}
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={accentStroke[accent]}
          />
        </svg>
      ) : (
        <p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
          Once you've logged a few readings, your trend will appear here.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Updates on its own as you log data — nothing to tick off.
      </p>
    </div>
  );
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { BloomAccent } from "@/features/today/types";

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

export function GoalProgressBar({
  value,
  accent = "sage",
  label,
  tall,
}: {
  value: number;
  accent?: BloomAccent;
  label: string;
  tall?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full", accentTrack[accent], tall ? "h-2.5" : "h-2")}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} progress`}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", accentBar[accent])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function GoalAccentDot({ accent }: { accent: BloomAccent }) {
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", accentBar[accent])} />;
}

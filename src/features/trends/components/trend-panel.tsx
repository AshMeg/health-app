import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";

import {
  availableRanges,
  buildSeries,
  MIN_POINTS,
  pointsInRange,
  ranges,
  summarise,
  trendDefinitions,
  type RangeId,
  type TrendId,
  type TrendPoint,
} from "../series";

const shortDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * The one trend view used across Bloom. Give it one or more trend ids (shown
 * as tabs when there are several) and optionally a target line.
 */
export function TrendPanel({
  trends,
  target,
  targetLabel,
  title,
  bare,
}: {
  trends: TrendId[];
  /** Target in the trend's own unit, applied to the first trend. */
  target?: number;
  targetLabel?: string;
  title?: string;
  /** Render without its own card (when already inside one). */
  bare?: boolean;
}) {
  const { events } = useBloomContext();
  const [active, setActive] = useState<TrendId>(trends[0]);
  const def = trendDefinitions[active];
  const [range, setRange] = useState<RangeId>(def.defaultRange);

  const all = useMemo(() => buildSeries(events, active), [events, active]);
  const offered = availableRanges(all);
  const effectiveRange = offered.has(range) ? range : "30d";
  const pts = pointsInRange(all, effectiveRange);
  const t = active === trends[0] ? target : undefined;
  const lines = summarise(active, all, effectiveRange, t);

  const body = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title ? <h2 className="text-base font-medium">{title}</h2> : <span />}
        <div className="flex flex-wrap gap-1 rounded-full bg-muted/60 p-1">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={!offered.has(r.id)}
              onClick={() => setRange(r.id)}
              title={offered.has(r.id) ? undefined : "Not enough history yet"}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition disabled:opacity-40",
                effectiveRange === r.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {trends.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {trends.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition",
                id === active ? "bg-sage-soft text-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {trendDefinitions[id].label}
            </button>
          ))}
        </div>
      ) : null}

      {pts.length === 0 ? (
        <EmptyTrend text={all.length ? `No ${def.noun} logged in this period.` : `No ${def.noun} logged yet — your trend will appear here once you do.`} />
      ) : pts.length < MIN_POINTS ? (
        <>
          <Chart points={pts} id={active} target={t} targetLabel={targetLabel} />
          <p className="text-sm text-muted-foreground">Log a few more days and your trend will appear here.</p>
        </>
      ) : (
        <>
          <Chart points={pts} id={active} target={t} targetLabel={targetLabel} />
          <div className="space-y-1">
            {lines.map((l) => (
              <p key={l} className="text-sm leading-relaxed text-foreground/80">{l}</p>
            ))}
          </div>
        </>
      )}
      {!offered.has("3m") && all.length ? (
        <p className="text-xs text-muted-foreground">Longer ranges open up as your history grows.</p>
      ) : null}
    </div>
  );

  if (bare) return body;
  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-none">
      <CardContent className="p-6 sm:p-7">{body}</CardContent>
    </Card>
  );
}

function EmptyTrend({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl bg-muted/40 px-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function Chart({
  points,
  id,
  target,
  targetLabel,
}: {
  points: TrendPoint[];
  id: TrendId;
  target?: number;
  targetLabel?: string;
}) {
  const def = trendDefinitions[id];
  const color = `var(--${def.accent})`;
  const values = points.map((p) => p.value).concat(target ?? []);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.15 || Math.max(1, max * 0.05);
  const domain: [number, number] =
    def.visual === "bar" ? [0, Math.ceil(max + pad)] : [Math.floor(min - pad), Math.ceil(max + pad)];

  const common = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
      <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" minTickGap={24} />
      <YAxis domain={domain} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={44} tickFormatter={(v: number) => (id === "sleep" ? `${Math.round(v / 60)}h` : v.toLocaleString())} />
      <Tooltip
        cursor={{ fill: "var(--muted)", opacity: 0.4 }}
        content={({ active, payload }) => {
          const p = active && payload?.[0]?.payload as TrendPoint | undefined;
          if (!p) return null;
          return (
            <div className="rounded-2xl bg-card px-3 py-2 text-xs shadow-soft">
              <p className="text-muted-foreground">{new Date(`${p.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</p>
              <p className="font-medium">{def.format(p.value)}</p>
              {p.synced ? <p className="text-muted-foreground">Synced</p> : null}
            </div>
          );
        }}
      />
      {target !== undefined ? (
        <ReferenceLine
          y={target}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          strokeOpacity={0.6}
          label={{ value: targetLabel ?? `Target ${def.format(target)}`, position: "insideTopRight", fontSize: 11, fill: "var(--muted-foreground)" }}
        />
      ) : null}
    </>
  );

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {def.visual === "bar" ? (
          <BarChart data={points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            {common}
            <Bar dataKey="value" fill={color} radius={[6, 6, 2, 2]} maxBarSize={22} />
          </BarChart>
        ) : (
          <LineChart data={points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            {common}
            <Line
              type={def.visual === "step" ? "stepAfter" : "monotone"}
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** A tiny sparkline for Dashboard previews. */
export function TrendSparkline({ id, days = 30 }: { id: TrendId; days?: number }) {
  const { events } = useBloomContext();
  const pts = useMemo(() => buildSeries(events, id), [events, id]).slice(-days);
  const def = trendDefinitions[id];
  if (pts.length < MIN_POINTS) return null;
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line type="monotone" dataKey="value" stroke={`var(--${def.accent})`} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cycleDayOn, periodsOf } from "@/features/cycle/model";
import { isMemory } from "@/features/garden/model";
import { moodEmoji } from "@/features/journal/moods";
import { localDate } from "@/features/measurements/model";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { buildDailySnapshot, formatSleep } from "@/features/timeline/snapshot";
import { isJournalEntry, type BloomEvent, type DailySnapshot } from "@/features/timeline/types";
import { cn } from "@/lib/utils";

/**
 * "Your picture" — every tracked area on one shared time axis. Each metric
 * keeps its own visual form; nothing is interpolated and empty metrics stay out.
 */

type Day = {
  date: string;
  snap: DailySnapshot;
  cycleDay?: number;
  onPeriod: boolean;
  habits: number;
  goals: BloomEvent[];
  journal: BloomEvent[];
  measures: number;
};

type Kind = "line" | "bars" | "mood" | "band" | "marker";

type MetricDef = {
  id: string;
  label: string;
  to: string;
  kind: Kind;
  tone: string;
  value: (d: Day) => number | string | undefined;
  format: (v: number | string) => string;
};

const n0 = (v?: number) => (v ? v : undefined);

const METRICS: MetricDef[] = [
  { id: "mood", label: "Mood", to: "/journal", kind: "mood", tone: "bg-lavender-soft", value: (d) => d.snap.mood, format: (v) => `${moodEmoji(String(v))} ${v}` },
  { id: "weight", label: "Weight", to: "/weight", kind: "line", tone: "bg-sage", value: (d) => d.snap.weightKg, format: (v) => `${Number(v).toFixed(1)} kg` },
  { id: "sleep", label: "Sleep", to: "/sleep", kind: "bars", tone: "bg-sky", value: (d) => n0(d.snap.sleepMinutes), format: (v) => formatSleep(Math.round(Number(v))) ?? "" },
  { id: "cycle", label: "Cycle", to: "/cycle", kind: "band", tone: "bg-blush", value: (d) => d.cycleDay, format: (v) => `Day ${Math.round(Number(v))}` },
  { id: "training", label: "Training", to: "/training", kind: "bars", tone: "bg-sage", value: (d) => n0(d.snap.workoutMinutes) ?? (d.snap.workout ? 1 : undefined), format: (v) => (Number(v) > 1 ? `${Math.round(Number(v))} min` : "Workout") },
  { id: "recovery", label: "Recovery", to: "/recovery", kind: "bars", tone: "bg-lavender", value: (d) => n0(d.snap.recoveryPercent), format: (v) => `${Math.round(Number(v))}%` },
  { id: "nutrition", label: "Nutrition", to: "/nutrition", kind: "bars", tone: "bg-blush", value: (d) => n0(d.snap.caloriesKcal), format: (v) => `${Math.round(Number(v)).toLocaleString()} kcal` },
  { id: "water", label: "Water", to: "/nutrition", kind: "bars", tone: "bg-sky", value: (d) => n0(d.snap.waterL), format: (v) => `${Number(v).toFixed(1)} L` },
  { id: "steps", label: "Steps", to: "/training", kind: "bars", tone: "bg-sage", value: (d) => n0(d.snap.steps), format: (v) => `${Math.round(Number(v)).toLocaleString()} steps` },
  { id: "measurements", label: "Measurements", to: "/measurements", kind: "marker", tone: "bg-stone", value: (d) => n0(d.measures), format: (v) => `${v} logged` },
  { id: "habits", label: "Habits", to: "/goals", kind: "marker", tone: "bg-sage", value: (d) => n0(d.habits), format: (v) => `${v} completed` },
  { id: "goals", label: "Goals", to: "/goals", kind: "marker", tone: "bg-lavender", value: (d) => n0(d.goals.length), format: (v) => `${v} update${Number(v) === 1 ? "" : "s"}` },
  { id: "journal", label: "Journal", to: "/journal", kind: "marker", tone: "bg-blush-soft", value: (d) => n0(d.journal.length), format: (v) => `${v} entr${Number(v) === 1 ? "y" : "ies"}` },
];

const RANGES = [
  { id: "7d", label: "7 days", days: 7, bucket: 1 },
  { id: "30d", label: "30 days", days: 30, bucket: 1 },
  { id: "3m", label: "3 months", days: 91, bucket: 7 },
  { id: "6m", label: "6 months", days: 182, bucket: 7 },
  { id: "1y", label: "1 year", days: 364, bucket: 14 },
] as const;

const KEY = "bloom.overview.metrics.v1";
const DEFAULT_ORDER = ["mood", "weight", "sleep", "training", "cycle"];

const shift = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDate(d.toISOString());
};
const short = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const long = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

type Bucket = { from: string; to: string; days: Day[] };

/** Numbers average over days that actually have a value; mood takes the most frequent. */
function bucketValue(m: MetricDef, b: Bucket): number | string | undefined {
  const vals = b.days.map(m.value).filter((v) => v !== undefined);
  if (!vals.length) return undefined;
  if (m.kind === "mood") {
    const c = new Map<string, number>();
    vals.forEach((v) => c.set(String(v), (c.get(String(v)) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  if (m.kind === "marker") return vals.reduce<number>((s, v) => s + Number(v), 0);
  if (m.kind === "band") return Number(vals[vals.length - 1]);
  return vals.reduce<number>((s, v) => s + Number(v), 0) / vals.length;
}

export function ConnectedOverview() {
  const { events } = useBloomContext();
  const today = localDate();

  const periods = useMemo(() => periodsOf(events), [events]);
  const starts = useMemo(() => periods.map((p) => p.start).sort(), [periods]);

  const byDate = useMemo(() => {
    const map = new Map<string, BloomEvent[]>();
    for (const e of events) {
      const d = localDate(e.at);
      map.set(d, [...(map.get(d) ?? []), e]);
    }
    return map;
  }, [events]);

  const oldest = useMemo(() => [...byDate.keys()].sort()[0], [byDate]);
  const span = oldest ? Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${oldest}T12:00:00`).getTime()) / 86400000) + 1 : 0;
  const ranges = RANGES.filter((r, i) => i === 0 || span > RANGES[i - 1].days);
  const [rangeId, setRangeId] = useState("7d");
  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0];

  const makeDay = (date: string): Day => {
    const list = byDate.get(date) ?? [];
    const onPeriod = periods.some((p) => p.end ? date >= p.start && date <= p.end : date === p.start);
    const cd = starts.length && date >= starts[0] ? cycleDayOn(starts, date) : undefined;
    return {
      date,
      snap: buildDailySnapshot(list, date),
      cycleDay: typeof cd === "number" && cd > 0 && cd <= 60 ? cd : undefined,
      onPeriod,
      habits: list.filter((e) => e.category === "habit").length,
      goals: list.filter((e) => e.category === "goal"),
      journal: list.filter((e) => isJournalEntry(e) || isMemory(e)),
      measures: list.filter((e) => e.category === "measurement").length,
    };
  };

  const buckets = useMemo<Bucket[]>(() => {
    const out: Bucket[] = [];
    const count = Math.ceil(range.days / range.bucket);
    for (let i = count - 1; i >= 0; i--) {
      const to = shift(today, -i * range.bucket);
      const from = shift(to, -(range.bucket - 1));
      const days: Day[] = [];
      for (let k = 0; k < range.bucket; k++) days.push(makeDay(shift(from, k)));
      out.push({ from, to, days });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.id, byDate, starts, today]);

  // Only metrics the user has ever logged are offered.
  const available = useMemo(() => {
    const all: Day[] = [...byDate.keys()].map(makeDay);
    return METRICS.filter((m) => all.some((d) => m.value(d) !== undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDate, starts]);

  const [chosen, setChosen] = useState<string[] | null>(null);
  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
      if (Array.isArray(raw)) setChosen(raw);
    } catch {
      /* ignore */
    }
  }, []);
  const defaults = [
    ...DEFAULT_ORDER.filter((id) => available.some((m) => m.id === id)),
    ...available.map((m) => m.id).filter((id) => !DEFAULT_ORDER.includes(id)),
  ].slice(0, 5);
  const visibleIds = chosen ?? defaults;
  const visible = available.filter((m) => visibleIds.includes(m.id));
  const toggle = (id: string) => {
    const next = visibleIds.includes(id) ? visibleIds.filter((x) => x !== id) : [...visibleIds, id];
    setChosen(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  };

  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => setSelected(null), [range.id]);

  const daily = range.bucket === 1;
  const labelEvery = buckets.length > 14 ? Math.ceil(buckets.length / 7) : 1;
  const cols = { gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` };
  const sel = selected !== null ? buckets[selected] : null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">What you've recorded, side by side. Tap a day or a row to look closer.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {ranges.length > 1
            ? ranges.map((r) => (
                <button key={r.id} type="button" onClick={() => setRangeId(r.id)} className={cn("rounded-full px-3 py-1 text-xs", range.id === r.id ? "bg-sage-soft" : "text-muted-foreground hover:bg-muted")}>
                  {r.label}
                </button>
              ))
            : null}
          {available.length ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Metrics
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60 rounded-2xl">
                <p className="mb-2 text-sm font-medium">Show on your overview</p>
                <div className="space-y-2">
                  {available.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={visibleIds.includes(m.id)} onCheckedChange={() => toggle(m.id)} />
                      {m.label}
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Hiding a metric only changes this view. Your data stays.</p>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      </div>

      <Card className="rounded-3xl border-transparent bg-card shadow-none">
        <CardContent className="p-5 sm:p-7">
          {!available.length ? (
            <p className="text-sm text-muted-foreground">
              Your picture will build as you log. Start with anything — a mood, your sleep or your weight — and it will appear here day by day.
            </p>
          ) : !visible.length ? (
            <p className="text-sm text-muted-foreground">Nothing selected. Use Metrics to choose what to show.</p>
          ) : (
            <div className="space-y-1">
              {/* Shared time axis */}
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-end gap-3">
                <span />
                <div className="grid gap-0.5" style={cols}>
                  {buckets.map((b, i) => (
                    <button
                      key={b.to}
                      type="button"
                      onClick={() => setSelected(selected === i ? null : i)}
                      aria-label={daily ? long(b.to) : `${short(b.from)} – ${short(b.to)}`}
                      className={cn("truncate rounded-md py-1 text-center text-[10px] text-muted-foreground", selected === i && "bg-sage-soft text-foreground", b.to === today && "font-semibold text-foreground")}
                    >
                      {i % labelEvery === 0 || i === buckets.length - 1
                        ? daily && buckets.length <= 7
                          ? new Date(`${b.to}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })
                          : short(b.to)
                        : ""}
                    </button>
                  ))}
                </div>
              </div>

              {visible.map((m) => {
                const vals = buckets.map((b) => bucketValue(m, b));
                const nums = vals.filter((v): v is number => typeof v === "number");
                const max = Math.max(...nums, 0);
                const min = Math.min(...nums);
                const open = expanded === m.id;
                const recent = buckets
                  .map((b, i) => ({ b, v: vals[i] }))
                  .filter((x) => x.v !== undefined)
                  .reverse()
                  .slice(0, 5);
                return (
                  <div key={m.id} className={cn("rounded-2xl", open && "bg-muted/40 pb-3")}>
                    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3">
                      <button type="button" onClick={() => setExpanded(open ? null : m.id)} aria-expanded={open} className="truncate py-2 pl-1 text-left text-sm text-foreground/80 hover:text-foreground">
                        {m.label}
                      </button>
                      <div className="relative grid h-9 items-end gap-0.5" style={cols}>
                        {m.kind === "line" && nums.length ? (
                          <LineLayer vals={vals} min={min} max={max} />
                        ) : null}
                        {vals.map((v, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelected(selected === i ? null : i)}
                            title={v !== undefined ? `${short(buckets[i].to)} — ${m.format(v)}` : undefined}
                            className={cn("relative flex h-full items-end justify-center rounded-md", selected === i && "bg-sage-soft/50")}
                            aria-label={v !== undefined ? `${m.label} ${short(buckets[i].to)}: ${m.format(v)}` : `${m.label} ${short(buckets[i].to)}: nothing recorded`}
                          >
                            <Cell m={m} v={v} max={max} bucket={buckets[i]} compact={buckets.length > 14} />
                          </button>
                        ))}
                      </div>
                    </div>
                    {open ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pt-1 text-sm">
                        {recent.map(({ b, v }) => (
                          <span key={b.to} className="text-muted-foreground">
                            <span className="text-foreground">{m.format(v!)}</span> · {daily ? short(b.to) : `w/c ${short(b.from)}`}
                          </span>
                        ))}
                        {!daily && m.kind !== "marker" && m.kind !== "mood" ? <span className="text-xs text-muted-foreground">Weekly averages of the days you logged.</span> : null}
                        <Link to={m.to} className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                          View {m.label} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {sel ? <DaySummary bucket={sel} daily={daily} metrics={visible} onClose={() => setSelected(null)} /> : null}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function LineLayer({ vals, min, max }: { vals: (number | string | undefined)[]; min: number; max: number }) {
  const w = vals.length;
  const pts = vals
    .map((v, i) => (typeof v === "number" ? { x: ((i + 0.5) / w) * 100, y: max === min ? 50 : 85 - ((v - min) / (max - min)) * 70 } : null))
    .filter((p): p is { x: number; y: number } => !!p);
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--sage)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1" fill="var(--sage)" />
      ))}
    </svg>
  );
}

function Cell({ m, v, max, bucket, compact }: { m: MetricDef; v?: number | string; max: number; bucket: Bucket; compact: boolean }) {
  if (m.kind === "band") {
    const period = bucket.days.some((d) => d.onPeriod);
    if (v === undefined && !period) return <span className="mb-1 h-1 w-full rounded-full bg-muted/60" />;
    return (
      <span className={cn("mb-0.5 flex h-5 w-full items-center justify-center rounded-md text-[9px]", period ? "bg-blush text-foreground" : "bg-blush-soft/60 text-muted-foreground")}>
        {!compact && v !== undefined ? Math.round(Number(v)) : ""}
      </span>
    );
  }
  if (v === undefined) return <span className="mb-1 h-1 w-1 rounded-full bg-muted" />;
  if (m.kind === "line") return null;
  if (m.kind === "mood") {
    return compact ? <span className="mb-1 h-3 w-3 rounded-full bg-lavender" /> : <span className="mb-0.5 text-lg leading-none">{moodEmoji(String(v))}</span>;
  }
  if (m.kind === "marker") {
    return <span className={cn("mb-1 rounded-full", m.tone, compact ? "h-2 w-2" : "h-3 w-3")} />;
  }
  const h = max ? Math.max(12, (Number(v) / max) * 100) : 0;
  return <span className={cn("w-full max-w-5 rounded-md opacity-80", m.tone)} style={{ height: `${h}%` }} />;
}

function DaySummary({ bucket, daily, metrics, onClose }: { bucket: Bucket; daily: boolean; metrics: MetricDef[]; onClose: () => void }) {
  const rows = metrics
    .map((m) => ({ m, v: bucketValue(m, bucket) }))
    .filter((r) => r.v !== undefined);
  const day = daily ? bucket.days[0] : undefined;
  return (
    <div className="mt-3 space-y-2 rounded-2xl bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-medium">{daily ? long(bucket.to) : `${short(bucket.from)} – ${short(bucket.to)}`}</p>
        <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs" onClick={onClose}>Close</Button>
      </div>
      {rows.length ? (
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {rows.map(({ m, v }) => (
            <li key={m.id}>
              <Link to={m.to} className="flex justify-between gap-3 rounded-xl px-2 py-1 hover:bg-card">
                <span className="text-muted-foreground">{m.label}</span>
                <span>{m.format(v!)}{!daily && (m.kind === "bars" || m.kind === "line") ? " avg" : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing recorded {daily ? "that day" : "in these days"} for the metrics shown.</p>
      )}
      {day?.goals.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {day.goals.slice(0, 3).map((g) => (
            <GoalLink key={g.id} e={g} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GoalLink({ e }: { e: BloomEvent }) {
  const goalId = e.goalId;
  if (!goalId) return <span className="rounded-full bg-card px-3 py-1 text-xs">{e.title}</span>;
  return (
    <Link to="/goals/$goalId" params={{ goalId }} className="rounded-full bg-card px-3 py-1 text-xs hover:bg-sage-soft">
      {e.title} →
    </Link>
  );
}

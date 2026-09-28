import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyse, confidenceLabel } from "@/features/analytics/engine";
import { atForDate, localDate } from "@/features/measurements/model";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent, updateEvent } from "@/features/timeline/store";
import { cn } from "@/lib/utils";

import { CycleDayDialog } from "./cycle-day-dialog";

import {
  PERIOD_ORIGIN,
  addDays,
  analyseCycle,
  cycleSummaries,
  symptomHistory,
  type CycleSummary,
  type DayLog,
  daysBetween,
  phaseMeta,
  rangeText,
  shortDate,
  type Period,
  type Phase,
} from "../model";

const ranges = [
  { id: "30d", label: "30 days", days: 30 },
  { id: "3m", label: "3 months", days: 91 },
  { id: "6m", label: "6 months", days: 182 },
  { id: "1y", label: "1 year", days: 365 },
] as const;

const confidenceText = (c: string, n: number) =>
  c === "high"
    ? `Based on ${n} recorded cycles.`
    : c === "moderate"
      ? `Based on ${n} recorded cycles.`
      : `Early estimate — Bloom has only ${n} recorded cycle${n === 1 ? "" : "s"}.`;

export function CyclePage() {
  const { events, record } = useBloomContext();
  const today = localDate();
  const state = useMemo(() => analyseCycle(events, today), [events, today]);
  const observations = useMemo(
    () => analyse(events, 365).patterns.filter((p) => p.category === "Cycle"),
    [events],
  );
  const [dialog, setDialog] = useState<{ open: boolean; editing?: Period }>({ open: false });
  const [day, setDay] = useState<{ open: boolean; date?: string }>({ open: false });
  const summaries = useMemo(() => cycleSummaries(events, today), [events, today]);
  const symptoms = useMemo(() => symptomHistory(summaries), [summaries]);
  const [openCycle, setOpenCycle] = useState<string | null>(null);
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("6m");

  const save = (v: { start: string; end?: string; notes?: string }) => {
    const patch = {
      at: atForDate(v.start),
      periodEnd: v.end || undefined,
      notes: v.notes || undefined,
      detail: v.end ? `${shortDate(v.start)} – ${shortDate(v.end)}` : `Started ${shortDate(v.start)}`,
    };
    if (dialog.editing) updateEvent(dialog.editing.id, { ...patch, origin: PERIOD_ORIGIN });
    else
      record({
        category: "cycle",
        title: "Period started",
        origin: PERIOD_ORIGIN,
        metrics: { symptoms: "Period started" },
        ...patch,
      });
    setDialog({ open: false });
  };

  const { current, stats, cycles, periods } = state;
  const ongoing = current && !current.periodEnd && (!state.periodLength || current.day <= state.periodLength + 3);
  const cutoff = addDays(today, -ranges.find((r) => r.id === range)!.days);
  const shown = cycles.filter((c) => c.start >= cutoff).reverse();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-20">
      <header className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">Cycle</h1>
        <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">
          Where am I in my cycle, and what might be coming next?
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Your cycle history, built only from the periods you record.
        </p>
      </header>

      {!current ? (
        <Card className="rounded-3xl border-transparent bg-blush-soft/60 shadow-none">
          <CardContent className="space-y-4 p-10 text-center">
            <p className="text-3xl" aria-hidden>🌱</p>
            <h2 className="font-display text-2xl font-medium">Let's start your cycle history.</h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
              Record your period dates, symptoms and how you're feeling, and Bloom will gradually build a picture of your
              cycle.
            </p>
            <Button className="rounded-full" onClick={() => setDialog({ open: true })}>
              <Plus className="h-3.5 w-3.5" /> Log your first period
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today */}
          <Card className="rounded-3xl border-transparent bg-card shadow-none">
            <CardContent className="flex flex-wrap items-start justify-between gap-6 p-7">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="font-display text-4xl font-medium">Cycle day {current.day}</p>
                <p className="text-base text-foreground/80">
                  {state.phase ? `${phaseMeta[state.phase].emoji} ${phaseLabel(state.phase)}` : "Phase not estimated yet"}
                </p>
                {state.nextPeriod ? (
                  <p className="pt-2 text-sm">
                    Next period: around {state.nextPeriod.from === state.nextPeriod.to ? shortDate(state.nextPeriod.mid) : rangeText(state.nextPeriod.from, state.nextPeriod.to)}
                  </p>
                ) : null}
                <p className="pt-1 text-sm text-muted-foreground">
                  {state.ovulation
                    ? `Estimated ovulation window: ${rangeText(state.ovulation.from, state.ovulation.to)}`
                    : "Bloom needs a little more cycle history before it can estimate your ovulation window."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {ongoing ? (
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => updateEvent(periods[0].id, { periodEnd: today })}
                  >
                    Period ended today
                  </Button>
                ) : null}
                <Button className="rounded-full" onClick={() => setDay({ open: true })}>
                  <Plus className="h-3.5 w-3.5" /> Log today
                </Button>
                <Button variant="secondary" className="rounded-full" onClick={() => setDialog({ open: true })}>
                  Log period
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current cycle timeline */}
          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">This cycle</h2>
            <Card className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="space-y-5 p-7">
                {state.segments ? (
                  <PhaseTimeline segments={state.segments} day={current.day} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your phases will appear here once Bloom has at least two complete cycles to learn from. You're on day{" "}
                    {current.day} since your period started on {shortDate(current.start)}.
                  </p>
                )}
                <DayStrip
                  cycle={summaries[0]}
                  onPick={(date) => setDay({ open: true, date })}
                />
              </CardContent>
            </Card>
          </section>

          {/* Estimates */}
          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">What might be coming next</h2>
            <Card className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="space-y-4 p-7">
                {stats && state.nextPeriod && state.confidence ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Estimate
                        label="Estimated next period"
                        value={
                          state.nextPeriod.from === state.nextPeriod.to
                            ? shortDate(state.nextPeriod.mid)
                            : `Around ${rangeText(state.nextPeriod.from, state.nextPeriod.to)}`
                        }
                      />
                      <Estimate
                        label="Estimated fertile window"
                        value={state.ovulation ? rangeText(addDays(state.ovulation.from, -3), state.ovulation.to) : "Not enough history yet"}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {confidenceText(state.confidence, stats.count)}{" "}
                      {stats.irregular ? "Your cycle lengths have varied recently, so this estimate has a wider range." : ""}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Estimated from your recorded cycle history. Cycle and ovulation timing can vary. This is an estimate
                      based on your recorded history and should not be used as contraception.
                    </p>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="font-medium">Bloom is still learning your cycle.</p>
                    <p className="text-sm text-muted-foreground">
                      Keep logging your cycle and Bloom will gradually make its estimates more personal.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* History */}
          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">Cycle history</h2>
            <Card className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="space-y-6 p-7">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Estimate label="Current cycle" value={`${current.day} day${current.day === 1 ? "" : "s"}`} />
                  <Estimate label="Average cycle length" value={stats ? `${stats.average} days` : "—"} />
                  <Estimate
                    label="Typical range"
                    value={stats && stats.count > 1 ? `${stats.min}–${stats.max} days` : "—"}
                  />
                  <Estimate label="Shortest · longest" value={cycles.length ? `${Math.min(...cycles.map((c) => c.length))} · ${Math.max(...cycles.map((c) => c.length))} days` : "—"} />
                  <Estimate label="Recorded cycles" value={String(cycles.length)} />
                  <Estimate
                    label="Period length"
                    value={(() => {
                      const ds = summaries.flatMap((c) => (c.periodDays ? [c.periodDays] : []));
                      if (!ds.length) return "Add end dates";
                      const avg = Math.round(ds.reduce((a, b) => a + b, 0) / ds.length);
                      return ds.length > 1 ? `${avg} days (${Math.min(...ds)}–${Math.max(...ds)})` : `${avg} days`;
                    })()}
                  />
                </div>
                {cycles.length < 3 ? (
                  <p className="text-sm text-muted-foreground">
                    Bloom is still learning your cycle. Record a few more cycles to build a more personal picture.
                  </p>
                ) : null}
                {stats && stats.count > 1 ? (
                  <p className="text-sm text-muted-foreground">
                    Your cycles have averaged {stats.average} days over the last {Math.min(6, stats.count)} cycles
                    {stats.irregular ? ", with some variation." : stats.count >= 4 ? " and have been fairly consistent." : "."}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {ranges.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRange(r.id)}
                      className={cn(
                        "rounded-full px-3.5 py-1 text-sm transition-colors",
                        range === r.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80 hover:bg-muted/70",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {shown.length >= 2 ? (
                  <CycleBars cycles={shown} average={stats?.average} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Log a few more cycles and your cycle history will appear here.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Personal observations */}
          {observations.length ? (
            <section className="space-y-4">
              <h2 className="text-base font-medium text-foreground/80">What Bloom has noticed</h2>
              <div className="grid gap-3">
                {observations.map((p) => (
                  <Card key={p.id} className="rounded-3xl border-transparent bg-lavender-soft/50 shadow-none">
                    <CardContent className="space-y-2 p-6">
                      <p className="text-xs text-muted-foreground">{confidenceLabel[p.confidence]}</p>
                      <p className="text-base">{p.statement}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.groups.map((g) => `${g.label}: ${g.average} (${g.count} days)`).join(" · ")}. Based on your
                        recorded history — not proof that one causes the other.
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Link to="/analytics" className="text-sm text-sage hover:underline">
                See all patterns in Analytics →
              </Link>
            </section>
          ) : null}

          {/* Symptom history */}
          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">Symptoms you've logged</h2>
            <Card className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="space-y-3 p-7">
                {symptoms.items.length ? (
                  <>
                    {symptoms.items.slice(0, 8).map(([name, n]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-sm">{name}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-blush/70" style={{ width: `${(n / symptoms.items[0][1]) * 100}%` }} />
                        </div>
                        <span className="w-44 shrink-0 text-right text-xs text-muted-foreground">
                          {n} day{n === 1 ? "" : "s"} across the last {symptoms.cycles === 1 ? "cycle" : `${symptoms.cycles} cycles`}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">A record of what you've logged — not a diagnosis.</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Symptoms you log with "Log today" will appear here, so you can see what comes up across your cycles.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Past cycles */}
          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">Your cycles</h2>
            <div className="space-y-2">
              {summaries.map((c) => (
                <CycleRow key={c.start} cycle={c} open={openCycle === c.start} onToggle={() => setOpenCycle(openCycle === c.start ? null : c.start)} onPickDay={(date) => setDay({ open: true, date })} />
              ))}
            </div>
          </section>

          {/* Recorded periods */}
          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">Recorded periods</h2>
            <Card className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="divide-y divide-border/50 px-7 py-2">
                {periods.map((p, i) => {
                  const next = periods[i - 1];
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 py-3.5">
                      <span className="text-sm">
                        🩸 {shortDate(p.start)}
                        {p.end ? ` – ${shortDate(p.end)}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {next ? `${daysBetween(p.start, next.start)}-day cycle` : "Current cycle"}
                      </span>
                      {p.notes ? <span className="w-full text-xs text-muted-foreground">{p.notes}</span> : null}
                      <span className="ml-auto flex">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Edit period" onClick={() => setDialog({ open: true, editing: p })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full"
                          aria-label="Delete period"
                          onClick={() => window.confirm("Delete this period?") && removeEvent(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {day.open ? <CycleDayDialog open date={day.date} onClose={() => setDay({ open: false })} /> : null}
      <PeriodDialog
        key={dialog.editing?.id ?? String(dialog.open)}
        open={dialog.open}
        editing={dialog.editing}
        onClose={() => setDialog({ open: false })}
        onSave={save}
      />
    </div>
  );
}

function phaseLabel(p: Phase) {
  return p === "ovulation" ? "Estimated ovulation" : `${phaseMeta[p].label} phase`;
}

function Estimate({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-medium">{value}</p>
    </div>
  );
}

function PhaseTimeline({ segments, day }: { segments: { phase: Phase; from: number; to: number }[]; day: number }) {
  // One source of truth: the bar, the cards and the marker all use these day ranges.
  const total = segments[segments.length - 1].to;
  const pos = Math.min(100, Math.max(0, ((day - 0.5) / total) * 100));
  const columns = segments.map((s) => `${s.to - s.from + 1}fr`).join(" ");
  const card = (s: (typeof segments)[number]) => {
    const active = day >= s.from && day <= s.to;
    return (
      <div key={s.phase} className={cn("min-w-0 rounded-2xl p-3", active ? phaseMeta[s.phase].soft : "bg-muted/40")}>
        <p className="truncate text-sm">
          {phaseMeta[s.phase].emoji} {phaseMeta[s.phase].label}
        </p>
        <p className="text-xs text-muted-foreground">
          Day{s.to > s.from ? "s" : ""} {s.from}
          {s.to > s.from ? `–${s.to}` : ""}
        </p>
      </div>
    );
  };
  return (
    <div className="space-y-4">
      <div className="relative pt-7">
        <div
          className="absolute top-0 -translate-x-1/2 rounded-full bg-foreground/80 px-2.5 py-0.5 text-[11px] whitespace-nowrap text-background"
          style={{ left: `clamp(2.5rem, ${pos}%, calc(100% - 2.5rem))` }}
        >
          You are here
        </div>
        <div className="grid h-4 gap-1" style={{ gridTemplateColumns: columns }}>
          {segments.map((s) => (
            <div
              key={s.phase}
              className={cn("h-full rounded-full", phaseMeta[s.phase].tone, day >= s.from && day <= s.to ? "opacity-100" : "opacity-35")}
            />
          ))}
        </div>
        <div className="absolute top-6 h-6 w-0.5 -translate-x-1/2 rounded bg-foreground/70" style={{ left: `${pos}%` }} />
      </div>
      {/* Wide screens: cards share the bar's exact columns. Small screens: a calm 2×2 grid. */}
      <div className="hidden gap-1 sm:grid" style={{ gridTemplateColumns: columns }}>
        {segments.map(card)}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:hidden">{segments.map(card)}</div>
      <p className="text-xs text-muted-foreground">Phases are estimated from your own recorded cycles.</p>
    </div>
  );
}

function logLine(l: DayLog) {
  return [l.flow, ...l.symptoms, l.energy ? `${l.energy} energy` : ""].filter(Boolean).join(" · ");
}

function DayStrip({ cycle, onPick }: { cycle?: CycleSummary; onPick: (date: string) => void }) {
  if (!cycle) return null;
  const days = daysBetween(cycle.start, cycle.end) + 1;
  const byDate = new Map(cycle.logs.map((l) => [l.date, l]));
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Tap a day to see or change what you logged.</p>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: days }, (_, i) => {
          const date = addDays(cycle.start, i);
          const log = byDate.get(date);
          const period = cycle.periodEnd ? date <= cycle.periodEnd : i === 0;
          return (
            <button
              key={date}
              type="button"
              title={`Cycle day ${i + 1} · ${shortDate(date)}${log ? ` · ${logLine(log)}` : ""}`}
              aria-label={`Cycle day ${i + 1}, ${shortDate(date)}${log ? ", logged" : ""}`}
              onClick={() => onPick(date)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-[11px] transition-colors",
                period ? "bg-blush-soft" : "bg-muted/50",
                log ? "ring-2 ring-sage/60" : "",
                "hover:bg-muted",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CycleRow({ cycle, open, onToggle, onPickDay }: { cycle: CycleSummary; open: boolean; onToggle: () => void; onPickDay: (d: string) => void }) {
  const flows = [...new Set(cycle.logs.flatMap((l) => (l.flow ? [l.flow] : [])))];
  const sym = new Map<string, number>();
  cycle.logs.forEach((l) => l.symptoms.forEach((s) => sym.set(s, (sym.get(s) ?? 0) + 1)));
  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-none">
      <CardContent className="p-0">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-3 px-6 py-4 text-left">
          <span className="text-sm font-medium">
            {shortDate(cycle.start)} – {cycle.current ? "today" : shortDate(cycle.end)}
          </span>
          <span className="text-xs text-muted-foreground">
            {cycle.current ? "Current cycle" : `${cycle.length} days`}
            {cycle.periodDays ? ` · period ${cycle.periodDays} days` : ""}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">{cycle.logs.length ? `${cycle.logs.length} days logged` : ""}</span>
        </button>
        {open ? (
          <div className="space-y-3 border-t border-border/50 px-6 py-4 text-sm">
            <p className="text-muted-foreground">Flow: {flows.length ? flows.join(", ") : "not recorded"}</p>
            <p className="text-muted-foreground">
              Symptoms: {sym.size ? [...sym.entries()].map(([s, n]) => `${s} (${n})`).join(", ") : "none logged"}
            </p>
            {cycle.logs.length ? (
              <div className="divide-y divide-border/40">
                {cycle.logs.map((l) => (
                  <button key={l.id} type="button" onClick={() => onPickDay(l.date)} className="block w-full py-2 text-left hover:opacity-80">
                    <span className="text-xs text-muted-foreground">
                      Cycle day {daysBetween(cycle.start, l.date) + 1} · {shortDate(l.date)}
                    </span>
                    <span className="block">{logLine(l) || "Note"}</span>
                    {l.notes ? <span className="block text-xs text-muted-foreground">"{l.notes}"</span> : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No day logs in this cycle.</p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CycleBars({ cycles, average }: { cycles: { start: string; length: number }[]; average?: number }) {
  const max = Math.max(...cycles.map((c) => c.length), average ?? 0);
  return (
    <div className="space-y-2">
      <div className="flex h-40 items-end gap-2">
        {cycles.map((c) => (
          <div key={c.start} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{c.length}</span>
            <div className="w-full max-w-10 rounded-t-2xl bg-blush/60" style={{ height: `${(c.length / max) * 120}px` }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {cycles.map((c) => (
          <span key={c.start} className="flex-1 text-center text-[11px] text-muted-foreground">
            {shortDate(c.start).split(" ").reverse().join(" ")}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Each bar is one completed cycle, labelled by the day it started.</p>
    </div>
  );
}

function PeriodDialog({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  editing?: Period;
  onClose: () => void;
  onSave: (v: { start: string; end?: string; notes?: string }) => void;
}) {
  const [start, setStart] = useState(editing?.start ?? localDate());
  const [end, setEnd] = useState(editing?.end ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const invalid = !start || start > localDate() || (end !== "" && end < start);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit period" : "Log period"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-start">First day</Label>
            <Input id="p-start" type="date" value={start} max={localDate()} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-end">Last day (optional)</Label>
            <Input id="p-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-notes">Notes (optional)</Label>
            <Textarea id="p-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you'd like to remember" />
          </div>
          <Button className="w-full rounded-full" disabled={invalid} onClick={() => onSave({ start, end, notes })}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

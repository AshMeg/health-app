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

import {
  PERIOD_ORIGIN,
  addDays,
  analyseCycle,
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
              Log the first day of your period and Bloom will begin building your personal cycle history. As you record
              more cycles, Bloom can start estimating your typical cycle length and upcoming phases.
            </p>
            <Button className="rounded-full" onClick={() => setDialog({ open: true })}>
              <Plus className="h-3.5 w-3.5" /> Log period
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
                <p className="pt-2 text-sm text-muted-foreground">
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
                <Button className="rounded-full" onClick={() => setDialog({ open: true })}>
                  <Plus className="h-3.5 w-3.5" /> Log period
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
                      More recorded cycles will make your estimates more personalised. Log your next period start and Bloom
                      can begin estimating.
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
                </div>
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
  return p === "ovulation" ? "Estimated ovulation window" : `${phaseMeta[p].label} phase`;
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
  const total = segments[segments.length - 1].to;
  const pos = Math.min(100, ((day - 0.5) / total) * 100);
  return (
    <div className="space-y-4">
      <div className="relative pt-7">
        <div
          className="absolute top-0 -translate-x-1/2 rounded-full bg-foreground/80 px-2.5 py-0.5 text-[11px] whitespace-nowrap text-background"
          style={{ left: `${pos}%` }}
        >
          You are here
        </div>
        <div className="flex h-4 gap-1 overflow-hidden rounded-full">
          {segments.map((s) => (
            <div
              key={s.phase}
              className={cn("h-full rounded-full", phaseMeta[s.phase].tone, day >= s.from && day <= s.to ? "opacity-100" : "opacity-35")}
              style={{ flexGrow: s.to - s.from + 1 }}
            />
          ))}
        </div>
        <div className="absolute top-6 h-6 w-0.5 -translate-x-1/2 rounded bg-foreground/70" style={{ left: `${pos}%` }} />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {segments.map((s) => {
          const active = day >= s.from && day <= s.to;
          return (
            <div key={s.phase} className={cn("rounded-2xl p-3", active ? phaseMeta[s.phase].soft : "bg-muted/40")}>
              <p className="text-sm">
                {phaseMeta[s.phase].emoji} {s.phase === "ovulation" ? "Estimated ovulation" : phaseMeta[s.phase].label}
              </p>
              <p className="text-xs text-muted-foreground">
                Days {s.from}
                {s.to > s.from ? `–${s.to}` : ""}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Phases are estimated from your own recorded cycles.</p>
    </div>
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

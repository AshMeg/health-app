import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EventDateField, validPastDate } from "@/components/shared/event-date-field";
import { eventAt, todayLocal } from "@/lib/event-date";
import { cn } from "@/lib/utils";

import { useBloomContext } from "../hooks/use-bloom-context";
import type { MetricKey, WorkoutDetails } from "../types";
import { formatSleep } from "../snapshot";

const num = (raw: string) => {
  const t = raw.trim().replace(",", ".");
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition-colors",
            value === o ? "bg-sage-soft text-sage" : "bg-muted text-muted-foreground hover:bg-muted/70",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Field({ label, unit, value, onChange, placeholder }: { label: string; unit?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = `f-${label.replace(/\W/g, "")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
        {unit ? ` (${unit})` : ""}
      </Label>
      <Input id={id} inputMode="decimal" value={value} placeholder={placeholder ?? "optional"} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let d = eh * 60 + em - (sh * 60 + sm);
  if (d <= 0) d += 24 * 60;
  return d;
}

function GoalPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { goals } = useBloomContext();
  const list = goals.goals ?? [];
  if (!list.length) return null;
  return (
    <div className="space-y-1.5">
      <Label htmlFor="link-goal" className="text-xs text-muted-foreground">Link to a goal (optional)</Label>
      <select
        id="link-goal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
      >
        <option value="">No goal</option>
        {list.map((g) => (
          <option key={g.id} value={g.id}>{g.title}</option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ Sleep */

export function SleepDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { record } = useBloomContext();
  const [kind, setKind] = useState<"Night sleep" | "Nap">("Night sleep");
  const [hours, setHours] = useState("");
  const [mins, setMins] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setKind("Night sleep"); setHours(""); setMins(""); setStart(""); setEnd(""); setNotes("");
      setDate(todayLocal());
    }
  }, [open]);

  const typed = (num(hours) ?? 0) * 60 + (num(mins) ?? 0);
  const fromTimes = start && end ? minutesBetween(start, end) : 0;
  const minutes = Math.round(typed || fromTimes);
  const nap = kind === "Nap";
  const dateOk = validPastDate(date, nap && start ? start : undefined);
  const ok = minutes > 0 && minutes < 24 * 60 && dateOk;

  const save = () => {
    if (!ok) return;
    const metrics: Partial<Record<MetricKey, number>> = nap ? { nap: minutes } : { sleep: minutes };
    const times = start && end ? ` · ${start}–${end}` : "";
    record({
      category: "sleep",
      title: nap ? "Nap" : "Night sleep",
      detail: `${formatSleep(minutes)}${times}`,
      value: minutes,
      unit: "min",
      metrics,
      sleep: { kind: nap ? "nap" : "night", minutes, start: start || undefined, end: end || undefined },
      notes: notes.trim() || undefined,
      source: "manual",
      origin: "Quick add",
      at: eventAt(date, nap ? start || undefined : undefined),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">Log sleep</DialogTitle>
          <DialogDescription>Naps are kept separately from your night's sleep.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <Chips options={["Night sleep", "Nap"]} value={kind} onChange={(v) => setKind(v as typeof kind)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hours" value={hours} onChange={setHours} placeholder={nap ? "0" : "7"} />
            <Field label="Minutes" value={mins} onChange={setMins} placeholder={nap ? "45" : "30"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sleep-start" className="text-xs text-muted-foreground">Start (optional)</Label>
              <Input id="sleep-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sleep-end" className="text-xs text-muted-foreground">End (optional)</Label>
              <Input id="sleep-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          {!typed && fromTimes > 0 && (
            <p className="text-sm text-muted-foreground">From your times: {formatSleep(fromTimes)}</p>
          )}
          <EventDateField date={date} onDateChange={setDate} label={nap ? "Date" : "Night of"} />
          <div className="space-y-1.5">
            <Label htmlFor="sleep-notes" className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea id="sleep-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!ok}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- Workout */

const TYPES = ["Run", "Walk", "Cycle", "Swim", "Strength", "Yoga", "Other"] as const;
type WType = (typeof TYPES)[number];

/** Which extra fields each type shows — never every field for every workout. */
const fieldsFor: Record<WType, (keyof WorkoutDetails)[]> = {
  Run: ["distanceKm", "durationMin", "calories", "avgHr", "elevationM"],
  Walk: ["distanceKm", "durationMin", "steps", "calories", "avgHr", "elevationM"],
  Cycle: ["distanceKm", "durationMin", "calories", "avgHr", "elevationM"],
  Swim: ["distanceKm", "durationMin", "laps", "calories", "avgHr"],
  Strength: ["durationMin", "exercises", "sets", "reps", "loadKg", "calories", "avgHr"],
  Yoga: ["durationMin", "style", "calories", "avgHr"],
  Other: ["durationMin", "distanceKm", "calories", "avgHr"],
};
/** The quick fields shown straight away; the rest sit under "More details". */
const quick: (keyof WorkoutDetails)[] = ["distanceKm", "durationMin"];

const labels: Partial<Record<keyof WorkoutDetails, [string, string?]>> = {
  distanceKm: ["Distance", "km"],
  durationMin: ["Duration", "min"],
  calories: ["Calories", "kcal"],
  avgHr: ["Average heart rate", "bpm"],
  elevationM: ["Elevation gain", "m"],
  steps: ["Steps"],
  laps: ["Laps"],
  exercises: ["Exercises"],
  sets: ["Sets"],
  reps: ["Reps per set"],
  loadKg: ["Weight / load", "kg"],
  style: ["Style"],
};

export function pace(distanceKm?: number, durationMin?: number) {
  if (!distanceKm || !durationMin) return undefined;
  const p = durationMin / distanceKm;
  const m = Math.floor(p);
  const s = Math.round((p - m) * 60);
  return s === 60 ? `${m + 1}:00 min/km` : `${m}:${String(s).padStart(2, "0")} min/km`;
}
export function speed(distanceKm?: number, durationMin?: number) {
  if (!distanceKm || !durationMin) return undefined;
  return `${(distanceKm / (durationMin / 60)).toFixed(1)} km/h`;
}

export function describeWorkout(w: WorkoutDetails): string {
  const parts: string[] = [w.type];
  if (w.distanceKm) parts.push(`${w.distanceKm} km`);
  if (w.durationMin) parts.push(formatSleep(Math.round(w.durationMin)) ?? "");
  const derived = w.type === "Cycle" ? speed(w.distanceKm, w.durationMin) : w.type === "Run" || w.type === "Walk" ? pace(w.distanceKm, w.durationMin) : undefined;
  if (derived) parts.push(derived);
  if (w.sets && w.reps) parts.push(`${w.sets} × ${w.reps}${w.loadKg ? ` @ ${w.loadKg} kg` : ""}`);
  if (w.laps) parts.push(`${w.laps} laps`);
  if (w.style) parts.push(w.style);
  if (w.calories) parts.push(`${w.calories} kcal`);
  if (w.avgHr) parts.push(`${w.avgHr} bpm`);
  return parts.filter(Boolean).join(" · ");
}

export function WorkoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { record } = useBloomContext();
  const [type, setType] = useState<WType>("Run");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [more, setMore] = useState(false);
  const [date, setDate] = useState(todayLocal());
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [goalId, setGoalId] = useState("");
  const [water, setWater] = useState<"" | "Pool" | "Open water">("");

  useEffect(() => {
    if (open) {
      setType("Run"); setVals({}); setMore(false); setNotes(""); setGoalId(""); setWater("");
      setDate(todayLocal()); setTime("");
    }
  }, [open]);

  const fields = fieldsFor[type];
  const shown = more ? fields : fields.filter((f) => quick.includes(f));
  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));

  const details: WorkoutDetails = { type };
  for (const f of fields) {
    const raw = vals[f] ?? "";
    if (f === "exercises" || f === "style") {
      if (raw.trim()) (details as Record<string, unknown>)[f] = raw.trim();
    } else {
      const n = num(raw);
      if (n !== undefined && n > 0) (details as Record<string, unknown>)[f] = n;
    }
  }
  if (type === "Swim" && water) details.water = water === "Pool" ? "pool" : "open";

  const derived = type === "Cycle" ? speed(details.distanceKm, details.durationMin) : ["Run", "Walk", "Swim"].includes(type) ? pace(details.distanceKm, details.durationMin) : undefined;
  const dateOk = validPastDate(date, time || undefined);

  const save = () => {
    if (!dateOk) return;
    const metrics: Partial<Record<MetricKey, number | string>> = { training: type };
    if (details.distanceKm) metrics.distance = details.distanceKm;
    if (details.durationMin) metrics.workoutMinutes = details.durationMin;
    if (details.steps) metrics.steps = details.steps;
    record({
      category: "workout",
      title: `${type} completed`,
      detail: describeWorkout(details),
      value: details.distanceKm ?? details.durationMin,
      unit: details.distanceKm ? "km" : details.durationMin ? "min" : undefined,
      metrics,
      workout: details,
      notes: notes.trim() || undefined,
      goalId: goalId || undefined,
      source: "manual",
      origin: "Quick add",
      at: eventAt(date, time || undefined),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">Log workout</DialogTitle>
          <DialogDescription>Only fill in what you know — everything is optional.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <Chips options={[...TYPES]} value={type} onChange={(v) => { setType(v as WType); setMore(false); }} />
          <div className="grid grid-cols-2 gap-3">
            {shown.map((f) => {
              const [label, unit] = labels[f] ?? [f];
              return <Field key={f} label={label} unit={unit} value={vals[f] ?? ""} onChange={(v) => set(f, v)} />;
            })}
          </div>
          {derived && <p className="text-sm text-muted-foreground">{type === "Cycle" ? "Average speed" : "Pace"}: {derived}</p>}
          {more && type === "Swim" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Where</Label>
              <Chips options={["Pool", "Open water"]} value={water} onChange={(v) => setWater(v as typeof water)} />
            </div>
          )}
          {fields.length > shown.length && !more && (
            <button type="button" onClick={() => setMore(true)} className="text-sm text-sage underline-offset-4 hover:underline">
              More details
            </button>
          )}
          <EventDateField date={date} onDateChange={setDate} time={time} onTimeChange={setTime} />
          <GoalPicker value={goalId} onChange={setGoalId} />
          <div className="space-y-1.5">
            <Label htmlFor="w-notes" className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea id="w-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!dateOk}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

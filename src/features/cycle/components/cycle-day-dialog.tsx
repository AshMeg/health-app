import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { moods } from "@/features/journal/components/journal-page";
import { atForDate, localDate } from "@/features/measurements/model";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent, updateEvent } from "@/features/timeline/store";
import { cn } from "@/lib/utils";

import { CYCLE_DAY_ORIGIN, PERIOD_ORIGIN, dayLogsOf, energies, flows, periodsOf, shortDate, symptomOptions } from "../model";

/**
 * "Log today" — flow, symptoms, mood, energy and a note for one day, all
 * optional. One cycle log per day (edited in place). Mood reuses the day's
 * shared mood record, the same one Journal edits, so it's never duplicated.
 */
export function CycleDayDialog({ open, date: initialDate, onClose }: { open: boolean; date?: string; onClose: () => void }) {
  const { events, record } = useBloomContext();
  const today = localDate();
  const [date, setDate] = useState(initialDate ?? today);
  const existing = dayLogsOf(events).get(date);
  const moodEvent = events
    .filter((e) => e.category === "mood" && localDate(e.at) === date)
    .sort((a, b) => b.at.localeCompare(a.at))[0];

  const [flow, setFlow] = useState<string | undefined>(existing?.flow);
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? []);
  const [energy, setEnergy] = useState<string | undefined>(existing?.energy);
  const [mood, setMood] = useState<string | undefined>(moodEvent?.metrics?.mood as string | undefined);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [other, setOther] = useState("");
  const [showAll, setShowAll] = useState(false);
  const periods = periodsOf(events);
  const inPeriod = periods.some((p) => p.start <= date && (p.end ? p.end >= date : p.start === date));
  const [startsPeriod, setStartsPeriod] = useState(false);

  // Reload the form when the chosen date changes.
  const changeDate = (d: string) => {
    const log = dayLogsOf(events).get(d);
    const m = events.filter((e) => e.category === "mood" && localDate(e.at) === d).sort((a, b) => b.at.localeCompare(a.at))[0];
    setDate(d);
    setFlow(log?.flow);
    setSymptoms(log?.symptoms ?? []);
    setEnergy(log?.energy);
    setNotes(log?.notes ?? "");
    setMood(m?.metrics?.mood as string | undefined);
    setStartsPeriod(false);
  };

  const toggle = (s: string) => setSymptoms((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  const custom = symptoms.filter((s) => !(symptomOptions as readonly string[]).includes(s));
  const visible = showAll ? symptomOptions : symptomOptions.slice(0, 8);
  const empty = !flow && !symptoms.length && !energy && !notes.trim();

  const save = () => {
    const detail = [flow, ...symptoms].filter(Boolean).join(", ") || energy || "Cycle log";
    const patch = { flow, symptoms, energy, notes: notes.trim() || undefined, detail };
    if (existing) {
      if (empty) removeEvent(existing.id);
      else updateEvent(existing.id, patch);
    } else if (!empty) {
      record({ category: "cycle", title: "Cycle day logged", origin: CYCLE_DAY_ORIGIN, at: atForDate(date), ...patch });
    }
    if (mood && mood !== moodEvent?.metrics?.mood) {
      if (moodEvent) updateEvent(moodEvent.id, { metrics: { ...moodEvent.metrics, mood }, detail: mood });
      else record({ category: "mood", title: "Mood recorded", detail: mood, metrics: { mood }, at: atForDate(date) });
    }
    if (startsPeriod && !inPeriod) {
      record({
        category: "cycle",
        title: "Period started",
        origin: PERIOD_ORIGIN,
        metrics: { symptoms: "Period started" },
        at: atForDate(date),
        detail: `Started ${shortDate(date)}`,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{date === today ? "Log today" : shortDate(date)}</DialogTitle>
          <DialogDescription>Everything is optional — record only what you'd like to.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <Input type="date" aria-label="Day" value={date} max={today} onChange={(e) => changeDate(e.target.value || today)} className="h-9 w-auto rounded-full" />

          <Group label="Flow">
            {flows.map((f) => (
              <Chip key={f} on={flow === f} onClick={() => setFlow(flow === f ? undefined : f)}>{f}</Chip>
            ))}
          </Group>
          {!inPeriod ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={startsPeriod} onChange={(e) => setStartsPeriod(e.target.checked)} />
              This is the first day of my period
            </label>
          ) : null}

          <Group label="Symptoms">
            {visible.map((s) => (
              <Chip key={s} on={symptoms.includes(s)} onClick={() => toggle(s)}>{s}</Chip>
            ))}
            {custom.map((s) => (
              <Chip key={s} on onClick={() => toggle(s)}>{s}</Chip>
            ))}
            {!showAll ? (
              <button type="button" className="px-2 text-xs text-sage hover:underline" onClick={() => setShowAll(true)}>
                More symptoms
              </button>
            ) : null}
          </Group>
          <div className="flex gap-2">
            <Input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Other symptom" className="h-9 rounded-full" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full"
              disabled={!other.trim()}
              onClick={() => {
                if (!symptoms.includes(other.trim())) setSymptoms([...symptoms, other.trim()]);
                setOther("");
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>

          <Group label="Mood">
            {moods.map((m) => (
              <Chip key={m.value} on={mood === m.value} onClick={() => setMood(m.value)}>
                {m.emoji} {m.value}
              </Chip>
            ))}
          </Group>

          <Group label="Energy">
            {energies.map((x) => (
              <Chip key={x} on={energy === x} onClick={() => setEnergy(energy === x ? undefined : x)}>{x}</Chip>
            ))}
          </Group>

          <div className="space-y-1.5">
            <Label htmlFor="cycle-note">Note</Label>
            <Textarea id="cycle-note" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Felt unusually tired today…" className="min-h-20" />
          </div>

          <div className="flex items-center justify-between gap-2">
            {existing ? (
              <Button variant="ghost" className="rounded-full text-destructive" onClick={() => { removeEvent(existing.id); onClose(); }}>
                <Trash2 className="h-4 w-4" /> Clear this day
              </Button>
            ) : <span />}
            <Button className="rounded-full px-6" onClick={save} disabled={empty && !mood && !startsPeriod}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("rounded-full px-3 py-1.5 text-xs transition-colors", on ? "bg-blush-soft text-foreground ring-1 ring-blush/50" : "bg-muted text-foreground/80 hover:bg-muted/70")}
    >
      {children}
    </button>
  );
}

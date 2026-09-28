import { useState } from "react";
import { Plus, X } from "lucide-react";

import { EventDateField, validPastDate } from "@/components/shared/event-date-field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDay, todayLocal } from "@/lib/event-date";

const isIso = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

import { Button } from "@/components/ui/button";
import type { BloomAccent } from "@/features/today/types";
import { GoalProgressBar } from "../goal-progress-bar";
import type { RepetitionTracking } from "../../types";

/** "12 / 20 completed" plus a progress bar, for goals done many times over. */
export function RepetitionPanel({
  tracking,
  accent = "sage",
  onChange,
}: {
  tracking: RepetitionTracking;
  accent?: BloomAccent;
  onChange: (next: RepetitionTracking) => void;
}) {
  const pct = tracking.target ? Math.min(100, (tracking.completed / tracking.target) * 100) : 0;

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayLocal());
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(0);

  // Newer logs keep an ISO date so they sort by when they happened; older ones kept a label.
  const sorted = [...tracking.logs].sort((a, b) => (isIso(b.date) && isIso(a.date) ? b.date.localeCompare(a.date) : 0));

  const log = (another: boolean) => {
    if (!validPastDate(date)) return;
    onChange({
      ...tracking,
      completed: tracking.completed + 1,
      logs: [{ id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, date, note: note.trim().slice(0, 200) || undefined }, ...tracking.logs],
    });
    setNote("");
    if (another) setAdded((n) => n + 1);
    else setOpen(false);
  };
  const remove = (id: string) =>
    onChange({ ...tracking, completed: Math.max(0, tracking.completed - 1), logs: tracking.logs.filter((l) => l.id !== id) });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="font-display text-3xl font-medium">
          {tracking.completed}
          <span className="text-muted-foreground"> / {tracking.target}</span>
          <span className="ml-2 text-base text-muted-foreground">completed</span>
        </p>
        <Button
          onClick={() => {
            setDate(todayLocal());
            setNote("");
            setAdded(0);
            setOpen(true);
          }}
          variant="secondary"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Log one
        </Button>
      </div>

      <GoalProgressBar value={pct} accent={accent} label="Repetitions completed" tall />

      {tracking.logs.length ? (
        <div className="flex flex-wrap gap-2">
          {sorted.slice(0, 12).map((entry) => (
            <span
              key={entry.id}
              title={entry.note}
              className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pr-1.5 pl-3 text-xs text-muted-foreground"
            >
              {isIso(entry.date) ? formatDay(entry.date) : entry.date}
              {entry.note ? ` · ${entry.note}` : ""}
              <button type="button" aria-label="Remove this one" className="rounded-full p-0.5 hover:bg-background" onClick={() => remove(entry.id)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing logged yet — each time you do it, tap “Log one”. Already done some before Bloom? Log them with the date they happened.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium">Log one</DialogTitle>
            <DialogDescription>Counted on the day it happened.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <EventDateField id="rep-date" date={date} onDateChange={setDate} label="Date completed" />
            <div className="space-y-1.5">
              <Label htmlFor="rep-note" className="text-xs text-muted-foreground">What was it? (optional)</Label>
              <Input id="rep-note" value={note} maxLength={200} placeholder="e.g. The Midnight Library" onChange={(e) => setNote(e.target.value)} className="rounded-xl" />
            </div>
            {added ? <p className="text-xs text-sage">{added} added. Pick the next date, or close when you're done.</p> : null}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" className="rounded-full" disabled={!validPastDate(date)} onClick={() => log(true)}>Save and add another</Button>
            <Button className="rounded-full" disabled={!validPastDate(date)} onClick={() => log(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

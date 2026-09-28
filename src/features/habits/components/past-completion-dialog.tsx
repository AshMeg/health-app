import { useEffect, useState } from "react";

import { EventDateField, validPastDate } from "@/components/shared/event-date-field";
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
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent, updateEvent } from "@/features/timeline/store";
import type { BloomEvent } from "@/features/timeline/types";
import { eventAt, localDay, shiftDate, todayLocal } from "@/lib/event-date";

import { checkInsFor, methodMeta, type Habit } from "../model";

/**
 * Adds a completion for the day it actually happened, or moves/corrects an
 * existing one. One completion per day: a date that already has one is
 * updated rather than duplicated.
 */
export function PastCompletionDialog({
  habit,
  open,
  onOpenChange,
  editing,
}: {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: BloomEvent | null;
}) {
  const { events, record } = useBloomContext();
  const measured = habit.method !== "completion";
  const unit = habit.unit || methodMeta[habit.method]?.unit || "";
  const [date, setDate] = useState(shiftDate(todayLocal(), -1));
  const [amount, setAmount] = useState("");
  const [added, setAdded] = useState(0);

  useEffect(() => {
    if (!open) return;
    setAdded(0);
    if (editing) {
      setDate(localDay(editing.at));
      setAmount(String(editing.value ?? ""));
    } else {
      setDate(shiftDate(todayLocal(), -1));
      setAmount(habit.target ? String(habit.target) : "");
    }
  }, [open, editing, habit.target]);

  const value = measured ? Number(amount) : 1;
  const valid = validPastDate(date) && (!measured || value > 0);

  const save = (another: boolean) => {
    if (!valid) return;
    const detail = measured ? `${value} ${unit}`.trim() : "Completed";
    const sameDay = checkInsFor(events, habit.id).filter((e) => localDay(e.at) === date && e.id !== editing?.id);
    if (editing) {
      sameDay.forEach((e) => removeEvent(e.id));
      const at = localDay(editing.at) === date ? editing.at : eventAt(date);
      updateEvent(editing.id, { at, value, detail });
    } else if (sameDay.length) {
      updateEvent(sameDay[0].id, { value, detail });
      sameDay.slice(1).forEach((e) => removeEvent(e.id));
    } else {
      record({
        category: "habit",
        habitId: habit.id,
        title: habit.name,
        detail,
        value,
        unit: measured ? unit : undefined,
        goalId: habit.goalId,
        origin: "habit",
        at: eventAt(date),
      });
    }
    if (another) {
      setAdded((n) => n + 1);
      setDate((d) => shiftDate(d, -1));
    } else onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">
            {editing ? "Edit completion" : "Add a past completion"}
          </DialogTitle>
          <DialogDescription>Saved on the day you did it, so your history and weekly count stay accurate.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <EventDateField id="habit-date" date={date} onDateChange={setDate} label="Date completed" />
          {measured ? (
            <div className="space-y-1.5">
              <Label htmlFor="habit-amount" className="text-xs text-muted-foreground">How much did you do?</Label>
              <div className="flex items-center gap-2">
                <Input id="habit-amount" type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-32 rounded-xl" />
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
            </div>
          ) : null}
          {added ? <p className="text-xs text-sage">{added} added. Pick the next date, or close when you're done.</p> : null}
        </div>
        <DialogFooter className="gap-2">
          {editing ? null : (
            <Button variant="secondary" className="rounded-full" disabled={!valid} onClick={() => save(true)}>
              Save and add another
            </Button>
          )}
          <Button className="rounded-full" disabled={!valid} onClick={() => save(false)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

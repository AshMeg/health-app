import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { cn } from "@/lib/utils";

import {
  addHabit,
  habitIcons,
  methodMeta,
  unitSuggestions,
  updateHabit,
  weekdayNames,
  type Habit,
  type HabitFrequency,
  type HabitMethod,
} from "../model";

const chip = (on: boolean) =>
  cn(
    "rounded-full px-3.5 py-1.5 text-sm transition-colors",
    on ? "bg-sage-soft text-foreground ring-1 ring-sage/40" : "bg-muted text-muted-foreground hover:bg-muted/70",
  );

export function HabitDialog({
  open,
  onOpenChange,
  editing,
  defaultGoalId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: Habit;
  defaultGoalId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        {open ? <HabitForm editing={editing} defaultGoalId={defaultGoalId} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function HabitForm({ editing, defaultGoalId, onDone }: { editing?: Habit; defaultGoalId?: string; onDone: () => void }) {
  const { goals } = useGoals();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? habitIcons[0]);
  const [goalId, setGoalId] = useState(editing?.goalId ?? defaultGoalId ?? "");
  const [kind, setKind] = useState<HabitFrequency["kind"]>(editing?.frequency.kind ?? "daily");
  const [times, setTimes] = useState(editing?.frequency.kind === "weekly" ? editing.frequency.times : 3);
  const [days, setDays] = useState<number[]>(editing?.frequency.kind === "custom" ? editing.frequency.days : [1, 3, 6]);
  const [method, setMethod] = useState<HabitMethod>(editing?.method ?? "completion");
  const [target, setTarget] = useState(editing?.target?.toString() ?? "");
  const [unit, setUnit] = useState(editing?.unit ?? "");

  const frequency: HabitFrequency =
    kind === "daily" ? { kind } : kind === "weekly" ? { kind, times: Math.max(1, Math.min(7, times)) } : { kind, days };
  const needsTarget = method !== "completion";
  const valid =
    name.trim() && (!needsTarget || !target || Number(target) > 0) && (method !== "amount" || unit.trim()) && (kind !== "custom" || days.length);

  const save = () => {
    if (!valid) return;
    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      goalId: goalId || undefined,
      frequency,
      method,
      target: needsTarget && Number(target) > 0 ? Number(target) : undefined,
      unit: method === "amount" ? unit.trim() : method === "duration" ? "minutes" : undefined,
    };
    if (editing) updateHabit(editing.id, data);
    else addHabit(data);
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">{editing ? "Edit habit" : "Add a habit"}</DialogTitle>
        <DialogDescription>A repeated behaviour that helps you live or work towards something.</DialogDescription>
      </DialogHeader>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="h-name">Habit name</Label>
          <Input id="h-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Read every evening" />
        </div>
        <div className="space-y-1.5">
          <Label>Icon</Label>
          <div className="flex flex-wrap gap-1.5">
            {habitIcons.map((i) => (
              <button key={i} type="button" onClick={() => setIcon(i)} className={cn("h-9 w-9 rounded-full text-lg", icon === i ? "bg-sage-soft ring-1 ring-sage/40" : "bg-muted/60")} aria-label={`Icon ${i}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>How often?</Label>
          <div className="flex flex-wrap gap-2">
            {(["daily", "weekly", "custom"] as const).map((k) => (
              <button key={k} type="button" className={chip(kind === k)} onClick={() => setKind(k)}>
                {k === "daily" ? "Daily" : k === "weekly" ? "Weekly" : "Custom days"}
              </button>
            ))}
          </div>
          {kind === "weekly" ? (
            <div className="flex items-center gap-2 pt-1 text-sm">
              <Input type="number" min={1} max={7} value={times} onChange={(e) => setTimes(Number(e.target.value))} className="w-20" aria-label="Times a week" />
              times a week
            </div>
          ) : null}
          {kind === "custom" ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {weekdayNames.map((d, i) => (
                <button key={d} type="button" className={chip(days.includes(i))} onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort())}>
                  {d}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>Do you want to record anything extra?</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(methodMeta) as HabitMethod[]).map((m) => (
              <button key={m} type="button" className={chip(method === m)} onClick={() => setMethod(m)}>
                {methodMeta[m].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {method === "completion" ? "You'll simply mark it as complete." : `e.g. ${methodMeta[method].example}`}
          </p>
          {method === "amount" ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Input type="number" min={0} step="any" value={target} onChange={(e) => setTarget(e.target.value)} className="w-24" aria-label="Target amount" placeholder="Target" />
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit, e.g. litres" className="w-40" aria-label="Unit" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unitSuggestions.map((u) => (
                  <button key={u} type="button" className={cn(chip(unit === u), "px-2.5 py-1 text-xs")} onClick={() => setUnit(u)}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {method === "duration" ? (
            <div className="flex items-center gap-2 pt-1 text-sm">
              <Input type="number" min={0} step="any" value={target} onChange={(e) => setTarget(e.target.value)} className="w-24" aria-label="Target duration" placeholder="Target" />
              minutes
            </div>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h-goal">Linked goal (optional)</Label>
          <select id="h-goal" value={goalId} onChange={(e) => setGoalId(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
            <option value="">No goal — just this habit</option>
            {goals.filter((g) => !g.completedAt || g.id === goalId).map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h-desc">Note (optional)</Label>
          <Textarea id="h-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why this matters to you" />
        </div>
        <Button className="w-full rounded-full" disabled={!valid} onClick={save}>
          {editing ? "Save habit" : "Add habit"}
        </Button>
      </div>
    </>
  );
}

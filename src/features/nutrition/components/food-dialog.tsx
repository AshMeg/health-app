import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

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
import { localDate } from "@/features/measurements/model";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { updateEvent } from "@/features/timeline/store";
import type { BloomEvent, MealSlot, MetricKey } from "@/features/timeline/types";
import { cn } from "@/lib/utils";

import { atFor, meals, nutrient, nutrients, type NutrientKey } from "../model";

type Mode = "new" | "edit" | "again";

const empty = () => Object.fromEntries(nutrients.map((n) => [n.key, ""])) as Record<NutrientKey, string>;

function parseAmount(text: string): { quantity?: number; unit?: string; serving?: string } {
  const t = text.trim();
  if (!t) return {};
  const m = t.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?$/);
  if (m) return { quantity: Number(m[1].replace(",", ".")), unit: m[2]?.toLowerCase() };
  return { serving: t };
}

/**
 * Manual food entry: name and calories are required, everything else is
 * whatever the user actually knows. Blank stays unknown, never 0.
 */
export function FoodDialog({
  open,
  onOpenChange,
  source,
  mode = "new",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: BloomEvent | null;
  mode?: Mode;
}) {
  const { record } = useBloomContext();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [values, setValues] = useState(empty);
  const [meal, setMeal] = useState<MealSlot | undefined>();
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    const v = empty();
    if (source) {
      for (const n of nutrients) {
        const x = nutrient(source, n.key);
        if (x !== undefined) v[n.key] = String(Math.round(x * 100) / 100);
      }
      const f = source.food;
      setName(f?.name ?? (source.title !== "Food logged" ? source.title : ""));
      setAmount(f?.quantity !== undefined ? `${f.quantity}${f.unit ? ` ${f.unit}` : ""}` : (f?.serving ?? ""));
      setMeal(f?.meal);
      setNote(source.notes ?? "");
      if (mode === "edit") {
        setDate(localDate(source.at));
        setTime(f?.time ?? "");
      } else {
        setDate(localDate());
        setTime("");
      }
      setMore(nutrients.some((n) => !n.core && v[n.key] !== ""));
    } else {
      setName("");
      setAmount("");
      setMeal(undefined);
      setNote("");
      setDate(localDate());
      setTime("");
      setMore(false);
    }
    setValues(v);
  }, [open, source, mode]);

  const numbers = nutrients.map((n) => {
    const raw = values[n.key].trim().replace(",", ".");
    return { ...n, raw, value: raw === "" ? undefined : Number(raw) };
  });
  const invalid = numbers.some((n) => n.value !== undefined && (!Number.isFinite(n.value) || n.value < 0));
  const calories = numbers[0].value;
  const valid = name.trim().length > 0 && calories !== undefined && !invalid && date.length === 10;

  const submit = () => {
    if (!valid) return;
    const metrics: Partial<Record<MetricKey, number>> = {};
    for (const n of numbers) if (n.value !== undefined) metrics[n.key] = n.value;
    const known = [
      `${Math.round(calories!)} kcal`,
      metrics.protein !== undefined ? `${metrics.protein} g protein` : null,
    ].filter(Boolean);
    const food = {
      name: name.trim().slice(0, 120),
      ...parseAmount(amount.slice(0, 60)),
      meal,
      time: time || undefined,
      provider: source?.food?.provider && mode === "edit" ? source.food.provider : "manual",
      updatedAt: new Date().toISOString(),
    };
    const payload = {
      category: "food" as const,
      title: food.name,
      detail: known.join(" · "),
      value: calories,
      unit: "kcal",
      metrics,
      notes: note.trim().slice(0, 500) || undefined,
      food,
      at: atFor(date, time || undefined),
    };
    if (mode === "edit" && source) {
      const at = localDate(source.at) === date && !time && !source.food?.time ? source.at : payload.at;
      updateEvent(source.id, { ...payload, at });
    } else {
      // "Log again" copies values into a brand-new, independent entry.
      record({ ...payload, source: "manual", origin: "nutrition" });
    }
    onOpenChange(false);
  };

  const field = (key: NutrientKey) => {
    const n = numbers.find((x) => x.key === key)!;
    return (
      <div key={key} className="space-y-1.5">
        <Label htmlFor={`food-${key}`} className="text-xs text-muted-foreground">
          {n.label}
          {key === "calories" ? "" : " (optional)"}
        </Label>
        <div className="relative">
          <Input
            id={`food-${key}`}
            inputMode="decimal"
            value={values[key]}
            placeholder={key === "calories" ? "e.g. 248" : "—"}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            className="rounded-xl pr-12"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
            {n.unit}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">
            {mode === "edit" ? "Edit food" : mode === "again" ? "Log again" : "Log food"}
          </DialogTitle>
          <DialogDescription>Log what you ate and Bloom will add it to your nutrition history.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
            <div className="space-y-1.5">
              <Label htmlFor="food-name" className="text-xs text-muted-foreground">Food name</Label>
              <Input id="food-name" value={name} maxLength={120} placeholder="e.g. Chicken breast" onChange={(e) => setName(e.target.value)} className="rounded-xl" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="food-amount" className="text-xs text-muted-foreground">Amount (optional)</Label>
              <Input id="food-amount" value={amount} maxLength={60} placeholder="150 g, 1 slice" onChange={(e) => setAmount(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">{(["calories", "protein", "carbs", "fat"] as NutrientKey[]).map(field)}</div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Meal (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {meals.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMeal(meal === m.id ? undefined : m.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    meal === m.id ? "bg-sage-soft text-foreground ring-1 ring-sage/40" : "bg-muted/60 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {m.id === "snack" ? "Snack" : m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="food-date" className="text-xs text-muted-foreground">Date</Label>
              <Input id="food-date" type="date" value={date} max={localDate()} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="food-time" className="text-xs text-muted-foreground">Time (optional)</Label>
              <Input id="food-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="rounded-2xl bg-muted/40">
            <button type="button" onClick={() => setMore((m) => !m)} className="flex w-full items-center justify-between px-4 py-3 text-sm">
              More nutrition
              <ChevronDown className={cn("h-4 w-4 transition-transform", more && "rotate-180")} />
            </button>
            {more ? (
              <div className="space-y-3 px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">{(["fibre", "sugar", "satFat", "salt"] as NutrientKey[]).map(field)}</div>
                <div className="space-y-1.5">
                  <Label htmlFor="food-note" className="text-xs text-muted-foreground">Note (optional)</Label>
                  <Input id="food-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="rounded-xl" />
                </div>
              </div>
            ) : null}
          </div>

          {invalid ? <p className="text-sm text-destructive">Numbers can't be negative.</p> : null}
          <p className="text-xs text-muted-foreground">Only a name and calories are needed. Leave anything you don't know blank.</p>

          <DialogFooter>
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="rounded-full px-6" disabled={!valid}>
              {mode === "edit" ? "Save changes" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

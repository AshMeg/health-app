import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Copy, Droplet, Pencil, Plus, Target, Trash2 } from "lucide-react";

import { BackButton } from "@/components/shared/back-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { goalMetricPage } from "@/features/metrics/config";
import { localDate } from "@/features/measurements/model";
import { LogEventDialog } from "@/features/timeline/components/log-event-dialog";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { quickAddSpecs } from "@/features/timeline/quick-add";
import { removeEvent } from "@/features/timeline/store";
import type { BloomEvent } from "@/features/timeline/types";
import { TrendPanel } from "@/features/trends/components/trend-panel";

import { fmt, foodName, meals, nutrient, nutrientLine, nutrients, portionText, totals, useNutritionTargets } from "../model";
import { FoodDialog } from "./food-dialog";

function shiftDay(date: string, by: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + by);
  return localDate(d);
}

function dayLabel(date: string) {
  const today = localDate();
  if (date === today) return "Today";
  if (date === shiftDay(today, -1)) return "Yesterday";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function NutritionPage() {
  const { events } = useBloomContext();
  const { active } = useGoals();
  const targets = useNutritionTargets();
  const [day, setDay] = useState(localDate());
  const [dialog, setDialog] = useState<{ mode: "new" | "edit" | "again"; source?: BloomEvent } | null>(null);
  const [deleting, setDeleting] = useState<BloomEvent | null>(null);
  const [waterOpen, setWaterOpen] = useState(false);

  const allFood = useMemo(() => events.filter((e) => e.category === "food"), [events]);
  const foods = useMemo(
    () => allFood.filter((e) => localDate(e.at) === day).sort((a, b) => a.at.localeCompare(b.at)),
    [allFood, day],
  );
  const water = useMemo(
    () => events.filter((e) => e.category === "water" && localDate(e.at) === day).reduce((n, e) => n + (Number(e.metrics?.water) || 0), 0),
    [events, day],
  );
  const dayTotals = totals(foods);
  const relatedGoals = active.filter((g) => g.tracking.method === "automatic" && goalMetricPage[g.tracking.metric] === "nutrition");

  const grouped = [...meals, { id: undefined, label: "Not assigned to a meal" }]
    .map((m) => ({ ...m, items: foods.filter((f) => (f.food?.meal ?? undefined) === m.id) }))
    .filter((g) => g.items.length);

  // Macro split only from foods where protein, carbs and fat are all known.
  const complete = foods.filter((f) => ["protein", "carbs", "fat"].every((k) => nutrient(f, k as "protein") !== undefined));
  const split = complete.length
    ? (() => {
        const p = complete.reduce((n, f) => n + nutrient(f, "protein")! * 4, 0);
        const c = complete.reduce((n, f) => n + nutrient(f, "carbs")! * 4, 0);
        const fa = complete.reduce((n, f) => n + nutrient(f, "fat")! * 9, 0);
        const sum = p + c + fa;
        return sum ? { p: p / sum, c: c / sum, f: fa / sum } : null;
      })()
    : null;

  const waterSpec = quickAddSpecs.find((s) => s.id === "water") ?? null;
  const isToday = day === localDate();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-20">
      <BackButton fallbackTo="/dashboard" fallbackLabel="Dashboard" />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">Nutrition</h1>
          <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">What you've eaten, and how it adds up.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full px-5" onClick={() => setDialog({ mode: "new" })}>
            <Plus className="h-4 w-4" /> Log food
          </Button>
          <Button variant="secondary" className="rounded-full px-5 shadow-none" onClick={() => setWaterOpen(true)}>
            <Droplet className="h-4 w-4" /> Water
          </Button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Previous day" onClick={() => setDay(shiftDay(day, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[12rem] text-center font-display text-xl font-medium">{dayLabel(day)}</h2>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Next day" disabled={isToday} onClick={() => setDay(shiftDay(day, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {!allFood.length ? (
          <Card className="rounded-3xl border-transparent bg-card shadow-none">
            <CardContent className="space-y-3 p-10 text-center">
              <p className="font-display text-xl font-medium">Start with what you know.</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Log your food manually, or connect a food service later to make logging easier.
              </p>
              <Button className="rounded-full px-6" onClick={() => setDialog({ mode: "new" })}>Log food</Button>
            </CardContent>
          </Card>
        ) : !foods.length ? (
          <Card className="rounded-3xl border-transparent bg-card shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nothing logged for this day yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <Card key={g.label} className="rounded-3xl border-transparent bg-card shadow-none">
                <CardContent className="px-6 py-5">
                  <h3 className="mb-2 text-sm font-medium text-foreground/80">{g.label}</h3>
                  <ul className="divide-y divide-border/50">
                    {g.items.map((f) => (
                      <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="font-medium">{foodName(f)}</p>
                          <p className="text-xs text-muted-foreground">
                            {[portionText(f), f.food?.time].filter(Boolean).join(" · ")}
                          </p>
                          <p className="mt-1 text-sm text-foreground/80">{nutrientLine(f) || "No nutrition recorded"}</p>
                          {f.notes ? <p className="mt-1 text-xs text-muted-foreground">{f.notes}</p> : null}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Log again" title="Log again" onClick={() => setDialog({ mode: "again", source: f })}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Edit" onClick={() => setDialog({ mode: "edit", source: f })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Delete" onClick={() => setDeleting(f)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {foods.length || water ? (
        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground/80">Daily total</h2>
          <Card className="rounded-3xl border-transparent bg-card shadow-none">
            <CardContent className="grid gap-x-8 gap-y-5 p-7 sm:grid-cols-2">
              {nutrients.map((n) => {
                const t = dayTotals.find((x) => x.key === n.key)!;
                if (!t.recorded && !n.core) return null;
                const target = targets[n.key as keyof typeof targets];
                const partial = t.recorded > 0 && t.recorded < t.of;
                return (
                  <div key={n.key} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-muted-foreground">{n.label}</span>
                      <span className="text-sm font-medium">
                        {t.recorded ? fmt(t.total, n.decimals) : "—"}
                        {target ? ` / ${fmt(target, 0)}` : ""} {n.unit}
                        {partial ? <span className="font-normal text-muted-foreground"> logged</span> : null}
                      </span>
                    </div>
                    {target && t.recorded ? (
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-sage" style={{ width: `${Math.min(100, (t.total / target) * 100)}%` }} />
                      </div>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {partial
                        ? `From ${t.recorded} of ${t.of} foods — the others have no ${n.label.toLowerCase()} recorded.`
                        : !t.recorded
                          ? "Not recorded for these foods."
                          : target
                            ? t.total >= target
                              ? t.total > target * 1.05 ? "Above target" : "Target reached"
                              : `${fmt(target - t.total, n.decimals)} ${n.unit} remaining`
                            : null}
                    </p>
                  </div>
                );
              })}
              {water ? (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Water</span>
                  <span className="text-sm font-medium">{fmt(water, 1)} L</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {split ? (
            <Card className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="space-y-3 p-7">
                <h3 className="text-sm font-medium text-foreground/80">Where your calories came from</h3>
                <div className="flex h-3 overflow-hidden rounded-full">
                  <div className="bg-sage" style={{ width: `${split.p * 100}%` }} />
                  <div className="bg-stone" style={{ width: `${split.c * 100}%` }} />
                  <div className="bg-lavender" style={{ width: `${split.f * 100}%` }} />
                </div>
                <p className="text-sm">
                  Protein {Math.round(split.p * 100)}% · Carbohydrates {Math.round(split.c * 100)}% · Fat {Math.round(split.f * 100)}%
                </p>
                {complete.length < foods.length ? (
                  <p className="text-xs text-muted-foreground">
                    Based on {complete.length} of {foods.length} foods — only those with protein, carbs and fat all recorded.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">Over time</h2>
        <TrendPanel trends={["calories", "protein", "carbs", "fat", "fibre", "sugar", "satFat", "salt", "water"]} />
      </section>

      {relatedGoals.length ? (
        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground/80">Related goals</h2>
          <div className="flex flex-wrap gap-2.5">
            {relatedGoals.map((g) => (
              <Link key={g.id} to="/goals/$goalId" params={{ goalId: g.id }} className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-4 py-2 text-sm hover:bg-sage-soft/70">
                <Target className="h-3.5 w-3.5 text-sage" />
                {g.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-sm leading-relaxed text-muted-foreground">
        Everything here is what you've logged yourself.{" "}
        <Link to="/analytics" className="underline-offset-4 hover:underline">Patterns across metrics live in Analytics.</Link>
      </p>

      <FoodDialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)} mode={dialog?.mode} source={dialog?.source ?? null} />
      <LogEventDialog spec={waterSpec} open={waterOpen} onOpenChange={setWaterOpen} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting ? foodName(deleting) : "this food"}?</AlertDialogTitle>
            <AlertDialogDescription>Only this food is removed. The rest of the day stays as it is.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                if (deleting) removeEvent(deleting.id);
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

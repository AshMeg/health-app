import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { BloomEvent, MealSlot, MetricKey } from "@/features/timeline/types";

/**
 * Bloom's normalised nutrition entry. Manual entries today and future food
 * databases both become a `food` BloomEvent: the food itself in `event.food`,
 * nutrients in `event.metrics`. An unknown nutrient is simply absent — it is
 * never stored or counted as 0.
 */

export type NutrientKey = "calories" | "protein" | "carbs" | "fat" | "fibre" | "sugar" | "satFat" | "salt";

export const nutrients: { key: NutrientKey; label: string; short: string; unit: string; decimals: number; core: boolean }[] = [
  { key: "calories", label: "Calories", short: "kcal", unit: "kcal", decimals: 0, core: true },
  { key: "protein", label: "Protein", short: "protein", unit: "g", decimals: 0, core: true },
  { key: "carbs", label: "Carbohydrates", short: "carbs", unit: "g", decimals: 0, core: true },
  { key: "fat", label: "Fat", short: "fat", unit: "g", decimals: 0, core: true },
  { key: "fibre", label: "Fibre", short: "fibre", unit: "g", decimals: 0, core: false },
  { key: "sugar", label: "Sugar", short: "sugar", unit: "g", decimals: 0, core: false },
  { key: "satFat", label: "Saturated fat", short: "sat fat", unit: "g", decimals: 1, core: false },
  { key: "salt", label: "Salt", short: "salt", unit: "g", decimals: 1, core: false },
];

export const meals: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snacks" },
  { id: "other", label: "Other" },
];

export function isFood(e: BloomEvent) {
  return e.category === "food";
}

/** Reads one nutrient; undefined means "not recorded". Sodium is converted to salt only when salt itself is missing. */
export function nutrient(e: BloomEvent, key: NutrientKey): number | undefined {
  const m = e.metrics ?? {};
  const v = m[key as MetricKey];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (key === "salt" && typeof m.sodium === "number") return m.sodium * 2.5;
  return undefined;
}

/** Older entries only had calories/protein and no name — they stay valid. */
export function foodName(e: BloomEvent) {
  return e.food?.name || (e.title && e.title !== "Food logged" ? e.title : "Food");
}

export function portionText(e: BloomEvent) {
  const f = e.food;
  if (!f) return "";
  if (f.quantity !== undefined) return `${f.quantity}${f.unit ? (/^(g|kg|ml|l)$/i.test(f.unit) ? "" : " ") + f.unit : ""}`;
  return f.serving ?? "";
}

export function fmt(v: number, decimals: number) {
  return v.toLocaleString("en-GB", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}

export type NutrientTotal = { key: NutrientKey; total: number; recorded: number; of: number };

/** Totals only from values actually recorded; `recorded < of` means the total is partial. */
export function totals(foods: BloomEvent[]): NutrientTotal[] {
  return nutrients.map(({ key }) => {
    let total = 0;
    let recorded = 0;
    for (const f of foods) {
      const v = nutrient(f, key);
      if (v !== undefined) {
        total += v;
        recorded += 1;
      }
    }
    return { key, total, recorded, of: foods.length };
  });
}

/** Detail line for a food, only listing what's known. */
export function nutrientLine(e: BloomEvent) {
  return nutrients
    .filter((n) => n.core)
    .flatMap((n) => {
      const v = nutrient(e, n.key);
      if (v === undefined) return [];
      return [n.key === "calories" ? `${fmt(v, 0)} kcal` : `${fmt(v, n.decimals)} g ${n.short}`];
    })
    .join(" · ");
}

export type NutritionTargets = Partial<Record<"calories" | "protein" | "carbs" | "fat", number>>;

/** The daily targets saved on the user's profile, if any. */
export function useNutritionTargets() {
  const [targets, setTargets] = useState<NutritionTargets>({});
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("calorie_target, protein_target, carb_target, fat_target")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!live || !data) return;
      setTargets({
        calories: data.calorie_target ?? undefined,
        protein: data.protein_target ?? undefined,
        carbs: data.carb_target ?? undefined,
        fat: data.fat_target ?? undefined,
      });
    })();
    return () => {
      live = false;
    };
  }, []);
  return targets;
}

/** Stores the eaten-at time: the chosen date, at the chosen time or midday. */
export function atFor(date: string, time?: string) {
  if (time) return new Date(`${date}T${time}:00`).toISOString();
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  return date === local ? now.toISOString() : new Date(`${date}T12:00:00`).toISOString();
}

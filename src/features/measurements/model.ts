import { useCallback, useEffect, useState } from "react";

import { registerMeasureTrend } from "@/features/trends/series";
import type { BloomEvent } from "@/features/timeline/types";

/**
 * Body measurements. Each reading is one shared BloomEvent (category
 * "measurement", `measure` = which one, `metrics.measurement` = value), so the
 * same record feeds this page, goals, trends and Analytics — never copied.
 */

export type MeasureDef = { key: string; label: string; unit: string; custom?: boolean };

export const standardMeasures: MeasureDef[] = [
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "thigh", label: "Thigh", unit: "cm" },
  { key: "upper-arm", label: "Upper arm", unit: "cm" },
  { key: "calf", label: "Calf", unit: "cm" },
  { key: "neck", label: "Neck", unit: "cm" },
];

for (const m of standardMeasures) registerMeasureTrend(m.key, m.label, m.unit);

const CUSTOM_KEY = "bloom.measurements.custom.v1";
const TRACKED_KEY = "bloom.measurements.tracked.v1";

/** Older measurement events had no key — they were always waist. */
export const measureOf = (e: BloomEvent) => e.measure ?? "waist";

export function slug(label: string) {
  return `custom-${label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* kept for this session only */
  }
}

export function useMeasures(events: BloomEvent[]) {
  const [custom, setCustom] = useState<MeasureDef[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    const c = read<MeasureDef[]>(CUSTOM_KEY, []);
    c.forEach((m) => registerMeasureTrend(m.key, m.label, m.unit));
    setCustom(c);
    setChosen(read<string[]>(TRACKED_KEY, []));
  }, []);

  const all = [...standardMeasures, ...custom];
  const withData = new Set(events.filter((e) => e.category === "measurement").map(measureOf));
  // You track what you've chosen plus anything you've actually logged.
  const tracked = all.filter((m) => chosen.includes(m.key) || withData.has(m.key));

  const toggle = useCallback((key: string) => {
    setChosen((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      save(TRACKED_KEY, next);
      return next;
    });
  }, []);

  const addCustom = useCallback((label: string, unit: string): MeasureDef => {
    const def: MeasureDef = { key: slug(label), label: label.trim(), unit: unit.trim() || "cm", custom: true };
    registerMeasureTrend(def.key, def.label, def.unit);
    setCustom((prev) => {
      const next = [...prev.filter((m) => m.key !== def.key), def];
      save(CUSTOM_KEY, next);
      return next;
    });
    setChosen((prev) => {
      const next = prev.includes(def.key) ? prev : [...prev, def.key];
      save(TRACKED_KEY, next);
      return next;
    });
    return def;
  }, []);

  const find = (key: string) => all.find((m) => m.key === key);

  return { all, tracked, withData, chosen, toggle, addCustom, find };
}

/** ISO timestamp for a picked date: now if today, midday otherwise. */
export function atForDate(date: string) {
  const today = new Date();
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  if (date === local) return today.toISOString();
  return new Date(`${date}T12:00:00`).toISOString();
}

export function localDate(at: string | Date = new Date()) {
  const d = typeof at === "string" ? new Date(at) : at;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

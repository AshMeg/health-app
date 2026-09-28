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

// One shared store so every screen sees a new custom measurement at once.
let customStore: MeasureDef[] = [];
let chosenStore: string[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load() {
  if (loaded) return;
  loaded = true;
  customStore = read<MeasureDef[]>(CUSTOM_KEY, []);
  customStore.forEach((m) => registerMeasureTrend(m.key, m.label, m.unit));
  chosenStore = read<string[]>(TRACKED_KEY, []);
}

export function useMeasures(events: BloomEvent[]) {
  const [, force] = useState(0);
  useEffect(() => {
    load();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);

  const custom = customStore;
  const chosen = chosenStore;
  const all = [...standardMeasures, ...custom];
  const withData = new Set(events.filter((e) => e.category === "measurement").map(measureOf));
  // You track what you've chosen plus anything you've actually logged.
  const tracked = all.filter((m) => chosen.includes(m.key) || withData.has(m.key));

  const toggle = useCallback((key: string) => {
    chosenStore = chosenStore.includes(key) ? chosenStore.filter((k) => k !== key) : [...chosenStore, key];
    save(TRACKED_KEY, chosenStore);
    emit();
  }, []);

  const addCustom = useCallback((label: string, unit: string): MeasureDef => {
    const def: MeasureDef = { key: slug(label), label: label.trim(), unit: unit.trim() || "cm", custom: true };
    registerMeasureTrend(def.key, def.label, def.unit);
    customStore = [...customStore.filter((m) => m.key !== def.key), def];
    if (!chosenStore.includes(def.key)) chosenStore = [...chosenStore, def.key];
    save(CUSTOM_KEY, customStore);
    save(TRACKED_KEY, chosenStore);
    emit();
    return def;
  }, []);

  const find = (key: string) =>
    [...standardMeasures, ...customStore].find((m) => m.key === key);

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

import { useEffect, useState } from "react";

import type { BloomEvent } from "@/features/timeline/types";

export type MoodOption = { value: string; emoji: string };

/** The core seven — always shown first. */
export const coreMoods: MoodOption[] = [
  { value: "Great", emoji: "😊" },
  { value: "Good", emoji: "🙂" },
  { value: "Calm", emoji: "😌" },
  { value: "Okay", emoji: "😐" },
  { value: "Low", emoji: "🙁" },
  { value: "Sad", emoji: "😔" },
  { value: "Stressed", emoji: "😣" },
];

/** Revealed on request so the picker never becomes a wall of emotions. */
export const moreMoods: MoodOption[] = [
  { value: "Happy", emoji: "😄" },
  { value: "Excited", emoji: "🤩" },
  { value: "Content", emoji: "☺️" },
  { value: "Grateful", emoji: "🙏" },
  { value: "Energised", emoji: "⚡" },
  { value: "Motivated", emoji: "💪" },
  { value: "Tired", emoji: "🥱" },
  { value: "Drained", emoji: "🪫" },
  { value: "Overwhelmed", emoji: "😵‍💫" },
  { value: "Anxious", emoji: "😟" },
  { value: "Frustrated", emoji: "😤" },
  { value: "Irritated", emoji: "😒" },
  { value: "Lonely", emoji: "🫥" },
];

export const allPresetMoods = [...coreMoods, ...moreMoods];

export const moodEmoji = (m?: string) => allPresetMoods.find((x) => x.value === m)?.emoji ?? "💭";

/** A daily mood lives in metrics.mood; extra moments in metrics.moodObservation. */
export const isDailyMood = (e: BloomEvent) => e.category === "mood" && typeof e.metrics?.mood === "string";
export const isMoodObservation = (e: BloomEvent) =>
  e.category === "mood" && typeof e.metrics?.moodObservation === "string";

const KEY = "bloom.moods.custom.v1";
let custom: string[] = [];
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(raw)) custom = raw.filter((x) => typeof x === "string");
  } catch {
    custom = [];
  }
}

/** Custom feelings are stored exactly as the user typed them — never reinterpreted. */
export function addCustomMood(label: string) {
  const v = label.trim();
  if (!v) return;
  load();
  const known = [...allPresetMoods.map((m) => m.value), ...custom].some((x) => x.toLowerCase() === v.toLowerCase());
  if (known) return;
  custom = [...custom, v];
  window.localStorage.setItem(KEY, JSON.stringify(custom));
  subs.forEach((f) => f());
}

export function removeCustomMood(label: string) {
  load();
  custom = custom.filter((x) => x !== label);
  window.localStorage.setItem(KEY, JSON.stringify(custom));
  subs.forEach((f) => f());
}

export function useCustomMoods(events: BloomEvent[]) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    load();
    const sync = () => setList([...custom]);
    sync();
    subs.add(sync);
    return () => {
      subs.delete(sync);
    };
  }, []);
  // Anything already logged that isn't a preset stays selectable too.
  const logged = events
    .map((e) => (e.category === "mood" ? String(e.metrics?.mood ?? e.metrics?.moodObservation ?? "") : ""))
    .filter((v) => v && !allPresetMoods.some((m) => m.value === v));
  return [...new Set([...list, ...logged])];
}

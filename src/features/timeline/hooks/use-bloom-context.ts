import { useCallback, useMemo } from "react";

import { useGoals, recordEventForGoals } from "@/features/goals/hooks/use-goals";
import { buildDailySnapshot, buildRecentSnapshots, isoDate } from "../snapshot";
import type { NewEvent } from "../store";
import { relatedMetrics } from "../relationships";
import { eventCategoryMeta, type BloomEvent, type MetricKey } from "../types";
import { useTimeline } from "./use-timeline";

/**
 * Bloom Context — the one place a screen asks "what do we know, and what
 * changed today?". Recording anything through `record` writes the shared
 * event, updates any goal it relates to, and every subscriber re-renders.
 */
export function useBloomContext() {
  const { events, hydrated, record: log } = useTimeline();
  const goals = useGoals();

  const today = useMemo(() => buildDailySnapshot(events), [events]);
  const recent = useMemo(() => buildRecentSnapshots(events, 7), [events]);
  const yesterday = recent[1];

  /** Records an event and lets every connected goal respond to it. */
  const record = useCallback(
    (input: NewEvent) => {
      const event = log(input);
      recordEventForGoals(event);
      return event;
    },
    [log],
  );

  /** Everything Bloom would consider when explaining a metric right now. */
  const contextFor = useCallback(
    (metric: MetricKey) => ({
      metric,
      related: relatedMetrics(metric),
      today,
      recent,
    }),
    [today, recent],
  );

  /** A short, plain-language read of what has changed today. */
  const whatChangedToday = useMemo(() => summarise(today.events), [today.events]);

  return {
    events,
    hydrated,
    today,
    yesterday,
    recent,
    goals,
    record,
    contextFor,
    whatChangedToday,
  };
}

function summarise(events: BloomEvent[]): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const event of events) {
    const label = eventCategoryMeta[event.category].label;
    if (seen.has(label)) continue;
    seen.add(label);
    lines.push(event.detail ? `${label}: ${event.detail}` : event.title);
    if (lines.length === 4) break;
  }
  return lines;
}

import type { ComponentType } from "react";

import type { BloomAccent } from "@/features/today/types";
import { AutomaticPanel } from "./automatic-panel";
import { CheckablePanel } from "./checkable-panel";
import { ReflectionPanel } from "./reflection-panel";
import { RepetitionPanel } from "./repetition-panel";
import { StreakPanel } from "./streak-panel";
import type { GoalTracking, TrackingMethod } from "../../types";

export type TrackingPanelProps = {
  tracking: GoalTracking;
  accent?: BloomAccent;
  onChange: (next: GoalTracking) => void;
};

export type TrackingDefinition = {
  label: string;
  description: string;
  examples: string;
  /** Heading used above the panel on the goal detail page. */
  panelTitle: string;
  /** One-line summary shown on goal cards. */
  summary: (tracking: GoalTracking) => string;
  /** Whether a plain progress bar makes sense alongside the panel. */
  showsProgressBar: boolean;
  Panel: ComponentType<TrackingPanelProps>;
};

/**
 * The single place tracking methods are registered. To add a new method:
 * add it to `TrackingMethod`, give it a tracking shape and a progress rule in
 * types.ts, then register its panel here.
 */
export const trackingRegistry: Record<TrackingMethod, TrackingDefinition> = {
  automatic: {
    label: "Automatic tracking",
    description: "Bloom calculates progress from the data you already log or sync.",
    examples: "Lose 5 kg · Drink 2.5 L water · Walk 8,000 steps",
    panelTitle: "Progress",
    showsProgressBar: true,
    summary: (t) =>
      t.method === "automatic"
        ? `${t.current} of ${t.target} ${t.unit}`.trim()
        : "Tracked automatically",
    Panel: ({ tracking, accent }) =>
      tracking.method === "automatic" ? (
        <AutomaticPanel tracking={tracking} accent={accent} />
      ) : null,
  },
  checklist: {
    label: "Checklist completion",
    description: "A short list of things to tick off, one by one.",
    examples: "Go on 2 dates · Book a GP appointment · Go to therapy",
    panelTitle: "Checklist",
    showsProgressBar: false,
    summary: (t) =>
      t.method === "checklist"
        ? `${t.items.filter((i) => i.done).length} of ${t.items.length} ticked off`
        : "Checklist",
    Panel: ({ tracking, accent, onChange }) =>
      tracking.method === "checklist" ? (
        <CheckablePanel
          tracking={tracking}
          accent={accent}
          onChange={onChange}
          addLabel="Add something to tick off"
          emptyLabel="Nothing on the list yet — add the first thing below."
        />
      ) : null,
  },
  repetition: {
    label: "Repetition",
    description: "Counts each time you do it, towards a total.",
    examples: "Journal 20 times · Swim 8 sessions · Meditate 50 times",
    panelTitle: "Times completed",
    showsProgressBar: false,
    summary: (t) =>
      t.method === "repetition" ? `${t.completed} / ${t.target} completed` : "Repetitions",
    Panel: ({ tracking, accent, onChange }) =>
      tracking.method === "repetition" ? (
        <RepetitionPanel tracking={tracking} accent={accent} onChange={onChange} />
      ) : null,
  },
  streak: {
    label: "Streak",
    description: "Rewards consistency — keep the run of days going.",
    examples: "Drink water every day · Read daily · Stretch every morning",
    panelTitle: "Your streak",
    showsProgressBar: false,
    summary: (t) =>
      t.method === "streak"
        ? `${t.current} day streak · longest ${t.longest}`
        : "Streak",
    Panel: ({ tracking, accent, onChange }) =>
      tracking.method === "streak" ? (
        <StreakPanel tracking={tracking} accent={accent} onChange={onChange} />
      ) : null,
  },
  milestone: {
    label: "Milestones",
    description: "Break a bigger achievement into steps you can tick off.",
    examples: "Run a half marathon · Learn to swim · Move house",
    panelTitle: "Progress",
    showsProgressBar: true,
    // The steps themselves live on the goal, so the Milestones card renders them.
    summary: () => "Tracked by milestones",
    Panel: () => null,
  },

  reflection: {
    label: "Reflection",
    description: "No numbers — Bloom asks how it's going and you answer in your own words.",
    examples: "Be kinder to myself · Feel less stressed · Build confidence",
    panelTitle: "Reflections",
    showsProgressBar: false,
    summary: (t) =>
      t.method === "reflection"
        ? t.reflections.length
          ? `${t.reflections.length} reflection${t.reflections.length === 1 ? "" : "s"} so far`
          : "No reflections yet"
        : "Reflections",
    Panel: ({ tracking, onChange }) =>
      tracking.method === "reflection" ? (
        <ReflectionPanel tracking={tracking} onChange={onChange} />
      ) : null,
  },
};

export const trackingMethods = Object.keys(trackingRegistry) as TrackingMethod[];

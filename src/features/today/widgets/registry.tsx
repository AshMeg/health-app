import type { WidgetDefinition } from "../types";
import {
  SnapshotFocus,
  SnapshotLogStatus,
  SnapshotSummary,
  TodayInsight,
  TodayTimelineWidget,
} from "../components/connected-widgets";
import { GoalsWidget } from "../components/goal-progress-card";
import { QuickAddBar } from "../components/quick-add-bar";
import { UpcomingWidget } from "../components/upcoming-widget";

/**
 * Single source of truth for Today's widgets.
 *
 * To add a widget: append a definition here. Ordering, hiding and restoring
 * are handled generically by `useDashboardLayout` + `DashboardGrid`, and a
 * saved layout automatically picks up new entries.
 */
export const todayWidgets: WidgetDefinition[] = [
  {
    id: "insight",
    to: "/analytics",
    linkLabel: "Open analytics",
    title: "Today's insight",
    summary: "One observation drawn from your recent data.",
    span: "full",
    render: () => <TodayInsight />,
  },
  {
    id: "goals",
    to: "/goals",
    linkLabel: "Open goals",
    title: "Your goals",
    summary: "Active goals with progress towards each target.",
    span: "full",
    locked: true,
    render: () => <GoalsWidget />,
  },
  {
    id: "summary",
    title: "Today at a glance",
    summary: "Latest numbers across your daily metrics.",
    span: "full",
    render: () => <SnapshotSummary />,
  },
  {
    id: "focus",
    to: "/goals",
    linkLabel: "Open goals",
    title: "Today's focus",
    summary: "A few small actions that support your goals.",
    span: "half",
    render: () => <SnapshotFocus />,
  },
  {
    id: "missing-data",
    title: "Still to log",
    summary: "What's already in, and what's waiting for you.",
    span: "half",
    render: () => <SnapshotLogStatus />,
  },
  {
    id: "quick-add",
    title: "Quick add",
    summary: "One tap logging for the things you track most.",
    span: "full",
    render: () => <QuickAddBar />,
  },
  {
    id: "timeline",
    title: "Today's activity",
    summary: "Everything that happened today, in order.",
    span: "full",
    render: () => <TodayTimelineWidget />,
  },


  /* ---- Reserved for upcoming Bloom modules. Hidden until they have data. ---- */
  {
    id: "cycle",
    to: "/cycle",
    linkLabel: "Open cycle",
    title: "Cycle",
    summary: "Where you are in your cycle and what's typical for this phase.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget
        title="Cycle"
        summary="Phase, day count and cycle-aware guidance will appear here."
      />
    ),
  },
  {
    id: "upcoming-period",
    to: "/cycle",
    linkLabel: "Open cycle",
    title: "Upcoming period",
    summary: "A gentle heads up before your next predicted period.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget
        title="Upcoming period"
        summary="Predicted dates and how to plan training around them."
      />
    ),
  },
  {
    id: "garden",
    to: "/garden",
    linkLabel: "Open garden",
    title: "Garden",
    summary: "Your consistency, grown as a living garden.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget title="Garden" summary="A quiet visual of how steadily you've shown up." />
    ),
  },
  {
    id: "weight-trend",
    to: "/weight",
    linkLabel: "Open weight",
    title: "Weight trend",
    summary: "Your smoothed weight direction over time.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget title="Weight trend" summary="Trend line and weekly rate of change." />
    ),
  },
  {
    id: "mood",
    to: "/recovery",
    linkLabel: "Open recovery",
    title: "Mood",
    summary: "How you've been feeling lately.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => <UpcomingWidget title="Mood" summary="Daily mood check-ins and their patterns." />,
  },
  {
    id: "macros",
    to: "/nutrition",
    linkLabel: "Open nutrition",
    title: "Macros",
    summary: "Protein, carbs and fat against your targets.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget title="Macros" summary="Today's macro split next to your targets." />
    ),
  },
  {
    id: "hrv",
    to: "/recovery",
    linkLabel: "Open recovery",
    title: "HRV",
    summary: "Heart rate variability and your baseline.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget title="HRV" summary="Nightly HRV compared with your personal baseline." />
    ),
  },
  {
    id: "sleep",
    to: "/sleep",
    linkLabel: "Open sleep",
    title: "Sleep",
    summary: "Duration, timing and quality of last night.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget title="Sleep" summary="Last night's stages, timing and consistency." />
    ),
  },
  {
    id: "recovery",
    to: "/recovery",
    linkLabel: "Open recovery",
    title: "Recovery",
    summary: "How ready your body is for load today.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget title="Recovery" summary="A readiness read across sleep, HRV and training." />
    ),
  },
  {
    id: "weekly-reflection",
    title: "Weekly reflection",
    summary: "A short written check-in at the end of each week.",
    span: "full",
    upcoming: true,
    defaultHidden: true,
    render: () => (
      <UpcomingWidget
        title="Weekly reflection"
        summary="Prompts to look back on the week in your own words."
      />
    ),
  },
];


import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import {
  goals,
  logStatus,
  quickAddItems,
  timelinePreview,
  todayFocus,
  todayInsight,
  todaySummary,
} from "../mock-data";
import type { WidgetDefinition } from "../types";
import { FocusList } from "../components/focus-list";
import { GoalsWidget } from "../components/goal-progress-card";
import { InsightHeroCard } from "../components/insight-hero-card";
import { LogStatusList } from "../components/log-status-list";
import { QuickAddBar } from "../components/quick-add-bar";
import { SummaryGrid } from "../components/summary-stat-card";
import { TimelinePreview } from "../components/timeline-preview";
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
    title: "Today's insight",
    summary: "One observation drawn from your recent data.",
    span: "full",
    render: () => (
      <InsightHeroCard
        headline={todayInsight.headline}
        body={todayInsight.body}
        confidence={todayInsight.confidence}
      />
    ),
  },
  {
    id: "goals",
    title: "Your goals",
    summary: "Active goals with progress towards each target.",
    span: "full",
    locked: true,
    render: () => <GoalsWidget goals={goals} />,
  },
  {
    id: "summary",
    title: "Today at a glance",
    summary: "Latest numbers across your daily metrics.",
    span: "full",
    render: () => <SummaryGrid stats={todaySummary} />,
  },
  {
    id: "focus",
    title: "Today's focus",
    summary: "A few small actions that support your goals.",
    span: "half",
    render: () => <FocusList items={todayFocus} />,
  },
  {
    id: "missing-data",
    title: "Still to log",
    summary: "What's already in, and what's waiting for you.",
    span: "half",
    render: () => <LogStatusList items={logStatus} />,
  },
  {
    id: "quick-add",
    title: "Quick add",
    summary: "One tap logging for the things you track most.",
    span: "full",
    render: () => <QuickAddBar items={quickAddItems} />,
  },
  {
    id: "timeline",
    title: "Timeline",
    summary: "Everything that happened today, in order.",
    span: "full",
    render: () => <TimelinePreview events={timelinePreview} />,
  },

  /* ---- Reserved for upcoming Bloom modules. Hidden until they have data. ---- */
  {
    id: "cycle",
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
    title: "Mood",
    summary: "How you've been feeling lately.",
    span: "half",
    upcoming: true,
    defaultHidden: true,
    render: () => <UpcomingWidget title="Mood" summary="Daily mood check-ins and their patterns." />,
  },
  {
    id: "macros",
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

/** Optional per-widget footer action rendered by the grid. */
export const widgetActions: Partial<Record<string, React.ReactNode>> = {
  timeline: (
    <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground">
      <Link to="/journal">
        View timeline
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
  ),
};

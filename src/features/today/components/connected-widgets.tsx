import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { formatSleep } from "@/features/timeline/snapshot";
import { eventCategoryMeta } from "@/features/timeline/types";
import { TimelineRow } from "@/features/timeline/components/timeline-feed";

import type { LogStatusItem, SummaryStat } from "../types";
import { FocusList } from "./focus-list";
import { InsightHeroCard } from "./insight-hero-card";
import { LogStatusList } from "./log-status-list";
import { SummaryGrid } from "./summary-stat-card";

/**
 * The Today widgets that read from Bloom's shared data rather than fixtures.
 * Each one derives everything it shows from the daily snapshot, so any log
 * made anywhere in Bloom changes what appears here.
 */

export function SnapshotSummary() {
  const { today, yesterday } = useBloomContext();

  const stats: SummaryStat[] = [];
  const push = (stat: SummaryStat | null) => {
    if (stat) stats.push(stat);
  };

  push(
    today.weightKg
      ? {
          id: "weight",
          label: "Weight",
          to: "/weight",
          value: String(today.weightKg),
          unit: "kg",
          detail: yesterday?.weightKg
            ? `${today.weightKg > yesterday.weightKg ? "+" : ""}${(
                Math.round((today.weightKg - yesterday.weightKg) * 10) / 10
              ).toFixed(1)} vs yesterday`
            : undefined,
        }
      : null,
  );
  push(
    today.cycleDay ? { id: "cycle", label: "Cycle day", value: String(today.cycleDay), to: "/cycle" } : null,
  );
  push(
    today.sleepMinutes
      ? { id: "sleep", label: "Sleep", value: formatSleep(today.sleepMinutes) ?? "", to: "/sleep" }
      : null,
  );
  push(
    today.recoveryPercent
      ? {
          id: "recovery",
          label: "Recovery",
          to: "/recovery",
          value: String(today.recoveryPercent),
          unit: "%",
          detail: today.hrv ? `HRV ${today.hrv} ms` : undefined,
        }
      : null,
  );
  push(
    today.proteinG ? { id: "protein", label: "Protein", value: String(today.proteinG), unit: "g", to: "/nutrition" } : null,
  );
  push(
    today.caloriesKcal
      ? {
          id: "calories",
          label: "Calories",
          to: "/nutrition",
          value: today.caloriesKcal.toLocaleString(),
          unit: "kcal",
        }
      : null,
  );
  push(today.steps ? { id: "steps", label: "Steps", value: today.steps.toLocaleString(), to: "/training" } : null);
  push(today.waterL ? { id: "water", label: "Water", value: String(today.waterL), unit: "L", to: "/nutrition" } : null);
  push(today.mood ? { id: "mood", label: "Mood", value: today.mood, to: "/recovery", detail: today.stress ? `Stress ${today.stress.toLowerCase()}` : undefined } : null);
  push(today.workout ? { id: "workout", label: "Workout", value: today.workout, to: "/training" } : null);

  if (!stats.length) {
    return (
      <Card className="rounded-3xl border-transparent bg-card shadow-none">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Nothing recorded today yet. Anything you log will show up here straight away.
        </CardContent>
      </Card>
    );
  }

  return <SummaryGrid stats={stats} />;
}

export function SnapshotLogStatus() {
  const { today } = useBloomContext();

  const tracked = ["weight", "water", "sleep", "food", "mood", "journal"] as const;
  // Each row leads to the page where that log lives.
  const pageFor: Record<(typeof tracked)[number], string> = {
    weight: "/weight",
    water: "/nutrition",
    sleep: "/sleep",
    food: "/nutrition",
    mood: "/recovery",
    journal: "/journal",
  };
  const items: LogStatusItem[] = tracked.map((category) => {
    const event = today.events.find((e) => e.category === category);
    return {
      id: category,
      label: eventCategoryMeta[category].label,
      state: !event ? "missing" : event.source === "sync" ? "synced" : "logged",
      to: pageFor[category],
    };
  });

  return <LogStatusList items={items} />;
}

export function TodayTimelineWidget() {
  const { today } = useBloomContext();

  if (!today.events.length) {
    return (
      <Card className="rounded-3xl border-transparent bg-card shadow-none">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-sm text-muted-foreground">Nothing logged today — yet.</p>
          <Button asChild variant="secondary" className="gap-1.5">
            <Link to="/journal">
              Write today's journal
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-none">
      <CardContent className="space-y-5 px-7 py-7">
        {today.events.slice(0, 6).map((event) => (
          <TimelineRow key={event.id} event={event} />
        ))}
      </CardContent>
    </Card>
  );
}

/** Reads the day so far and says, plainly, what changed. */
export function TodayInsight() {
  const { today, whatChangedToday, goals } = useBloomContext();

  const headline = today.events.length
    ? `${today.events.length} thing${today.events.length === 1 ? "" : "s"} recorded today across ${
        new Set(today.events.map((e) => e.category)).size
      } part${new Set(today.events.map((e) => e.category)).size === 1 ? "" : "s"} of Bloom.`
    : "Nothing recorded today yet — Bloom is ready when you are.";

  const bodyParts = [...whatChangedToday];
  if (today.goalsCompleted) bodyParts.push(`${today.goalsCompleted} goal completed today`);
  if (today.goalStepsCompleted)
    bodyParts.push(`${today.goalStepsCompleted} goal step(s) ticked off`);
  if (today.missingLogs.length)
    bodyParts.push(
      `Still waiting on ${today.missingLogs.map((c) => eventCategoryMeta[c].label.toLowerCase()).join(", ")}`,
    );
  if (goals.active.length)
    bodyParts.push(`${goals.active.length} active goal${goals.active.length === 1 ? "" : "s"} are listening for new data`);

  return (
    <InsightHeroCard
      headline={headline}
      body={bodyParts.join(". ") + (bodyParts.length ? "." : "")}
      confidence={today.events.length > 4 ? "High" : today.events.length ? "Medium" : "Low"}
    />
  );
}

/** Focus items derived from what today is still missing. */
export function SnapshotFocus() {
  const { today, goals } = useBloomContext();

  const items = [
    ...today.missingLogs.slice(0, 3).map((category) => ({
      id: `log-${category}`,
      title: `Log your ${eventCategoryMeta[category].label.toLowerCase()}`,
      detail: "Bloom uses this to keep your goals and insights accurate",
      done: false,
    })),
    ...goals.active.slice(0, 3).map((goal) => ({
      id: `goal-${goal.id}`,
      title: goal.nextStep ?? `Move ${goal.title} forward`,
      detail: goal.title,
      done: false,
    })),
  ];

  const logged = today.events.slice(0, 2).map((event) => ({
    id: `done-${event.id}`,
    title: event.title,
    detail: event.detail ?? "Recorded today",
    done: true,
  }));

  return <FocusList items={[...items, ...logged].slice(0, 5)} />;
}

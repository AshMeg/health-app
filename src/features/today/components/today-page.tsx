import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

import {
  goalProgress,
  logStatus,
  quickAddItems,
  timelinePreview,
  todayFocus,
  todayInsight,
  todaySummary,
} from "../mock-data";
import { FocusList } from "./focus-list";
import { GoalProgressGrid } from "./goal-progress-card";
import { GreetingHeader } from "./greeting-header";
import { InsightHeroCard } from "./insight-hero-card";
import { LogStatusList } from "./log-status-list";
import { QuickAddBar } from "./quick-add-bar";
import { Section } from "./section";
import { SummaryGrid } from "./summary-stat-card";
import { TimelinePreview } from "./timeline-preview";

export function TodayPage({ firstName }: { firstName: string }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 pb-12">
      <GreetingHeader firstName={firstName} />

      <InsightHeroCard
        headline={todayInsight.headline}
        body={todayInsight.body}
        confidence={todayInsight.confidence}
      />

      <Section title="Goal Progress">
        <GoalProgressGrid goals={goalProgress} />
      </Section>

      <Section title="Today's Summary">
        <SummaryGrid stats={todaySummary} />
      </Section>

      <Section title="Today's Focus">
        <FocusList items={todayFocus} />
      </Section>

      <Section title="Missing Data">
        <LogStatusList items={logStatus} />
      </Section>

      <Section title="Quick Add">
        <QuickAddBar items={quickAddItems} />
      </Section>

      <Section
        title="Timeline"
        action={
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/journal">
              View Timeline
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      >
        <TimelinePreview events={timelinePreview} />
      </Section>
    </div>
  );
}

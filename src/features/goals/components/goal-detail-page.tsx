import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Pencil, Sparkles } from "lucide-react";

import { BackButton } from "@/components/shared/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditGoalDialog } from "./edit-goal-dialog";
import { GoalCompletionCard } from "./goal-completion-card";
import { GoalNextStep, GoalStatusPill, GoalTypePill } from "./goal-card";
import { GoalManageSection } from "./goal-manage-section";
import { GoalNotes } from "./goal-notes";
import { GoalTimeline } from "./goal-timeline";
import { MilestoneList } from "./milestones/milestone-list";
import { GoalAccentDot, GoalProgressBar } from "./goal-progress-bar";
import { trackingRegistry } from "./tracking/registry";
import { formatGoalDateLong } from "../format";
import { goalSummaryParts } from "../summary";
import { useGoals } from "../hooks/use-goals";
import { goalProgress, hasMilestones, isResting, milestoneSummary } from "../types";

export function GoalDetailPage({ goalId }: { goalId: string }) {
  const {
    getGoal,
    updateTracking,
    setMilestones,
    addNote,
    editNote,
    deleteNote,
    addManualUpdate,
    addToGarden,
    editGoal,
    resumeGoal,
    hydrated,
  } = useGoals();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const goal = getGoal(goalId);

  if (!goal) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackButton fallbackTo="/goals" fallbackLabel="All goals" />
        <Card className="rounded-3xl border-transparent bg-card shadow-soft">
          <CardContent className="space-y-2 p-10 text-center">
            <p className="text-base font-medium">
              {hydrated ? "We couldn't find that goal" : "Loading your goal…"}
            </p>
            {hydrated ? (
              <p className="text-sm text-muted-foreground">
                It may have been removed. Head back to your goals to pick another.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = goalProgress(goal);
  const isComplete = progress >= 100 || Boolean(goal.completedAt);
  const definition = trackingRegistry[goal.tracking.method];
  const { Panel } = definition;
  const milestones = goal.milestones ?? [];
  // Milestone-tracked goals always show the section; others only once they have steps.
  const showMilestones = goal.tracking.method === "milestone" || hasMilestones(goal);
  const summary = goalSummaryParts(goal);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-8">
      <BackButton fallbackTo="/goals" fallbackLabel="All goals" />

      {isComplete ? (
        <GoalCompletionCard title={goal.title} onAddToGarden={() => addToGarden(goal.id)} />
      ) : null}

      <header className="space-y-4">
        <div className="flex items-center gap-2.5">
          <GoalAccentDot accent={goal.accent} />
          <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
            {goal.title}
          </h1>
        </div>

        {/* Where am I? — the first thing to read after the title. */}
        <p className="max-w-xl text-base leading-relaxed text-foreground/80">
          {summary.join(" • ")}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <GoalTypePill goal={goal} />
          <GoalStatusPill goal={goal} />
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {definition.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit Goal
          </Button>
          {isResting(goal) ? (
            <Button variant="secondary" onClick={() => resumeGoal(goal.id)}>
              Resume goal
            </Button>
          ) : null}
        </div>

        {isResting(goal) ? (
          <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            🌱 Resting in Not Right Now — everything here is kept for when you come back.
          </p>
        ) : null}

        {goal.why ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Why this goal matters</p>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              “{goal.why}”
            </p>
          </div>
        ) : null}
      </header>

      <GoalNextStep goal={goal} />

      {/* Milestones lead when a goal has them — progress follows the steps. */}
      {showMilestones ? (
        <Card className="rounded-3xl border-transparent bg-card shadow-soft">
          <CardContent className="space-y-6 p-7 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-medium">Milestones</h2>
              <span className="text-xs text-muted-foreground">
                {milestones.length
                  ? milestoneSummary(milestones)
                  : "Break this goal into steps below"}
              </span>
            </div>
            <MilestoneList
              milestones={milestones}
              accent={goal.accent}
              onChange={(next) => setMilestones(goal.id, next)}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* The tracking method decides what this section looks like. */}
      <Card className="rounded-3xl border-transparent bg-card shadow-soft">
        <CardContent className="space-y-6 p-7 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-medium">{definition.panelTitle}</h2>
            {goal.tracking.method === "milestone" ? null : (
              <span className="text-xs text-muted-foreground">
                {hasMilestones(goal)
                  ? milestoneSummary(milestones)
                  : definition.summary(goal.tracking)}
              </span>
            )}
          </div>

          {definition.showsProgressBar || hasMilestones(goal) ? (
            <div className="space-y-2">
              <GoalProgressBar value={progress} accent={goal.accent} label={goal.title} tall />
              <p className="text-xs text-muted-foreground">{progress}% of the way there</p>
            </div>
          ) : null}

          <Panel
            tracking={goal.tracking}
            accent={goal.accent}
            onChange={(tracking) => updateTracking(goal.id, tracking)}
          />

          <dl className="grid grid-cols-2 gap-5 border-t border-border/50 pt-5 sm:grid-cols-3">
            <Stat label="Progress" value={`${progress}%`} />
            <Stat label="Started" value={formatGoalDateLong(goal.startDate)} />
            <Stat
              label="Target date"
              value={goal.targetDate ? formatGoalDateLong(goal.targetDate) : "Open-ended"}
            />
          </dl>
        </CardContent>
      </Card>


      <Card className="rounded-3xl border-transparent bg-card shadow-soft">
        <CardContent className="space-y-5 p-7 sm:p-8">
          <h2 className="text-base font-medium">Notes</h2>
          <GoalNotes
            notes={goal.notes}
            onAdd={(body) => addNote(goal.id, body)}
            onEdit={(noteId, body) => editNote(goal.id, noteId, body)}
            onDelete={(noteId) => deleteNote(goal.id, noteId)}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-transparent bg-card shadow-soft">
        <CardContent className="space-y-5 p-7 sm:p-8">
          <h2 className="text-base font-medium">Timeline of updates</h2>
          <GoalTimeline
            updates={goal.updates}
            accent={goal.accent}
            onAdd={(title) => addManualUpdate(goal.id, title)}
          />
        </CardContent>
      </Card>


      <Card className="rounded-3xl border-transparent bg-lavender-soft shadow-none">
        <CardContent className="flex items-start gap-4 p-7 sm:p-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card/70">
            <Sparkles className="h-4 w-4 text-lavender" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-medium">Insights</h2>
            <p className="text-sm leading-relaxed text-foreground/70">
              Bloom will gently explain what's helping this goal along — and what's getting in the
              way — once there's enough of your data to learn from.
            </p>
          </div>
        </CardContent>
      </Card>

      <GoalManageSection goal={goal} onDeleted={() => navigate({ to: "/goals" })} />

      <EditGoalDialog
        goal={goal}
        open={editing}
        onOpenChange={setEditing}
        onSave={(patch, changed) => editGoal(goal.id, patch, changed)}
      />
    </div>
  );
}


function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

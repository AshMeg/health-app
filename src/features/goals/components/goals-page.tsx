import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateGoalDialog } from "./create-goal-dialog";
import { GoalCard } from "./goal-card";
import { GoalsEmptyState } from "./goals-empty-state";
import { RestingGoalCard } from "./resting-goal-card";
import { useGoals } from "../hooks/use-goals";
import { HabitsSection } from "@/features/habits/components/habits-section";
import { MemoriesSection } from "@/features/memories/memories-section";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "goals", label: "Goals", line: "Where you're going." },
  { id: "habits", label: "Habits", line: "What you repeat along the way." },
  { id: "memories", label: "Memories", line: "Things you choose to remember." },
] as const;

export function GoalsPage() {
  const { active, complete, resting, addGoal, resumeGoal } = useGoals();
  const [creating, setCreating] = useState(false);
  const search = useSearch({ from: "/_authenticated/goals/" });
  const navigate = useNavigate({ from: "/goals/" });
  const tab = search.tab ?? "goals";

  const nothingYet = active.length === 0 && complete.length === 0 && resting.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 pb-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
            Goal Centre
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {tabs.find((t) => t.id === tab)!.line}
          </p>
        </div>
        {tab === "goals" ? (
          <Button onClick={() => setCreating(true)} className="gap-1.5 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Create Goal
          </Button>
        ) : null}
      </header>

      <div role="tablist" aria-label="Goal Centre" className="inline-flex w-full rounded-full bg-muted/60 p-1 sm:w-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => navigate({ search: t.id === "goals" ? {} : { tab: t.id }, replace: true })}
            className={cn(
              "flex-1 rounded-full px-5 py-2 text-sm transition-colors sm:flex-none",
              tab === t.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "habits" ? (
        <HabitsSection />
      ) : tab === "memories" ? (
        <MemoriesSection
          openId={search.memory}
          onOpen={(id) => navigate({ search: { tab: "memories", ...(id ? { memory: id } : {}) } })}
          onClose={() => navigate({ search: { tab: "memories" }, replace: true })}
        />
      ) : nothingYet ? (
        <GoalsEmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="space-y-10">
          <section className="space-y-5">
            <h2 className="text-sm text-muted-foreground">Active goals</h2>
            {active.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {active.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing growing right now — start something new when you're ready.
              </p>
            )}
          </section>

          {/* Finished goals live in the Garden — Goals stays about what's growing now. */}
          {complete.length ? (
            <section className="space-y-3">
              <h2 className="text-sm text-muted-foreground">Completed</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Each one is also a flower in your Garden — open any to see its whole story.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {complete.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
              <Button asChild variant="secondary" className="gap-1.5">
                <Link to="/garden">
                  Visit Your Garden
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </section>
          ) : null}

          {/* A different season, not a failure — everything is kept as it was. */}
          {resting.length ? (
            <section className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-sm text-muted-foreground">🌱 Not right now</h2>
                <p className="text-sm text-muted-foreground">
                  Resting until the time is right. Your progress, notes and history are all still
                  here.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {resting.map((goal) => (
                  <RestingGoalCard
                    key={goal.id}
                    goal={goal}
                    onResume={() => resumeGoal(goal.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <CreateGoalDialog open={creating} onOpenChange={setCreating} onCreate={addGoal} />
    </div>
  );
}

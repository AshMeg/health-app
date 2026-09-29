import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, Plus, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateGoalDialog } from "./create-goal-dialog";
import { GoalCard } from "./goal-card";
import { GoalsEmptyState } from "./goals-empty-state";
import { RestingGoalCard } from "./resting-goal-card";
import { useGoals } from "../hooks/use-goals";
import { HabitsSection } from "@/features/habits/components/habits-section";
import { MemoriesSection } from "@/features/memories/memories-section";
import { cn } from "@/lib/utils";
import { useTags, tagChipClass } from "@/features/tags/store";
import { TagManagerDialog } from "@/features/tags/components/tag-ui";
import type { BloomGoal } from "../types";

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
  const { tags, tagsFor } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchAll, setMatchAll] = useState(true);
  const [managing, setManaging] = useState(false);

  // Counts cover every goal (active, completed, resting) so they don't shift with the view.
  const allGoals = [...active, ...complete, ...resting];
  const counts = new Map<string, number>();
  for (const g of allGoals) for (const t of tagsFor("goal", g.id)) counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
  const liveSelected = selectedTags.filter((id) => tags.some((t) => t.id === id));
  const matches = (g: BloomGoal) => {
    if (!liveSelected.length) return true;
    const ids = tagsFor("goal", g.id).map((t) => t.id);
    return matchAll ? liveSelected.every((id) => ids.includes(id)) : liveSelected.some((id) => ids.includes(id));
  };
  const shownActive = active.filter(matches);
  const shownComplete = complete.filter(matches);
  const shownResting = resting.filter(matches);
  const filtering = liveSelected.length > 0;
  const noneMatch = filtering && !shownActive.length && !shownComplete.length && !shownResting.length;
  const toggleTag = (id: string) =>
    setSelectedTags((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

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
          <section aria-label="Filter by tag" className="space-y-3">
            {tags.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-muted/40 px-5 py-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Organise your goals your way.</p>
                  <p className="text-sm text-muted-foreground">
                    Add tags like Fitness, Learning or Creativity to make your goals easier to find.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setManaging(true)}>
                  Create a tag
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Filter by tag</span>
                  <button
                    type="button"
                    aria-pressed={!filtering}
                    onClick={() => setSelectedTags([])}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs transition-colors",
                      !filtering ? "bg-card text-foreground shadow-soft ring-1 ring-border" : "bg-muted/60 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    All
                  </button>
                  {tags.map((t) => {
                    const on = liveSelected.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleTag(t.id)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs transition-colors",
                          on ? cn(tagChipClass[t.colour], "text-foreground ring-1 ring-foreground/25") : "bg-muted/60 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {on ? "✓ " : ""}{t.name} · {counts.get(t.id) ?? 0}
                      </button>
                    );
                  })}
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setManaging(true)}>
                    <Tags className="h-3.5 w-3.5" /> Manage tags
                  </Button>
                </div>
                {liveSelected.length > 1 ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Show goals with</span>
                    <div className="inline-flex rounded-full bg-muted/60 p-0.5">
                      {[true, false].map((all) => (
                        <button
                          key={String(all)}
                          type="button"
                          aria-pressed={matchAll === all}
                          onClick={() => setMatchAll(all)}
                          className={cn("rounded-full px-3 py-1", matchAll === all ? "bg-card text-foreground shadow-soft" : "")}
                        >
                          {all ? "all selected tags" : "any selected tag"}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
            {noneMatch ? (
              <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
                No goals with {liveSelected.length > 1 ? "these tags" : "this tag"} yet.
                <Button variant="secondary" size="sm" onClick={() => setSelectedTags([])}>
                  Clear filter
                </Button>
              </div>
            ) : null}
          </section>

          <section className="space-y-5">
            <h2 className="text-sm text-muted-foreground">Active goals</h2>
            {shownActive.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {shownActive.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : filtering ? (
              <p className="text-sm text-muted-foreground">No active goals match this filter.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing growing right now — start something new when you're ready.
              </p>
            )}
          </section>

          {/* Finished goals live in the Garden — Goals stays about what's growing now. */}
          {shownComplete.length ? (
            <section className="space-y-3">
              <h2 className="text-sm text-muted-foreground">Completed</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Each one is also a flower in your Garden — open any to see its whole story.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {shownComplete.map((goal) => (
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
          {shownResting.length ? (
            <section className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-sm text-muted-foreground">🌱 Not right now</h2>
                <p className="text-sm text-muted-foreground">
                  Resting until the time is right. Your progress, notes and history are all still
                  here.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {shownResting.map((goal) => (
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

      <TagManagerDialog open={managing} onOpenChange={setManaging} counts={counts} />
      <CreateGoalDialog open={creating} onOpenChange={setCreating} onCreate={addGoal} />
    </div>
  );
}

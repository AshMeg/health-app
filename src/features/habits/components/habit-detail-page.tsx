import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Archive, CalendarPlus, Pencil, RotateCcw, Target, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/shared/back-button";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent } from "@/features/timeline/store";
import { cn } from "@/lib/utils";

import {
  checkInsFor,
  consistency,
  consistencyText,
  frequencyText,
  methodMeta,
  targetText,
  updateHabit,
  useHabits,
} from "../model";
import { HabitCheckIn } from "./habit-check-in";
import { WeekProgress } from "./week-progress";
import { HabitDialog } from "./habit-dialog";
import { PastCompletionDialog } from "./past-completion-dialog";
import type { BloomEvent } from "@/features/timeline/types";

export function HabitDetailPage({ habitId }: { habitId: string }) {
  const { habits } = useHabits();
  const { goals } = useGoals();
  const { events } = useBloomContext();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [past, setPast] = useState<{ event?: BloomEvent } | null>(null);
  const habit = habits.find((h) => h.id === habitId);

  if (!habit) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10">
        <BackButton fallbackTo="/goals" />
        <p className="text-muted-foreground">This habit couldn't be found.</p>
        <Button asChild variant="secondary" className="rounded-full">
          <Link to="/goals" search={{ tab: "habits" }}>See your habits</Link>
        </Button>
      </div>
    );
  }

  const c = consistency(habit, events);
  const goal = habit.goalId ? goals.find((g) => g.id === habit.goalId) : undefined;
  const recent = [...checkInsFor(events, habit.id)].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  const unit = habit.unit || methodMeta[habit.method]?.unit || "";
  const maxAmount = Math.max(1, ...c.recent.map((o) => o.amount ?? 0), habit.target ?? 0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-20">
      <BackButton fallbackTo="/goals" />
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft text-2xl" aria-hidden>
            {habit.icon}
          </span>
          <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">{habit.name}</h1>
        </div>
        {habit.description ? <p className="max-w-xl text-muted-foreground">{habit.description}</p> : null}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1">{frequencyText(habit.frequency)}</span>
          <span className="rounded-full bg-muted px-3 py-1">{habit.method === "completion" ? "Just completion" : habit.target ? `Target: ${targetText(habit)} each time` : targetText(habit)}</span>
          {habit.archivedAt ? <span className="rounded-full bg-muted px-3 py-1">Archived — history kept</span> : null}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={() => setEditing(true)} className="gap-1.5 rounded-full">
            <Pencil className="h-4 w-4" /> Edit habit
          </Button>
          {habit.archivedAt ? (
            <Button variant="secondary" className="gap-1.5 rounded-full" onClick={() => updateHabit(habit.id, { archivedAt: undefined })}>
              <RotateCcw className="h-4 w-4" /> Bring it back
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="gap-1.5 rounded-full"
              onClick={() => {
                updateHabit(habit.id, { archivedAt: new Date().toISOString() });
                navigate({ to: "/goals", search: { tab: "habits" } });
              }}
            >
              <Archive className="h-4 w-4" /> Archive habit
            </Button>
          )}
        </div>
      </header>

      {goal ? (
        <Link
          to="/goals/$goalId"
          params={{ goalId: goal.id }}
          className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-4 py-2 text-sm hover:bg-sage-soft/70"
        >
          <Target className="h-3.5 w-3.5 text-sage" /> Linked goal: {goal.title}
        </Link>
      ) : null}

      <Card className="rounded-3xl border-transparent bg-card shadow-soft">
        <CardContent className="space-y-5 p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Consistency over perfection</p>
              <p className="font-display text-xl">{consistencyText(c)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.allOf ? `${c.allDone} of ${c.allOf} ${c.unit} since you started` : "Your history starts with your first check-in."}
                {c.run > 1 ? ` · ${c.run} in a row right now` : ""}
              </p>
            </div>
            {habit.archivedAt ? null : <HabitCheckIn habit={habit} />}
          </div>
          {habit.frequency.kind === "weekly" ? <WeekProgress habit={habit} /> : null}

          {c.recent.length ? (
            <div className="space-y-2">
              <div className="flex h-24 items-end gap-1">
                {c.recent.map((o) => (
                  <div
                    key={o.date}
                    title={`${o.label}: ${o.done ? "done" : "not this time"}${o.amount ? ` (${o.amount}${habit.method === "completion" ? "" : ` ${unit}`})` : ""}`}
                    className={cn("max-w-6 flex-1 rounded-t-lg", o.done ? "bg-sage/70" : "bg-muted")}
                    style={{
                      height:
                        habit.method === "completion" || habit.frequency.kind === "weekly"
                          ? o.done ? "100%" : "18%"
                          : `${Math.max(12, ((o.amount ?? 0) / maxAmount) * 100)}%`,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Your recent {c.unit === "weeks" ? "weeks" : "scheduled days"}, oldest first. {habit.method !== "completion" && habit.frequency.kind !== "weekly" ? "Bar height shows what you recorded. " : ""}Green means done — a grey one is just a
                pause, not a failure.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-medium text-foreground/80">Recent check-ins</h2>
          <Button size="sm" variant="secondary" className="gap-1.5 rounded-full" onClick={() => setPast({})}>
            <CalendarPlus className="h-3.5 w-3.5" /> Add a past completion
          </Button>
        </div>
        {recent.length ? (
          <Card className="rounded-3xl border-transparent bg-card shadow-none">
            <CardContent className="divide-y divide-border/50 px-7 py-2">
              {recent.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-3">
                  <span className="text-sm text-muted-foreground">
                    {new Date(e.at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="ml-auto text-sm">{e.detail}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Edit check-in" onClick={() => setPast({ event: e })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Remove check-in" onClick={() => removeEvent(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">No check-ins yet. Whenever you're ready.</p>
        )}
      </section>

      <PastCompletionDialog habit={habit} open={!!past} onOpenChange={(o) => !o && setPast(null)} editing={past?.event ?? null} />
      <HabitDialog open={editing} onOpenChange={setEditing} editing={habit} />
    </div>
  );
}

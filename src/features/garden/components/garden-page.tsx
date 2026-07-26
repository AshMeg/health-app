import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, Flower2, Sparkles, Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { readGardenMemories, type GardenMemory } from "@/features/goals/garden";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { formatGoalDateLong } from "@/features/goals/format";
import { goalTypeMeta } from "@/features/goals/types";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import type { BloomAccent } from "@/features/today/types";

const bloomColor: Record<BloomAccent, string> = {
  sage: "bg-sage-soft text-sage",
  lavender: "bg-lavender-soft text-lavender",
  blush: "bg-blush-soft text-blush",
  sky: "bg-sky-soft text-sky",
  stone: "bg-stone-soft text-stone",
};

/**
 * Your Garden — the storybook of everything that has grown. Completed goals
 * become flowers, and the habit of showing up becomes the ground they grow in.
 */
export function GardenPage() {
  const { complete, hydrated } = useGoals();
  const { events } = useBloomContext();
  const [memories, setMemories] = useState<GardenMemory[]>([]);

  useEffect(() => {
    setMemories(readGardenMemories());
  }, [complete.length]);

  const loggedDays = new Set(events.map((e) => e.at.slice(0, 10))).size;
  const achievements = [
    {
      id: "first-flower",
      label: "First flower",
      detail: "Complete your first goal",
      earned: complete.length >= 1,
    },
    {
      id: "small-bouquet",
      label: "Small bouquet",
      detail: "Complete three goals",
      earned: complete.length >= 3,
    },
    {
      id: "steady-hand",
      label: "Steady hand",
      detail: "Log something on 7 different days",
      earned: loggedDays >= 7,
    },
    {
      id: "season-of-care",
      label: "A season of care",
      detail: "Log something on 30 different days",
      earned: loggedDays >= 30,
    },
  ];

  const nothingYet = complete.length === 0 && memories.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 pb-20">
      <header className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
          Your Garden
        </h1>
        <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">
          What have I grown so far?
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Every goal you finish is kept here as a flower, along with the story of how it grew.
        </p>
      </header>

      {nothingYet ? (
        <Card className="rounded-[2rem] border-transparent bg-card shadow-soft">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-6 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-soft">
              <Sprout className="h-6 w-6 text-sage" />
            </div>
            <div className="max-w-sm space-y-2">
              <p className="font-display text-xl font-medium sm:text-2xl">
                Your garden is still bare soil.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The first goal you complete will be planted here — and it stays for good.
              </p>
            </div>
            <Button asChild variant="secondary" className="gap-1.5">
              <Link to="/goals">
                Go to your goals
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-5">
          <h2 className="text-base font-medium text-foreground/80">Flowers in bloom</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {complete.map((goal) => (
              <Card
                key={goal.id}
                className="group relative rounded-3xl border-transparent bg-card shadow-soft transition-shadow hover:shadow-md"
              >
                <CardContent className="space-y-4 p-7">
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl",
                      bloomColor[goal.accent],
                    )}
                  >
                    <Flower2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">
                      <Link
                        to="/goals/$goalId"
                        params={{ goalId: goal.id }}
                        className="outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {goal.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {goalTypeMeta[goal.type].label} · completed{" "}
                      {formatGoalDateLong(goal.completedAt ?? goal.startDate)}
                    </p>
                  </div>
                  {goal.why ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">“{goal.why}”</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {goal.notes.length} note{goal.notes.length === 1 ? "" : "s"} ·{" "}
                    {goal.updates.length} update{goal.updates.length === 1 ? "" : "s"} along the way
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {memories.length ? (
        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-foreground/80">Kept memories</h2>
            <p className="text-sm text-muted-foreground">
              Snapshots you chose to keep at the moment a goal was finished.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {memories.map((memory) => (
              <Card key={memory.id} className="rounded-3xl border-transparent bg-card shadow-none">
                <CardContent className="space-y-2 p-6">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-lavender" />
                    <p className="text-sm font-medium">{memory.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatGoalDateLong(memory.startedOn)} → {formatGoalDateLong(memory.completedOn)}
                  </p>
                  {memory.closingNote ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      “{memory.closingNote}”
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <h2 className="text-base font-medium text-foreground/80">Achievements</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {achievements.map((a) => (
            <Card
              key={a.id}
              className={cn(
                "rounded-3xl border-transparent shadow-none",
                a.earned ? "bg-sage-soft" : "bg-card",
              )}
            >
              <CardContent className="flex items-start gap-4 p-6">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                    a.earned ? "bg-card/70 text-sage" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Award className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {a.earned ? "Earned" : a.detail}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {hydrated ? null : <p className="text-sm text-muted-foreground">Opening your garden…</p>}
    </div>
  );
}

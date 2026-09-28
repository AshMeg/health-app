import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flower2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { isInGarden } from "../garden";
import type { BloomGoal } from "../types";

const prompts = ["What did this goal mean to you?", "What did you learn?", "What are you proud of?"];

/** The goal has bloomed — it now lives in the Garden as a flower that points back here. */
export function GoalCompletionCard({
  goal,
  onPlant,
  onReflect,
}: {
  goal: BloomGoal;
  onPlant: () => void;
  onReflect: (prompt: string, body: string) => void;
}) {
  const [prompt, setPrompt] = useState(prompts[0]);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  // Plant once, quietly — the flower references this same goal record.
  useEffect(() => {
    if (!isInGarden(goal.id)) onPlant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.id]);

  const reflected = Boolean(goal.reflections?.length);

  return (
    <Card className="rounded-[2rem] border-transparent bg-sage-soft shadow-soft">
      <CardContent className="flex flex-col items-center gap-5 p-10 text-center sm:p-12">
        <span className="text-3xl" role="img" aria-label="Blossom">🌸</span>
        <div className="max-w-sm space-y-2">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">Your goal has bloomed.</h2>
          <p className="text-base leading-relaxed text-foreground/70">
            This goal is now part of your Garden — everything you gathered along the way is kept here.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="secondary" className="gap-2 rounded-full">
            <Link to="/garden">
              <Flower2 className="h-4 w-4" />
              View in Garden
            </Link>
          </Button>
          {!reflected && !open ? (
            <Button variant="ghost" className="rounded-full" onClick={() => setOpen(true)}>
              Add a reflection
            </Button>
          ) : null}
        </div>

        {open ? (
          <div className="w-full max-w-md space-y-3 text-left">
            <div className="flex flex-wrap gap-1.5">
              {prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className={`rounded-full px-3 py-1 text-xs ${p === prompt ? "bg-card" : "text-muted-foreground hover:bg-card/60"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Only if you'd like to…" className="bg-card" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setOpen(false)}>Not now</Button>
              <Button
                size="sm"
                className="rounded-full"
                disabled={!draft.trim()}
                onClick={() => {
                  onReflect(prompt, draft);
                  setDraft("");
                  setOpen(false);
                }}
              >
                Keep this reflection
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

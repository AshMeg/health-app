import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BloomAccent } from "@/features/today/types";
import { formatGoalDate } from "../format";
import type { GoalEventKind, GoalPhoto, GoalUpdate } from "../types";

const accentDot: Record<BloomAccent, string> = {
  sage: "bg-sage",
  lavender: "bg-lavender",
  blush: "bg-blush",
  sky: "bg-sky",
  stone: "bg-stone",
};

const kindLabel: Record<GoalEventKind, string> = {
  created: "Created",
  edited: "Edited",
  progress: "Progress",
  checklist: "Completed",
  milestone: "Milestone",
  reflection: "Reflection",
  completed: "Complete",
  note: "Note",
  paused: "Not right now",
  photo: "Photo",
  resumed: "Resumed",
  manual: "You added this",
};


/** Everything meaningful that has happened, recorded automatically or by hand. */
export function GoalTimeline({
  updates,
  accent,
  onAdd,
  photos = [],
}: {
  photos?: GoalPhoto[];
  updates: GoalUpdate[];
  accent: BloomAccent;
  onAdd: (title: string) => void;
}) {
  const [draft, setDraft] = useState("");
  // Oldest first — the goal's story, told in the order it happened.
  const story = [...updates].sort((a, b) => a.date.localeCompare(b.date));

  const add = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  return (
    <div className="space-y-6">
      {updates.length ? (
        <ol className="space-y-5">
          {story.map((update) => (
            <li key={update.id} className="flex gap-4">
              <div className="flex flex-col items-center pt-1.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", accentDot[accent])} />
                <span className="mt-1 w-px flex-1 bg-border/60" />
              </div>
              <div className="min-w-0 space-y-1 pb-1">
                <p className="text-xs text-muted-foreground">{formatGoalDate(update.date)}</p>
                <p className="text-sm font-medium">{update.title}</p>
                {update.detail ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{update.detail}</p>
                ) : null}
                {update.photoId && photos.find((p) => p.id === update.photoId) ? (
                  <img
                    src={photos.find((p) => p.id === update.photoId)!.src}
                    alt={update.detail ?? "Goal photo"}
                    className="mt-1 h-20 w-20 rounded-xl object-cover"
                  />
                ) : null}
                <p className="text-[11px] text-muted-foreground/80">{kindLabel[update.kind]}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing recorded yet — this fills in as you go.
        </p>
      )}

      <form
        className="flex flex-col gap-2 border-t border-border/50 pt-5 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add something that happened"
          aria-label="Add a timeline entry"
        />
        <Button type="submit" variant="secondary" className="gap-1.5 sm:w-auto">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>
    </div>
  );
}

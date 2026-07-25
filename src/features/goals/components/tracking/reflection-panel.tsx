import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  reflectionRatingMeta,
  type ReflectionRating,
  type ReflectionTracking,
} from "../../types";

const ratings: ReflectionRating[] = ["much-better", "better", "same", "worse"];

/** Wellbeing goals grow through regular reflections rather than numbers. */
export function ReflectionPanel({
  tracking,
  onChange,
}: {
  tracking: ReflectionTracking;
  onChange: (next: ReflectionTracking) => void;
}) {
  const [rating, setRating] = useState<ReflectionRating | null>(null);
  const [note, setNote] = useState("");

  const save = () => {
    if (!rating) return;
    onChange({
      ...tracking,
      reflections: [
        {
          id: `r${Date.now().toString(36)}`,
          date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" }),
          rating,
          note: note.trim() || undefined,
        },
        ...tracking.reflections,
      ],
    });
    setRating(null);
    setNote("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm">How do you feel you're progressing?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ratings.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={rating === r}
              onClick={() => setRating(r)}
              className={cn(
                "rounded-2xl px-4 py-3 text-left text-sm transition-colors",
                rating === r ? "bg-sage-soft ring-1 ring-sage/40" : "bg-muted/60 hover:bg-muted",
              )}
            >
              {reflectionRatingMeta[r].label}
            </button>
          ))}
        </div>
        <Textarea
          value={note}
          rows={3}
          placeholder="Anything you'd like to add? (optional)"
          onChange={(e) => setNote(e.target.value)}
          aria-label="Reflection note"
        />
        <Button onClick={save} disabled={!rating} variant="secondary">
          Save reflection
        </Button>
        <p className="text-xs text-muted-foreground">
          Bloom will ask you {tracking.cadence}.
        </p>
      </div>

      {tracking.reflections.length ? (
        <ol className="space-y-3 border-t border-border/50 pt-5">
          {tracking.reflections.slice(0, 6).map((entry) => (
            <li key={entry.id} className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    reflectionRatingMeta[entry.rating].className,
                  )}
                >
                  {reflectionRatingMeta[entry.rating].label}
                </span>
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>
              {entry.note ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{entry.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

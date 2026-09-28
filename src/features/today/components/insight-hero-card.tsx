import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HelpCircle, NotebookPen, Pencil, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DailyInsight } from "@/features/insights/engine";
import type { BloomEvent } from "@/features/timeline/types";

const confidenceStyles: Record<DailyInsight["confidence"], string> = {
  High: "bg-sage-soft text-sage",
  Medium: "bg-caution-soft text-caution",
  Low: "bg-stone-soft text-stone",
};

const whenLabel: Record<string, string> = {
  today: "Today",
  "last night": "Last night",
  yesterday: "Yesterday",
  "so far today": "So far today",
};

export function InsightHeroCard({
  insight,
  notes,
  onSaveNote,
  onDeleteNote,
}: {
  insight: DailyInsight;
  notes: BloomEvent[];
  onSaveNote: (text: string, id?: string) => void;
  onDeleteNote: (id: string) => void;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>();

  const openNote = (note?: BloomEvent) => {
    setEditingId(note?.id);
    setDraft(note?.title ?? "");
    setNoteOpen(true);
  };

  const save = () => {
    const text = draft.trim();
    if (!text) return;
    onSaveNote(text, editingId);
    setDraft("");
    setEditingId(undefined);
    setNoteOpen(false);
  };

  return (
    <Card className="overflow-hidden rounded-[2rem] border-transparent bg-linear-to-br from-sage-soft via-card to-lavender-soft/60 shadow-soft">
      <CardContent className="space-y-6 p-8 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-sage" />
            {insight.heading}
          </span>
          {insight.sufficient ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                confidenceStyles[insight.confidence],
              )}
            >
              {insight.confidence} confidence
            </span>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="font-display text-2xl leading-snug font-medium sm:text-[1.75rem]">
            {insight.headline}
          </p>
          {insight.body ? (
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{insight.body}</p>
          ) : null}
          {insight.goals.length ? (
            <div className="flex flex-wrap gap-2">
              {insight.goals.map((g) => (
                <Link
                  key={g.id}
                  to="/goals/$goalId"
                  params={{ goalId: g.id }}
                  className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3.5 py-1.5 text-sm hover:bg-card"
                >
                  🌱 {g.title}
                  <span className="text-muted-foreground">{g.progress}%</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {notes.length ? (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="group flex items-center justify-between gap-3 rounded-2xl bg-card/70 px-4 py-2.5 text-sm"
              >
                <span>
                  <span className="mr-2 text-muted-foreground">
                    {new Date(note.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {note.title}
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Edit note" onClick={() => openNote(note)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete note" onClick={() => onDeleteNote(note.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" className="rounded-full px-5 shadow-none" onClick={() => setWhyOpen(true)}>
            <HelpCircle className="h-4 w-4" />
            Why this?
          </Button>
          <Button variant="ghost" className="rounded-full px-5" onClick={() => openNote()}>
            <NotebookPen className="h-4 w-4" />
            Quick Note
          </Button>
        </div>
      </CardContent>

      <Dialog open={whyOpen} onOpenChange={setWhyOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Why am I seeing this?</DialogTitle>
            <DialogDescription>The real data behind today's note.</DialogDescription>
          </DialogHeader>
          {insight.evidence.length ? (
            <ul className="space-y-3">
              {insight.evidence.map((e, i) => (
                <li key={i} className="rounded-2xl bg-muted/50 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{e.label}</span>
                    <span className="text-xs text-muted-foreground">{whenLabel[e.when]}</span>
                  </div>
                  {e.goalId ? (
                    <Link
                      to="/goals/$goalId"
                      params={{ goalId: e.goalId }}
                      className="text-sm underline-offset-4 hover:underline"
                      onClick={() => setWhyOpen(false)}
                    >
                      {e.value}
                    </Link>
                  ) : (
                    <p className="text-sm">{e.value}</p>
                  )}
                  {e.trend ? <p className="text-xs text-muted-foreground">{e.trend}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              There isn't enough information yet for Bloom to point to any evidence.
            </p>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">{insight.reasoning}</p>
          <p className="text-xs text-muted-foreground">Bloom explains patterns — it isn't medical advice.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Edit note" : "Quick Note"}</DialogTitle>
            <DialogDescription>Tell Bloom anything about today — a big meeting, travelling, a rest day.</DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={draft}
            maxLength={200}
            placeholder="e.g. Poor night's sleep"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                save();
              }
            }}
          />
          <DialogFooter>
            <Button className="rounded-full" onClick={save} disabled={!draft.trim()}>
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

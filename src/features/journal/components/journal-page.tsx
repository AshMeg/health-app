import { useMemo, useState } from "react";
import { Pencil, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { atForDate, localDate } from "@/features/measurements/model";
import { metricPages } from "@/features/metrics/config";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent, updateEvent } from "@/features/timeline/store";
import type { BloomEvent } from "@/features/timeline/types";
import { cn } from "@/lib/utils";

/** A small, human range — structured so Analytics can read it later. */
export const moods = [
  { value: "Great", emoji: "😊" },
  { value: "Good", emoji: "🙂" },
  { value: "Calm", emoji: "😌" },
  { value: "Okay", emoji: "😐" },
  { value: "Low", emoji: "😕" },
  { value: "Sad", emoji: "😔" },
  { value: "Stressed", emoji: "😣" },
] as const;

const emojiFor = (m?: string) => moods.find((x) => x.value === m)?.emoji ?? "";
export const LIFE_EVENT_ORIGIN = "journal-life-event";
const config = metricPages.journal;

const textOf = (e: BloomEvent) =>
  e.description ?? (typeof e.metrics?.journal === "string" ? e.metrics.journal : undefined) ?? e.detail ?? "";

const time = (at: string) => new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function JournalPage() {
  const { events, record } = useBloomContext();
  const today = localDate();

  // Mood
  const [moodDate, setMoodDate] = useState(today);
  const moodEvent = events
    .filter((e) => e.category === "mood" && localDate(e.at) === moodDate)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  const currentMood = moodEvent?.metrics?.mood as string | undefined;
  const [editingMood, setEditingMood] = useState(false);
  const showPicker = editingMood || !currentMood;

  const pickMood = (value: string) => {
    if (moodEvent) {
      // One mood per day — change it rather than adding another.
      updateEvent(moodEvent.id, {
        metrics: { ...moodEvent.metrics, mood: value },
        detail: value,
      });
    } else {
      record({ category: "mood", title: "Mood recorded", detail: value, metrics: { mood: value }, at: atForDate(moodDate) });
    }
    setEditingMood(false);
  };

  // Journal entry
  const [draft, setDraft] = useState("");
  const [entryDate, setEntryDate] = useState(today);
  const [editing, setEditing] = useState<BloomEvent | null>(null);
  const [editText, setEditText] = useState("");

  const saveEntry = () => {
    const text = draft.trim();
    if (!text) return;
    record({
      category: "journal",
      title: "Journal written",
      detail: text.length > 90 ? `${text.slice(0, 90)}…` : text,
      description: text,
      metrics: { journal: text },
      at: atForDate(entryDate),
    });
    setDraft("");
    setEntryDate(today);
  };

  const saveEdit = () => {
    if (!editing) return;
    const text = editText.trim();
    if (!text) return;
    updateEvent(editing.id, {
      description: text,
      detail: text.length > 90 ? `${text.slice(0, 90)}…` : text,
      metrics: { ...editing.metrics, journal: text },
    });
    setEditing(null);
  };

  // Life event
  const [lifeTitle, setLifeTitle] = useState("");
  const [lifeDate, setLifeDate] = useState(today);
  const [lifeOpen, setLifeOpen] = useState(false);
  const saveLife = () => {
    if (!lifeTitle.trim()) return;
    record({ category: "life-event", title: lifeTitle.trim(), origin: LIFE_EVENT_ORIGIN, at: atForDate(lifeDate) });
    setLifeTitle("");
    setLifeDate(today);
    setLifeOpen(false);
  };

  const days = useMemo(() => {
    const items = events.filter((e) => ["journal", "mood", "life-event"].includes(e.category));
    const map = new Map<string, BloomEvent[]>();
    for (const e of items.sort((a, b) => b.at.localeCompare(a.at))) {
      const d = localDate(e.at);
      map.set(d, [...(map.get(d) ?? []), e]);
    }
    return [...map.entries()];
  }, [events]);

  const dayLabel = (d: string) =>
    d === today
      ? "Today"
      : new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 pb-20">
      <header className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">Journal</h1>
        <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">{config.question}</p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Your own words, kept private and alongside everything else Bloom knows. Bloom never reads
          meaning into what you write.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-medium text-foreground/80">Mood</h2>
          <Input
            type="date"
            aria-label="Mood date"
            max={today}
            value={moodDate}
            onChange={(e) => {
              setMoodDate(e.target.value || today);
              setEditingMood(false);
            }}
            className="h-9 w-auto rounded-full"
          />
        </div>
        <Card className="rounded-3xl border-transparent bg-card shadow-none">
          <CardContent className="space-y-4 p-7">
            {currentMood && !editingMood ? (
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl">
                  <span className="mr-2">{emojiFor(currentMood)}</span>
                  {currentMood}
                </p>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditingMood(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                How {moodDate === today ? "are you feeling today" : "did you feel that day"}?
              </p>
            )}
            {showPicker ? (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mood">
                {moods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={currentMood === m.value}
                    onClick={() => pickMood(m.value)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm transition-colors",
                      currentMood === m.value ? "bg-sage-soft text-foreground" : "bg-muted text-foreground/80 hover:bg-muted/70",
                    )}
                  >
                    <span className="mr-1.5">{m.emoji}</span>
                    {m.value}
                  </button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">Write</h2>
        <Card className="rounded-3xl border-transparent bg-card shadow-none">
          <CardContent className="space-y-4 p-7">
            <Textarea
              aria-label="Journal entry"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What has been on your mind?"
              className="min-h-32 resize-y rounded-2xl border-transparent bg-muted/40 text-base"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Input
                type="date"
                aria-label="Entry date"
                max={today}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value || today)}
                className="h-9 w-auto rounded-full"
              />
              <Button className="rounded-full px-6" disabled={!draft.trim()} onClick={saveEntry}>
                Save entry
              </Button>
            </div>
          </CardContent>
        </Card>
        {lifeOpen ? (
          <Card className="rounded-3xl border-transparent bg-lavender-soft/40 shadow-none">
            <CardContent className="space-y-4 p-7">
              <div className="space-y-1.5">
                <Label htmlFor="life-title">What happened?</Label>
                <Input
                  id="life-title"
                  value={lifeTitle}
                  onChange={(e) => setLifeTitle(e.target.value)}
                  placeholder="Holiday, new job, birthday, moving house…"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Input type="date" aria-label="Life event date" max={today} value={lifeDate} onChange={(e) => setLifeDate(e.target.value || today)} className="h-9 w-auto rounded-full" />
                <div className="flex gap-2">
                  <Button variant="ghost" className="rounded-full" onClick={() => setLifeOpen(false)}>Cancel</Button>
                  <Button className="rounded-full px-6" disabled={!lifeTitle.trim()} onClick={saveLife}>Save life event</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button variant="secondary" className="rounded-full" onClick={() => setLifeOpen(true)}>
            <Sparkles className="h-3.5 w-3.5" /> Record a life event
          </Button>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-base font-medium text-foreground/80">History</h2>
        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here yet. Your first entry will appear here.</p>
        ) : (
          days.map(([date, items]) => (
            <div key={date} className="space-y-3">
              <h3 className="font-display text-base font-medium">{dayLabel(date)}</h3>
              <Card className="rounded-3xl border-transparent bg-card shadow-none">
                <CardContent className="divide-y divide-border/50 px-7 py-2">
                  {items.map((e) => (
                    <div key={e.id} className="space-y-2 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {e.category === "mood"
                            ? "Mood"
                            : e.category === "journal"
                              ? "Journal"
                              : e.origin === "quick-note"
                                ? "Quick note"
                                : "Life event"}
                        </span>
                        <span>·</span>
                        <span>{time(e.at)}</span>
                        <div className="ml-auto flex">
                          {e.category === "journal" ? (
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" aria-label="Edit entry" onClick={() => { setEditing(e); setEditText(textOf(e)); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full"
                            aria-label="Delete"
                            onClick={() => {
                              if (window.confirm("Delete this entry?")) removeEvent(e.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {editing?.id === e.id ? (
                        <div className="space-y-2">
                          <Textarea aria-label="Edit entry" value={editText} onChange={(ev) => setEditText(ev.target.value)} className="min-h-24 rounded-2xl" />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button size="sm" className="rounded-full" onClick={saveEdit}>Save</Button>
                          </div>
                        </div>
                      ) : e.category === "mood" ? (
                        <p className="text-sm">
                          {emojiFor(e.metrics?.mood as string)} {String(e.metrics?.mood ?? e.detail ?? "")}
                        </p>
                      ) : e.category === "journal" ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{textOf(e)}</p>
                      ) : (
                        <p className="text-sm">{e.title}{e.detail ? ` — ${e.detail}` : ""}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

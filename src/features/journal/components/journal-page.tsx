import { useMemo, useState } from "react";
import { Pencil, Sparkles, Trash2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { MEMORY_ORIGIN, isMemory } from "@/features/garden/model";
import { MemoryDialog } from "@/features/memories/memory-dialog";
import { isJournalEntry } from "@/features/timeline/types";

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
import { MoodSection, MoodOverTime } from "./mood-section";
import { coreMoods, isDailyMood, moodEmoji } from "../moods";

export const moods = coreMoods;
const emojiFor = moodEmoji;
export const LIFE_EVENT_ORIGIN = "journal-life-event";
const config = metricPages.journal;

const textOf = (e: BloomEvent) =>
  e.description ?? (typeof e.metrics?.journal === "string" ? e.metrics.journal : undefined) ?? e.detail ?? "";

const time = (at: string) => new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function JournalPage() {
  const { events, record } = useBloomContext();
  const today = localDate();

  // Journal entry
  const [draft, setDraft] = useState("");
  const [entryDate, setEntryDate] = useState(today);
  const [editing, setEditing] = useState<BloomEvent | null>(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState(today);

  const [keep, setKeep] = useState<"journal" | "memory" | "both">("journal");
  const [memTitle, setMemTitle] = useState("");
  const [plant, setPlant] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const needsTitle = keep !== "journal";

  const saveEntry = () => {
    const text = draft.trim();
    if (!text || (needsTitle && !memTitle.trim())) return;
    const at = atForDate(entryDate);
    if (keep === "memory") {
      // A memory on its own — the same shape as "+ Add memory" in Goal Centre.
      record({ category: "life-event", detail: "Memory", origin: MEMORY_ORIGIN, title: memTitle.trim(), description: text, at, inGarden: plant, memory: true });
    } else {
      // One record; "Both" simply carries memory status too.
      record({
        category: "journal",
        title: keep === "both" ? memTitle.trim() : "Journal written",
        detail: text.length > 90 ? `${text.slice(0, 90)}…` : text,
        description: text,
        metrics: { journal: text },
        at,
        ...(keep === "both" ? { memory: true, inGarden: plant } : {}),
      });
    }
    setDraft("");
    setEntryDate(today);
    setMemTitle("");
    setPlant(false);
    setKeep("journal");
  };

  const saveEdit = () => {
    if (!editing) return;
    const text = editText.trim();
    if (!text) return;
    updateEvent(editing.id, {
      description: text,
      detail: text.length > 90 ? `${text.slice(0, 90)}…` : text,
      metrics: { ...editing.metrics, journal: text },
      ...(editDate !== localDate(editing.at) ? { at: atForDate(editDate) } : {}),
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
    const items = events.filter(
      (e) =>
        isJournalEntry(e) ||
        e.category === "mood" ||
        (e.category === "life-event" && e.origin !== MEMORY_ORIGIN),
    );
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
          A space for your thoughts. Write down what happened, how you felt, or whatever you'd like
          to keep track of. Bloom never reads meaning into what you write.
        </p>
      </header>

      <MoodSection />

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">Write</h2>
        <p className="-mt-2 text-sm text-muted-foreground">Writing and mood are separate — you can do either on its own.</p>
        <Card className="rounded-3xl border-transparent bg-card shadow-none">
          <CardContent className="space-y-4 p-7">
            <Textarea
              id="journal-draft"
              aria-label="Journal entry"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What has been on your mind?"
              className="min-h-32 resize-y rounded-2xl border-transparent bg-muted/40 text-base"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">What would you like to do with this?</p>
              <p className="text-xs text-muted-foreground">
                You can keep this as a journal entry, save it as a memory, or let it live in both places.
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What would you like to do with this?">
                {([["journal", "📖 Journal"], ["memory", "🦋 Memory"], ["both", "✨ Both"]] as const).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={keep === v}
                    onClick={() => setKeep(v)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm transition-colors",
                      keep === v ? "bg-sage-soft text-foreground" : "bg-muted text-foreground/80 hover:bg-muted/70",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {needsTitle ? (
              <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="entry-mem-title">Memory title</Label>
                  <Input id="entry-mem-title" value={memTitle} onChange={(e) => setMemTitle(e.target.value)} placeholder="Summer in Italy" />
                </div>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>🦋 Plant in Your Garden</span>
                  <Switch checked={plant} onCheckedChange={setPlant} aria-label="Plant in Garden" />
                </label>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Input
                type="date"
                aria-label="Entry date"
                max={today}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value || today)}
                className="h-9 w-auto rounded-full"
              />
              <Button className="rounded-full px-6" disabled={!draft.trim() || (needsTitle && !memTitle.trim())} onClick={saveEntry}>
                {keep === "journal" ? "Save entry" : keep === "memory" ? "Save memory" : "Save to both"}
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

      <MoodOverTime />

      <section className="space-y-6">
        <h2 className="text-base font-medium text-foreground/80">Journal history</h2>
        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground">A space for your thoughts. Write down what happened, how you felt, or whatever you'd like to record.</p>
        ) : (
          days.map(([date, items]) => (
            <div key={date} className="space-y-3">
              <h3 className="font-display text-base font-medium">
                {dayLabel(date)}
                {(() => {
                  const m = items.find(isDailyMood)?.metrics?.mood as string | undefined;
                  return m ? <span className="ml-2 text-sm font-normal text-muted-foreground">{emojiFor(m)} {m}</span> : null;
                })()}
              </h3>
              <Card className="rounded-3xl border-transparent bg-card shadow-none">
                <CardContent className="divide-y divide-border/50 px-7 py-2">
                  {items.map((e) => (
                    <div key={e.id} className="space-y-2 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {e.category === "mood"
                            ? "Mood"
                            : isJournalEntry(e)
                              ? isMemory(e) ? "Journal · 🦋 Memory" : "Journal"
                              : e.origin === "quick-note"
                                ? "Quick note"
                                : "Life event"}
                        </span>
                        <span>·</span>
                        <span>{time(e.at)}</span>
                        <div className="ml-auto flex">
                          {isJournalEntry(e) ? (
                            <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs" onClick={() => setMemoryOpen(e.id)}>
                              {isMemory(e) ? "Open memory" : "Save as memory"}
                            </Button>
                          ) : null}
                          {e.category === "journal" ? (
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" aria-label="Edit entry" onClick={() => { setEditing(e); setEditText(textOf(e)); setEditDate(localDate(e.at)); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full"
                            aria-label="Delete"
                            onClick={() => {
                              if (isJournalEntry(e) && isMemory(e)) return setDeleting(e.id);
                              if (window.confirm("Delete this entry?")) removeEvent(e.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {deleting === e.id ? (
                        <div className="space-y-3 rounded-2xl bg-blush-soft/50 px-4 py-3">
                          <p className="text-sm">This entry is also saved as a memory.</p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => { updateEvent(e.id, { inJournal: false }); setDeleting(null); }}>
                              Remove from Journal only
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => { removeEvent(e.id); setDeleting(null); }}>
                              Delete everywhere
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setDeleting(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : null}
                      {editing?.id === e.id ? (
                        <div className="space-y-2">
                          <Textarea aria-label="Edit entry" value={editText} onChange={(ev) => setEditText(ev.target.value)} className="min-h-24 rounded-2xl" />
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Input type="date" aria-label="Entry date" max={today} value={editDate} onChange={(ev) => setEditDate(ev.target.value || today)} className="mr-auto h-8 w-auto rounded-full" />
                            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button size="sm" className="rounded-full" onClick={saveEdit}>Save</Button>
                          </div>
                        </div>
                      ) : e.category === "mood" ? (
                        <p className="text-sm">
                          {(() => { const v = String(e.metrics?.mood ?? e.metrics?.moodObservation ?? e.detail ?? ""); return `${emojiFor(v)} ${v}${e.metrics?.moodObservation ? " (a moment)" : ""}${e.metrics?.moodIntensity ? ` · strength ${e.metrics.moodIntensity} of 5` : ""}`; })()}
                        </p>
                      ) : isJournalEntry(e) ? (
                        <div className="space-y-1">
                          {e.origin === MEMORY_ORIGIN ? <p className="font-medium">{e.title}</p> : null}
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{textOf(e)}</p>
                          {e.photos?.length ? (
                            <div className="flex gap-2 pt-1">
                              {e.photos.slice(0, 3).map((src, i) => <img key={i} src={src} alt="" className="h-14 w-14 rounded-xl object-cover" />)}
                            </div>
                          ) : null}
                        </div>
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
      <MemoryDialog open={!!memoryOpen} memoryId={memoryOpen ?? undefined} onClose={() => setMemoryOpen(null)} />
    </div>
  );
}

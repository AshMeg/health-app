import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { atForDate, localDate } from "@/features/measurements/model";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent, updateEvent } from "@/features/timeline/store";
import { cn } from "@/lib/utils";

import {
  addCustomMood,
  coreMoods,
  isDailyMood,
  isMoodObservation,
  moodEmoji,
  moreMoods,
  removeCustomMood,
  useCustomMoods,
} from "../moods";

const chip = (active: boolean) =>
  cn(
    "rounded-full px-4 py-2 text-sm transition-colors",
    active ? "bg-sage-soft text-foreground ring-1 ring-sage" : "bg-muted text-foreground/80 hover:bg-muted/70",
  );

const time = (at: string) => new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function MoodSection() {
  const { events, record } = useBloomContext();
  const today = localDate();
  const [date, setDate] = useState(today);
  const [more, setMore] = useState(false);
  const [adding, setAdding] = useState(false);
  const [customText, setCustomText] = useState("");
  const [momentOpen, setMomentOpen] = useState(false);
  const custom = useCustomMoods(events);

  const dayMood = events
    .filter((e) => isDailyMood(e) && localDate(e.at) === date)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  const current = dayMood?.metrics?.mood as string | undefined;
  const intensity = dayMood?.metrics?.moodIntensity as number | undefined;
  const moments = events
    .filter((e) => isMoodObservation(e) && localDate(e.at) === date)
    .sort((a, b) => a.at.localeCompare(b.at));

  const pick = (value: string) => {
    if (momentOpen) {
      // A separate moment — never overwrites the day's mood or earlier moments.
      const at = date === today ? new Date().toISOString() : atForDate(date);
      record({ category: "mood", title: "Feeling noted", detail: value, metrics: { moodObservation: value }, at });
      setMomentOpen(false);
      return;
    }
    if (dayMood) {
      if (current === value) return;
      updateEvent(dayMood.id, { metrics: { mood: value }, detail: value });
    } else {
      record({ category: "mood", title: "Mood recorded", detail: value, metrics: { mood: value }, at: atForDate(date) });
    }
  };

  const setIntensity = (n: number) => {
    if (!dayMood) return;
    const next = intensity === n ? undefined : n;
    updateEvent(dayMood.id, { metrics: { mood: current!, ...(next ? { moodIntensity: next } : {}) } });
  };

  const saveCustom = () => {
    const v = customText.trim();
    if (!v) return;
    addCustomMood(v);
    pick(v);
    setCustomText("");
    setAdding(false);
  };

  const selected = momentOpen ? undefined : current;
  const extraSelected = !!selected && moreMoods.some((m) => m.value === selected);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-medium">
          {date === today ? "How are you feeling today?" : "How were you feeling that day?"}
        </h2>
        <Input
          type="date"
          aria-label="Mood date"
          max={today}
          value={date}
          onChange={(e) => {
            setDate(e.target.value || today);
            setMomentOpen(false);
          }}
          className="h-9 w-auto rounded-full"
        />
      </div>
      <Card className="rounded-3xl border-transparent bg-card shadow-none">
        <CardContent className="space-y-5 p-7">
          {momentOpen ? (
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-lavender-soft/50 px-4 py-2 text-sm">
              <span>Pick a feeling for {date === today ? "right now" : "that day"}. It's kept alongside your daily mood.</span>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setMomentOpen(false)}>Cancel</Button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mood">
            {coreMoods.map((m) => (
              <button key={m.value} type="button" role="radio" aria-checked={selected === m.value} onClick={() => pick(m.value)} className={chip(selected === m.value)}>
                <span className="mr-1.5">{m.emoji}</span>
                {m.value}
              </button>
            ))}
            {(more || extraSelected ? moreMoods : []).map((m) => (
              <button key={m.value} type="button" role="radio" aria-checked={selected === m.value} onClick={() => pick(m.value)} className={chip(selected === m.value)}>
                <span className="mr-1.5">{m.emoji}</span>
                {m.value}
              </button>
            ))}
            {custom.map((v) => (
              <button key={v} type="button" role="radio" aria-checked={selected === v} onClick={() => pick(v)} className={chip(selected === v)}>
                <span className="mr-1.5">💭</span>
                {v}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!extraSelected ? (
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setMore((x) => !x)}>
                {more ? "Fewer feelings" : "More feelings"}
              </Button>
            ) : null}
            {adding ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  aria-label="Your own feeling"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCustom()}
                  placeholder="Hopeful, restless…"
                  maxLength={30}
                  className="h-9 w-44 rounded-full"
                />
                <Button size="sm" className="rounded-full" disabled={!customText.trim()} onClick={saveCustom}>Add</Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Cancel" onClick={() => setAdding(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setAdding(true)}>
                <Plus className="h-3.5 w-3.5" /> Add your own
              </Button>
            )}
          </div>

          {current && !momentOpen ? (
            <div className="space-y-2 border-t border-border/50 pt-4">
              <p className="text-sm text-muted-foreground">How strongly are you feeling this? <span className="text-xs">(optional)</span></p>
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-pressed={intensity === n} onClick={() => setIntensity(n)} className={cn(chip(intensity === n), "h-9 w-9 px-0")}>
                    {n}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground">1 — a little · 5 — very strongly</span>
              </div>
            </div>
          ) : null}

          <div className="space-y-2 border-t border-border/50 pt-4">
            {moments.length ? (
              <ul className="space-y-1 text-sm">
                {moments.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <span className="w-12 text-xs text-muted-foreground">{time(m.at)}</span>
                    <span>{moodEmoji(String(m.metrics?.moodObservation))} {String(m.metrics?.moodObservation)}</span>
                    <Button size="icon" variant="ghost" className="ml-auto h-7 w-7 rounded-full" aria-label="Remove moment" onClick={() => removeEvent(m.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            {!momentOpen ? (
              <Button size="sm" variant="ghost" className="rounded-full px-2 text-muted-foreground" onClick={() => setMomentOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Note a feeling at a particular moment
              </Button>
            ) : null}
          </div>
          {custom.length ? (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Manage your own feelings</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {custom.map((v) => (
                  <Button key={v} size="sm" variant="secondary" className="h-7 rounded-full text-xs" onClick={() => removeCustomMood(v)}>
                    {v} <X className="h-3 w-3" />
                  </Button>
                ))}
              </div>
              <p className="mt-1">Removing one only hides it from the list. Days you've logged keep it.</p>
            </details>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

const RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "3m", label: "3 months", days: 91 },
  { id: "6m", label: "6 months", days: 182 },
  { id: "1y", label: "1 year", days: 365 },
] as const;

export function MoodOverTime() {
  const { events } = useBloomContext();
  const today = localDate();
  const byDay = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of [...events].filter(isDailyMood).sort((a, b) => a.at.localeCompare(b.at))) {
      map.set(localDate(e.at), String(e.metrics?.mood));
    }
    return map;
  }, [events]);

  const oldest = [...byDay.keys()].sort()[0];
  const span = oldest ? Math.round((new Date(`${today}T00:00:00`).getTime() - new Date(`${oldest}T00:00:00`).getTime()) / 86400000) + 1 : 0;
  // Only offer a range when the history actually reaches past the one before it.
  const available = RANGES.filter((r, i) => i === 0 || span > RANGES[i - 1].days);
  const [rangeId, setRangeId] = useState<string>("30d");
  const range = available.find((r) => r.id === rangeId) ?? available[available.length - 1];

  const days = useMemo(() => {
    const out: string[] = [];
    for (let i = range.days - 1; i >= 0; i--) {
      const d = new Date(`${today}T12:00:00`);
      d.setDate(d.getDate() - i);
      out.push(localDate(d.toISOString()));
    }
    return out;
  }, [range.days, today]);

  const logged = days.filter((d) => byDay.has(d));
  const counts = new Map<string, number>();
  for (const d of logged) counts.set(byDay.get(d)!, (counts.get(byDay.get(d)!) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recent = [...logged].reverse().slice(0, 7);
  const small = range.days > 30;
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium text-foreground/80">Mood over time</h2>
        {available.length > 1 ? (
          <div className="flex flex-wrap gap-1">
            {available.map((r) => (
              <button key={r.id} type="button" onClick={() => setRangeId(r.id)} className={cn("rounded-full px-3 py-1 text-xs", range.id === r.id ? "bg-sage-soft" : "text-muted-foreground hover:bg-muted")}>
                {r.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <Card className="rounded-3xl border-transparent bg-card shadow-none">
        <CardContent className="space-y-5 p-7">
          {byDay.size === 0 ? (
            <p className="text-sm text-muted-foreground">Once you record how you're feeling, your moods will appear here day by day.</p>
          ) : (
            <>
              <div className={cn("flex flex-wrap", small ? "gap-1" : "gap-1.5")} aria-label="Mood calendar">
                {days.map((d) => {
                  const m = byDay.get(d);
                  return (
                    <div
                      key={d}
                      title={`${fmt(d)}${m ? ` — ${m}` : " — nothing recorded"}`}
                      className={cn(
                        "flex items-center justify-center rounded-lg",
                        small ? "h-4 w-4 text-[9px]" : "h-9 w-9 text-lg",
                        m ? "bg-lavender-soft/70" : "bg-muted/50",
                      )}
                    >
                      {m && !small ? moodEmoji(m) : m ? "•" : ""}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Mood recorded on {logged.length} of {range.days} days. Empty squares are days with nothing recorded.
              </p>
              {top.length ? (
                <div className="flex flex-wrap gap-2">
                  {top.map(([m, n]) => (
                    <span key={m} className="rounded-full bg-muted px-3 py-1 text-xs">
                      {moodEmoji(m)} {m} · {n} {n === 1 ? "day" : "days"}
                    </span>
                  ))}
                </div>
              ) : null}
              {recent.length ? (
                <ul className="space-y-1 text-sm">
                  {recent.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span className="w-16 text-muted-foreground">{fmt(d)}</span>
                      <span>{moodEmoji(byDay.get(d))} {byDay.get(d)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

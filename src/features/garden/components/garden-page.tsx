import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, ImagePlus, Minus, Plus, Maximize2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { formatGoalDateLong } from "@/features/goals/format";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent, updateEvent } from "@/features/timeline/store";

import {
  buildButterflies,
  buildFlowers,
  buildHabits,
  buildYears,
  fileToPhoto,
  MEMORY_ORIGIN,
  monthNames,
  seasonCopy,
  seasonFor,
  type GardenMonth,
  type Season,
} from "../model";
import { GardenScene, SCENE_HEIGHT, sceneWidth } from "./garden-scene";

type View =
  | { kind: "year"; year: number }
  | { kind: "month"; key: string }
  | { kind: "hive" }
  | { kind: "memory"; id?: string }
  | null;

function encodeView(v: NonNullable<View>): string {
  if (v.kind === "year") return `year:${v.year}`;
  if (v.kind === "month") return `month:${v.key}`;
  if (v.kind === "memory") return v.id ? `memory:${v.id}` : "memory";
  return "hive";
}

function decodeView(raw?: string): View {
  if (!raw) return null;
  const [kind, ...rest] = raw.split(":");
  const value = rest.join(":");
  if (kind === "year" && Number(value)) return { kind: "year", year: Number(value) };
  if (kind === "month" && value) return { kind: "month", key: value };
  if (kind === "hive") return { kind: "hive" };
  if (kind === "memory") return { kind: "memory", id: value || undefined };
  return null;
}

/**
 * Your Garden — Bloom's emotional archive. A seasonal meadow where finished
 * goals grow as flowers, memories drift as butterflies, habits hum in the
 * hive, and every year stands as a tree with its own yearbook.
 */
export function GardenPage() {
  const { goals, complete } = useGoals();
  const { events } = useBloomContext();
  const [season, setSeason] = useState<Season>("spring");
  const search = useSearch({ strict: false }) as { view?: string };
  const navigate = useNavigate();
  const view = decodeView(search.view);
  // Replace (not push) so browser Back never steps through sheet states.
  const setView = (next: View) =>
    navigate({ to: "/garden", search: next ? { view: encodeView(next) } : {}, replace: true, resetScroll: false });
  const [zoom, setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => setSeason(seasonFor()), []);

  const flowers = useMemo(() => buildFlowers(complete), [complete]);
  const butterflies = useMemo(() => buildButterflies(events), [events]);
  const habits = useMemo(() => buildHabits(goals), [goals]);
  const years = useMemo(() => buildYears({ flowers, butterflies, goals }), [flowers, butterflies, goals]);
  const months = useMemo(() => years.flatMap((y) => y.months).filter((m) => m.flowers.length || m.butterflies.length), [years]);
  const width = sceneWidth(flowers.length, butterflies.length, years.length);
  const empty = !flowers.length && !butterflies.length && !habits.length;

  const fit = () => {
    const w = viewport.current?.clientWidth ?? width;
    setZoom(Math.max(0.4, Math.min(1, w / width)));
  };

  // Ctrl/⌘ + scroll zooms, like a map.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => Math.min(1.8, Math.max(0.4, z - e.deltaY * 0.002)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8 pb-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">Your Garden</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{seasonCopy[season]}</p>
        </div>
        <Button variant="secondary" className="rounded-full" onClick={() => setView({ kind: "memory" })}>
          <span aria-hidden>🦋</span>
          Capture a memory
        </Button>
      </header>

      <div className="relative w-full max-w-full min-w-0 overflow-hidden rounded-[2rem] shadow-soft">
        <div
          ref={viewport}
          className="overflow-auto"
          style={{ height: Math.min(SCENE_HEIGHT, SCENE_HEIGHT * zoom) + 2, maxHeight: "72vh" }}
        >
          <div style={{ width: width * zoom, height: SCENE_HEIGHT * zoom }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
              <GardenScene
                season={season}
                width={width}
                flowers={flowers}
                butterflies={butterflies}
                habits={habits}
                years={years}
                months={months}
                onOpenYear={(year) => setView({ kind: "year", year })}
                onOpenMonth={(key) => setView({ kind: "month", key })}
                onOpenHive={() => setView({ kind: "hive" })}
                onOpenMemory={(id) => setView({ kind: "memory", id })}
              />
            </div>
          </div>
        </div>

        {empty ? (
          <div className="pointer-events-none absolute inset-x-0 top-10 flex justify-center px-6">
            <div className="pointer-events-auto max-w-md space-y-3 rounded-3xl bg-card/85 px-7 py-6 text-center backdrop-blur-sm">
              <p className="font-display text-2xl font-medium">Your garden is just beginning.</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Complete a goal, capture a moment or build a habit and watch it grow here.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/goals">
                    Go to your goals <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setView({ kind: "memory" })}>
                  Capture a moment
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="absolute right-4 bottom-4 flex gap-1 rounded-full bg-card/90 p-1 shadow-soft">
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="See the whole garden" onClick={fit}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        🌸 flowers are finished goals · 🦋 butterflies are memories · 🐝 the hive holds your habits · 🌳 each tree is a year
      </p>

      <YearSheet
        year={view?.kind === "year" ? years.find((y) => y.year === view.year) : undefined}
        onClose={() => setView(null)}
        onOpenMonth={(key) => setView({ kind: "month", key })}
      />
      <MonthSheet
        month={view?.kind === "month" ? years.flatMap((y) => y.months).find((m) => m.key === view.key) : undefined}
        onClose={() => setView(null)}
        onOpenMemory={(id) => setView({ kind: "memory", id })}
        onOpenYear={(year) => setView({ kind: "year", year })}
      />
      <HiveSheet open={view?.kind === "hive"} habits={habits} onClose={() => setView(null)} />
      <MemoryDialog
        open={view?.kind === "memory"}
        memoryId={view?.kind === "memory" ? view.id : undefined}
        onClose={() => setView(null)}
      />
    </div>
  );
}

function YearSheet({
  year,
  onClose,
  onOpenMonth,
}: {
  year?: ReturnType<typeof buildYears>[number];
  onClose: () => void;
  onOpenMonth: (key: string) => void;
}) {
  return (
    <Sheet open={!!year} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {year ? (
          <>
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">{year.year} Yearbook</SheetTitle>
              <SheetDescription>
                {year.size
                  ? `${year.size} flower${year.size === 1 ? "" : "s"} and memories gathered this year.`
                  : "This year's pages are still blank — they'll fill as you grow."}
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 px-4 pb-6 sm:grid-cols-3">
              {monthNames.map((name, i) => {
                const m = year.months.find((x) => x.month === i);
                const count = m ? m.flowers.length + m.butterflies.length : 0;
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={!m}
                    onClick={() => m && onOpenMonth(m.key)}
                    className="rounded-2xl bg-muted/50 p-3 text-left transition enabled:hover:bg-sage-soft disabled:opacity-50"
                  >
                    {m?.photos[0] ? (
                      <img src={m.photos[0]} alt="" className="mb-2 aspect-[4/3] w-full rounded-xl object-cover" />
                    ) : null}
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {count ? `${m!.flowers.length ? `🌸 ${m!.flowers.length} ` : ""}${m!.butterflies.length ? `🦋 ${m!.butterflies.length}` : ""}` : "—"}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function MonthSheet({
  month,
  onClose,
  onOpenMemory,
  onOpenYear,
}: {
  month?: GardenMonth;
  onClose: () => void;
  onOpenMemory: (id: string) => void;
  onOpenYear: (year: number) => void;
}) {
  return (
    <Sheet open={!!month} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {month ? (
          <>
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">
                {monthNames[month.month]} {month.year}
              </SheetTitle>
              <SheetDescription>A little book of what this month held.</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              {month.flowers.length ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Goals completed</h3>
                  {month.flowers.map((f) => (
                    <Link
                      key={f.id}
                      to="/goals/$goalId"
                      params={{ goalId: f.goalId }}
                      className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3 text-sm hover:bg-sage-soft"
                    >
                      <span>🌸 {f.title}</span>
                      <span className="text-xs text-muted-foreground">{formatGoalDateLong(f.completedOn)}</span>
                    </Link>
                  ))}
                </section>
              ) : null}
              {month.butterflies.length ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Memories</h3>
                  {month.butterflies.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onOpenMemory(b.id)}
                      className="flex w-full items-center justify-between rounded-2xl bg-muted/50 px-4 py-3 text-left text-sm hover:bg-lavender-soft"
                    >
                      <span>🦋 {b.title}</span>
                      <span className="text-xs text-muted-foreground">{formatGoalDateLong(b.date)}</span>
                    </button>
                  ))}
                </section>
              ) : null}
              {month.photos.length ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Photos</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {month.photos.map((src, i) => (
                      <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    ))}
                  </div>
                </section>
              ) : null}
              {month.reflections.length ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Reflections</h3>
                  {month.reflections.slice(0, 8).map((r, i) => (
                    <Link key={i} to="/goals/$goalId" params={{ goalId: r.goalId }} className="block rounded-2xl bg-muted/50 px-4 py-3 text-sm hover:bg-muted">
                      <p className="leading-relaxed">“{r.body}”</p>
                      <p className="mt-1 text-xs text-muted-foreground">{r.goalTitle}</p>
                    </Link>
                  ))}
                </section>
              ) : null}
              <Button variant="ghost" className="rounded-full" onClick={() => onOpenYear(month.year)}>
                Open the {month.year} Yearbook
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function HiveSheet({
  open,
  habits,
  onClose,
}: {
  open: boolean;
  habits: ReturnType<typeof buildHabits>;
  onClose: () => void;
}) {
  const active = habits.filter((h) => h.active).length;
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your beehive of consistency</SheetTitle>
          <SheetDescription>
            {habits.length
              ? `${habits.length} habit${habits.length === 1 ? "" : "s"} live here · ${active} buzzing right now. Resting bees never leave — your consistency is still here whenever you pick it back up.`
              : "No habits yet. Start a habit goal and your first bees will move in."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2 px-4 pb-6">
          {habits.map((h) => (
            <Link
              key={h.goalId}
              to="/goals/$goalId"
              params={{ goalId: h.goalId }}
              className="block rounded-2xl bg-muted/50 px-4 py-3 hover:bg-caution-soft"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{h.title}</span>
                <span className={h.active ? "text-xs text-sage" : "text-xs text-muted-foreground"}>
                  {h.active ? "🐝 Buzzing" : "💤 Resting"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[
                  h.streak ? `${h.streak}-day streak` : null,
                  h.activityCount ? `${h.activityCount} times so far` : null,
                  h.lastActivity ? `Last visit ${formatGoalDateLong(h.lastActivity.slice(0, 10))}` : "Waiting for its first visit",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Link>
          ))}
          {!habits.length ? (
            <Button asChild variant="secondary" className="rounded-full">
              <Link to="/goals">Start a habit</Link>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MemoryDialog({ open, memoryId, onClose }: { open: boolean; memoryId?: string; onClose: () => void }) {
  const { events, record } = useBloomContext();
  const existing = memoryId ? events.find((e) => e.id === memoryId) : undefined;
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(existing?.title ?? "");
    setDate((existing?.at ?? new Date().toISOString()).slice(0, 10));
    setDescription(existing?.description ?? "");
    setNotes(existing?.notes ?? "");
    setPhotos(existing?.photos ?? []);
  }, [open, existing?.id]);

  const save = () => {
    if (!title.trim()) return;
    const at = new Date(`${date}T12:00:00`).toISOString();
    const patch = { title: title.trim(), at, description, notes, photos };
    if (existing) updateEvent(existing.id, patch);
    else record({ category: "life-event", detail: "Life memory", origin: MEMORY_ORIGIN, ...patch });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{existing ? "A memory" : "Capture a memory"}</DialogTitle>
          <DialogDescription>A holiday, a new job, a birthday — it'll flutter in your garden.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mem-title">Title</Label>
            <Input id="mem-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekend in Cornwall" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mem-date">Date</Label>
            <Input id="mem-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mem-desc">What happened</Label>
            <Textarea id="mem-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mem-notes">Notes</Label>
            <Textarea id="mem-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you'd like to remember" />
          </div>
          <div className="space-y-2">
            <Label>Photos</Label>
            {photos.length ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((src, i) => (
                  <button key={i} type="button" className="group relative" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label="Remove photo">
                    <img src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    <span className="absolute inset-0 hidden items-center justify-center rounded-xl bg-card/60 text-xs group-hover:flex">Remove</span>
                  </button>
                ))}
              </div>
            ) : null}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = [...(e.target.files ?? [])];
                e.target.value = "";
                const added = await Promise.all(files.map((f) => fileToPhoto(f)));
                setPhotos((p) => [...p, ...added]);
              }}
            />
            <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => fileInput.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Add photo
            </Button>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {existing ? (
            <Button
              variant="ghost"
              className="rounded-full text-destructive"
              onClick={() => {
                removeEvent(existing.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" /> Let it go
            </Button>
          ) : (
            <span />
          )}
          <Button className="rounded-full" onClick={save} disabled={!title.trim()}>
            {existing ? "Save" : "Plant this memory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Link } from "@tanstack/react-router";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { eventCategoryMeta, type BloomEvent } from "../types";

const dot: Record<string, string> = {
  sage: "bg-sage",
  lavender: "bg-lavender",
  blush: "bg-blush",
  sky: "bg-sky",
  stone: "bg-stone",
};

const time = (at: string) =>
  new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const dayLabel = (at: string) => {
  const d = new Date(at);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
};

/** One row of the shared timeline. */
export function TimelineRow({ event }: { event: BloomEvent }) {
  const meta = eventCategoryMeta[event.category];
  return (
    <div className="flex gap-5">
      <span className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
        {time(event.at)}
      </span>
      <div className="relative min-w-0 flex-1 border-l border-border/50 pb-1 pl-5">
        <span
          className={cn("absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full", dot[meta.accent])}
        />
        <p className="text-sm font-medium">
          {event.goalId ? (
            <Link to="/goals/$goalId" params={{ goalId: event.goalId }} className="hover:underline">
              {event.title}
            </Link>
          ) : (
            event.title
          )}
        </p>
        {event.detail ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{event.detail}</p>
        ) : null}
        <p className="mt-1 text-[0.7rem] text-muted-foreground">
          {meta.label} · {event.source === "sync" ? `Synced${event.origin ? ` · ${event.origin}` : ""}` : "Manual"}
        </p>
      </div>
    </div>
  );
}

/** The whole feed, grouped by day. */
export function TimelineFeed({ events, empty }: { events: BloomEvent[]; empty?: string }) {
  if (!events.length) {
    return (
      <Card className="rounded-3xl border-transparent bg-card shadow-none">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {empty ?? "Nothing recorded yet — anything you log will appear here."}
        </CardContent>
      </Card>
    );
  }

  const groups: { day: string; items: BloomEvent[] }[] = [];
  for (const event of events) {
    const day = dayLabel(event.at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(event);
    else groups.push({ day, items: [event] });
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Card key={group.day} className="rounded-3xl border-transparent bg-card shadow-none">
          <CardContent className="space-y-5 px-7 py-7">
            <p className="text-sm font-medium text-muted-foreground">{group.day}</p>
            {group.items.map((event) => (
              <TimelineRow key={event.id} event={event} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

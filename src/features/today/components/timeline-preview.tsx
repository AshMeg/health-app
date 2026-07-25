import { Card, CardContent } from "@/components/ui/card";
import type { TimelineEvent } from "../types";

export function TimelinePreview({ events }: { events: TimelineEvent[] }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-4 p-5">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4">
            <span className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
              {event.time}
            </span>
            <div className="relative flex-1 border-l border-border/60 pb-1 pl-4 last:pb-0">
              <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              <p className="text-sm font-medium tracking-tight">{event.title}</p>
              {event.detail ? (
                <p className="text-xs text-muted-foreground">{event.detail}</p>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import type { TimelineEvent } from "../types";

export function TimelinePreview({ events }: { events: TimelineEvent[] }) {
  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-none">
      <CardContent className="space-y-5 px-7 py-7">
        {events.map((event) => (
          <div key={event.id} className="flex gap-5">
            <span className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
              {event.time}
            </span>
            <div className="relative flex-1 border-l border-border/50 pb-1 pl-5 last:pb-0">
              <span className="absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full bg-sage" />
              <p className="text-sm font-medium">{event.title}</p>
              {event.detail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

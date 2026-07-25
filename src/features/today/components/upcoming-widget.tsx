import { Sprout } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Calm placeholder for widgets whose data source isn't wired up yet.
 * Lets the layout system ship ahead of the underlying features.
 */
export function UpcomingWidget({ title, summary }: { title: string; summary: string }) {
  return (
    <Card className="rounded-3xl border border-dashed border-border/70 bg-transparent shadow-none">
      <CardContent className="flex items-start gap-4 p-7">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sage-soft text-sage">
          <Sprout className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}

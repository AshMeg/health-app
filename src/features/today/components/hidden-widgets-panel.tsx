import { Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WidgetDefinition, WidgetId } from "../types";

/** Restore surface for hidden widgets, shown while customising. */
export function HiddenWidgetsPanel({
  widgets,
  onShow,
  onReset,
}: {
  widgets: WidgetDefinition[];
  onShow: (id: WidgetId) => void;
  onReset: () => void;
}) {
  return (
    <Card className="rounded-3xl border-transparent bg-card/70 shadow-none">
      <CardContent className="space-y-5 p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-medium">Add a widget</h2>
            <p className="text-sm text-muted-foreground">
              Anything you hide lives here, alongside widgets coming to Bloom soon.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 rounded-full text-muted-foreground"
            onClick={onReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {widgets.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {widgets.map((widget) => (
              <button
                key={widget.id}
                type="button"
                onClick={() => onShow(widget.id)}
                className="group flex items-start gap-3 rounded-2xl bg-background/70 p-4 text-left transition-colors hover:bg-secondary"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 space-y-0.5">
                  <span className="block text-sm font-medium">
                    {widget.title}
                    {widget.upcoming ? (
                      <span className="ml-2 rounded-full bg-lavender-soft px-2 py-0.5 text-[0.65rem] font-normal text-lavender">
                        Soon
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {widget.summary}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Every widget is on your dashboard right now.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

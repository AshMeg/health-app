import { useState, type DragEvent } from "react";
import { ChevronDown, ChevronUp, EyeOff, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WidgetDefinition, WidgetId } from "../types";
import { widgetActions } from "../widgets/registry";

type Props = {
  widgets: WidgetDefinition[];
  editing: boolean;
  onMove: (id: WidgetId, targetId: WidgetId) => void;
  onShift: (id: WidgetId, direction: -1 | 1) => void;
  onHide: (id: WidgetId) => void;
};

/**
 * Generic layout surface for Today. Knows nothing about individual widgets —
 * it only arranges whatever the registry hands it, and provides reordering
 * and hiding while in edit mode.
 */
export function DashboardGrid({ widgets, editing, onMove, onShift, onHide }: Props) {
  const [dragId, setDragId] = useState<WidgetId | null>(null);
  const [overId, setOverId] = useState<WidgetId | null>(null);

  const handleDrop = (e: DragEvent, targetId: WidgetId) => {
    e.preventDefault();
    if (dragId) onMove(dragId, targetId);
    setDragId(null);
    setOverId(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {widgets.map((widget, index) => (
        <section
          key={widget.id}
          onDragOver={(e) => {
            if (!editing || !dragId) return;
            e.preventDefault();
            setOverId(widget.id);
          }}
          onDragLeave={() => setOverId((id) => (id === widget.id ? null : id))}
          onDrop={(e) => handleDrop(e, widget.id)}
          className={cn(
            "space-y-4 rounded-3xl transition-all duration-200",
            widget.span === "full" && "lg:col-span-2",
            editing && "bg-muted/40 p-4 ring-1 ring-border/60 sm:p-5",
            editing && dragId === widget.id && "opacity-50",
            editing && overId === widget.id && dragId !== widget.id && "ring-2 ring-primary/50",
          )}
        >
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {editing ? (
                <span
                  draggable
                  onDragStart={() => setDragId(widget.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  aria-label={`Reorder ${widget.title}`}
                  className="cursor-grab rounded-lg p-1 text-muted-foreground hover:bg-background active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
              ) : null}
              <h2 className="truncate text-base font-medium text-foreground/80">{widget.title}</h2>
            </div>

            {editing ? (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  aria-label={`Move ${widget.title} up`}
                  disabled={index === 0}
                  onClick={() => onShift(widget.id, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  aria-label={`Move ${widget.title} down`}
                  disabled={index === widgets.length - 1}
                  onClick={() => onShift(widget.id, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground"
                  disabled={widget.locked}
                  onClick={() => onHide(widget.id)}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  {widget.locked ? "Always on" : "Hide"}
                </Button>
              </div>
            ) : (
              (widgetActions[widget.id] ?? null)
            )}
          </header>

          {widget.render()}
        </section>
      ))}
    </div>
  );
}

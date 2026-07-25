import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BloomAccent } from "@/features/today/types";
import type { CheckItem } from "../../types";

const accentRing: Record<BloomAccent, string> = {
  sage: "bg-sage text-white",
  lavender: "bg-lavender text-white",
  blush: "bg-blush text-white",
  sky: "bg-sky text-white",
  stone: "bg-stone text-white",
};

/** Shared tickable list used by checklist and milestone tracking. */
export function CheckItemList({
  items,
  accent = "sage",
  onToggle,
  emptyLabel,
}: {
  items: CheckItem[];
  accent?: BloomAccent;
  onToggle: (id: string) => void;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onToggle(item.id)}
            aria-pressed={item.done}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors",
              item.done ? "bg-muted/50" : "bg-muted/60 hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors",
                item.done ? accentRing[accent] : "bg-card ring-1 ring-border",
              )}
            >
              {item.done ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 text-sm",
                item.done ? "text-muted-foreground line-through" : "",
              )}
            >
              {item.label}
            </span>
            {item.doneOn ? (
              <span className="shrink-0 text-xs text-muted-foreground">{item.doneOn}</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

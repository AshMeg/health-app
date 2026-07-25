import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FocusItem } from "../types";

export function FocusList({ items }: { items: FocusItem[] }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="divide-y divide-border/60 p-0">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-5">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                item.done
                  ? "border-success bg-success-soft text-success"
                  : "border-border bg-transparent",
              )}
            >
              {item.done ? <Check className="h-3 w-3" /> : null}
            </span>
            <div className="min-w-0 space-y-0.5">
              <p
                className={cn(
                  "text-sm font-medium tracking-tight",
                  item.done && "text-muted-foreground line-through",
                )}
              >
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

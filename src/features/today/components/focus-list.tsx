import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FocusItem } from "../types";

export function FocusList({ items }: { items: FocusItem[] }) {
  return (
    <Card className="h-full rounded-3xl border-transparent bg-card shadow-none">
      <CardContent className="divide-y divide-border/50 px-7 py-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3.5 py-5">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                item.done ? "bg-sage-soft text-sage" : "bg-muted",
              )}
            >
              {item.done ? <Check className="h-3 w-3" /> : null}
            </span>
            <div className="min-w-0 space-y-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  item.done && "text-muted-foreground line-through",
                )}
              >
                {item.title}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import { Check, Circle, RefreshCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LogState, LogStatusItem } from "../types";

const config: Record<LogState, { label: string; className: string; icon: typeof Check }> = {
  logged: { label: "Logged", className: "bg-success-soft text-success", icon: Check },
  synced: { label: "Synced", className: "bg-success-soft text-success", icon: RefreshCw },
  missing: { label: "Missing", className: "bg-muted text-muted-foreground", icon: Circle },
};

export function LogStatusList({ items }: { items: LogStatusItem[] }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="flex flex-wrap gap-2 p-5">
        {items.map((item) => {
          const { label, className, icon: Icon } = config[item.state];
          return (
            <span
              key={item.id}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                className,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label} {label}
            </span>
          );
        })}
      </CardContent>
    </Card>
  );
}

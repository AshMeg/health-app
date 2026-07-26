import { Link } from "@tanstack/react-router";
import { Check, Circle, RefreshCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LogState, LogStatusItem } from "../types";

const config: Record<LogState, { label: string; className: string; icon: typeof Check }> = {
  logged: { label: "Logged", className: "bg-sage-soft text-sage", icon: Check },
  synced: { label: "Synced", className: "bg-sky-soft text-sky", icon: RefreshCw },
  missing: { label: "Waiting", className: "bg-muted text-muted-foreground", icon: Circle },
};

export function LogStatusList({ items }: { items: LogStatusItem[] }) {
  return (
    <Card className="h-full rounded-3xl border-transparent bg-card shadow-none">
      <CardContent className="divide-y divide-border/50 px-7 py-3">
        {items.map((item) => {
          const { label, className, icon: Icon } = config[item.state];
          const pill = (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                className,
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          );

          const row = (
            <>
              <p className="min-w-0 truncate text-sm font-medium">{item.label}</p>
              {pill}
            </>
          );

          // Each line opens the page where that thing gets logged.
          return item.to ? (
            <Link
              key={item.id}
              to={item.to}
              className="flex items-center justify-between gap-3 py-5 transition-colors hover:text-foreground"
            >
              {row}
            </Link>
          ) : (
            <div key={item.id} className="flex items-center justify-between gap-3 py-5">
              {row}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

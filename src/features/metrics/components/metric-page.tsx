import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { BackButton } from "@/components/shared/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogEventDialog } from "@/features/timeline/components/log-event-dialog";
import { TimelineFeed } from "@/features/timeline/components/timeline-feed";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { quickAddSpecs, type QuickAddSpec } from "@/features/timeline/quick-add";
import { SummaryGrid } from "@/features/today/components/summary-stat-card";
import type { SummaryStat } from "@/features/today/types";

import type { MetricPageConfig } from "../config";

/**
 * One page, one question. Every metric page reads from Bloom's shared data,
 * lets you log right here, and shows the history behind the number.
 */
export function MetricPage({ config }: { config: MetricPageConfig }) {
  const { today, recent, events } = useBloomContext();
  const [spec, setSpec] = useState<QuickAddSpec | null>(null);
  const [open, setOpen] = useState(false);

  const stats: SummaryStat[] = config.readers
    .map((reader, i) => {
      const value = reader.read(today);
      if (!value) return null;
      return { id: `${reader.label}-${i}`, label: reader.label, value, unit: reader.unit };
    })
    .filter((s): s is SummaryStat => Boolean(s));

  const history = useMemo(
    () => events.filter((e) => config.categories.includes(e.category)),
    [events, config.categories],
  );

  const loggers = quickAddSpecs.filter((s) => config.quickAddIds.includes(s.id));

  // The last week, so slow-moving metrics still show a shape.
  const week = recent
    .map((day) => ({
      date: day.date,
      values: config.readers
        .map((r) => {
          const value = r.read(day);
          return value ? `${r.label} ${value}${r.unit ? ` ${r.unit}` : ""}` : null;
        })
        .filter(Boolean) as string[],
    }))
    .filter((d) => d.values.length);

  const openLogger = (item: QuickAddSpec) => {
    setSpec(item);
    setOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-20">
      <BackButton fallbackTo="/dashboard" fallbackLabel="Dashboard" />

      <header className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
          {config.title}
        </h1>
        <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">
          {config.question}
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{config.intro}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">Today</h2>
        {stats.length ? (
          <SummaryGrid stats={stats} />
        ) : (
          <Card className="rounded-3xl border-transparent bg-card shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nothing recorded for {config.title.toLowerCase()} today. Log something below and it
              will appear here, on your dashboard and in any goal it supports.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">Log it now</h2>
        <div className="flex flex-wrap gap-2.5">
          {loggers.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              className="rounded-full px-5 font-normal shadow-none transition-transform hover:-translate-y-0.5"
              onClick={() => openLogger(item)}
            >
              <Plus className="h-3.5 w-3.5" />
              {item.label}
            </Button>
          ))}
        </div>
      </section>

      {week.length ? (
        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground/80">Last 7 days</h2>
          <Card className="rounded-3xl border-transparent bg-card shadow-none">
            <CardContent className="divide-y divide-border/50 px-7 py-3">
              {week.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-wrap items-center justify-between gap-2 py-4"
                >
                  <span className="text-sm text-muted-foreground">
                    {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="text-sm font-medium">{day.values.join(" · ")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">History</h2>
        <TimelineFeed
          events={history}
          empty={`Nothing logged for ${config.title.toLowerCase()} yet.`}
        />
      </section>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Connected to {config.connectedTo}.
      </p>

      <LogEventDialog spec={spec} open={open} onOpenChange={setOpen} />
    </div>
  );
}

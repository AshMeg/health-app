import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { metricPages } from "@/features/metrics/config";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent } from "@/features/timeline/store";
import type { BloomEvent } from "@/features/timeline/types";
import { TrendPanel } from "@/features/trends/components/trend-panel";
import { cn } from "@/lib/utils";

import { measureOf, useMeasures } from "../model";
import { MeasurementDialog } from "./measurement-dialog";

const config = metricPages.measurements;

export function MeasurementsPage() {
  const { events } = useBloomContext();
  const { active } = useGoals();
  const { all, tracked, chosen, withData, toggle } = useMeasures(events);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; measure?: string; editing?: BloomEvent | null }>({ open: false });
  const [choosing, setChoosing] = useState(false);

  const current = tracked.find((m) => m.key === selected) ?? tracked[0];
  const history = current
    ? events
        .filter((e) => e.category === "measurement" && measureOf(e) === current.key)
        .sort((a, b) => b.at.localeCompare(a.at))
    : [];
  const latest = history[0];
  const relatedGoals = current
    ? active.filter(
        (g) =>
          g.tracking.method === "automatic" &&
          g.tracking.metric === "measurement" &&
          (g.tracking.measure ?? "waist") === current.key,
      )
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-20">
      <header className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">Measurements</h1>
        <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">{config.question}</p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Track only the measurements that matter to you. Weight lives on its own page.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {tracked.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSelected(m.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              current?.key === m.key ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80 hover:bg-muted/70",
            )}
          >
            {m.label}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setChoosing((c) => !c)}>
          {choosing ? "Done" : "Choose what you track"}
        </Button>
        <Button
          size="sm"
          className="ml-auto rounded-full px-4"
          onClick={() => setDialog({ open: true, measure: current?.key })}
        >
          <Plus className="h-3.5 w-3.5" /> Measurement
        </Button>
      </div>

      {choosing ? (
        <Card className="rounded-3xl border-transparent bg-card shadow-none">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Pick the measurements you want here. Anything you've already logged stays.
            </p>
            <div className="flex flex-wrap gap-2">
              {all.map((m) => {
                const on = chosen.includes(m.key) || withData.has(m.key);
                return (
                  <button
                    key={m.key}
                    type="button"
                    disabled={withData.has(m.key)}
                    onClick={() => toggle(m.key)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm transition-colors disabled:opacity-70",
                      on ? "bg-sage-soft text-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {on ? "✓ " : ""}
                    {m.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Need something else? Use "+ Measurement" and choose Custom.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!current ? (
        <Card className="rounded-3xl border-transparent bg-card shadow-none">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            You're not tracking any measurements yet. Choose one above or log your first.
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">{current.label}</h2>
            <Card className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-7">
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="font-display text-3xl font-medium">
                    {latest ? `${latest.value} ${current.unit}` : "—"}
                  </p>
                  {latest ? (
                    <p className="text-xs text-muted-foreground">
                      {new Date(latest.at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nothing logged yet</p>
                  )}
                </div>
                <Button variant="secondary" className="rounded-full" onClick={() => setDialog({ open: true, measure: current.key })}>
                  <Plus className="h-3.5 w-3.5" /> Log {current.label.toLowerCase()}
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">Over time</h2>
            <TrendPanel key={current.key} trends={[`measure:${current.key}`]} />
          </section>

          {relatedGoals.length ? (
            <section className="space-y-4">
              <h2 className="text-base font-medium text-foreground/80">Related goals</h2>
              <div className="flex flex-wrap gap-2.5">
                {relatedGoals.map((g) => (
                  <Link
                    key={g.id}
                    to="/goals/$goalId"
                    params={{ goalId: g.id }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-4 py-2 text-sm hover:bg-sage-soft/70"
                  >
                    <Target className="h-3.5 w-3.5 text-sage" />
                    {g.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">History</h2>
            {history.length ? (
              <Card className="rounded-3xl border-transparent bg-card shadow-none">
                <CardContent className="divide-y divide-border/50 px-7 py-2">
                  {history.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-3 py-3.5">
                      <span className="text-sm text-muted-foreground">
                        {new Date(e.at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="ml-auto text-sm font-medium">
                        {e.value} {e.unit ?? current.unit}
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" aria-label="Edit measurement" onClick={() => setDialog({ open: true, editing: e })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        aria-label="Delete measurement"
                        onClick={() => {
                          if (window.confirm("Delete this measurement?")) removeEvent(e.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">No {current.label.toLowerCase()} readings yet.</p>
            )}
          </section>
        </>
      )}

      <MeasurementDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        initialMeasure={dialog.measure}
        editing={dialog.editing}
      />
    </div>
  );
}

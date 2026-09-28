import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGoals } from "@/features/goals/hooks/use-goals";
import type { BloomGoal } from "@/features/goals/types";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";

import {
  analyse,
  confidenceLabel,
  periods,
  sourceGoalMetrics,
  sourceMeta,
  type AnalyticsPeriod,
  type Pattern,
  type PatternCategory,
} from "../engine";

const NOTICING_LIMIT = 4;

export function AnalyticsPage() {
  const { events, hydrated } = useBloomContext();
  const { active } = useGoals();
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [open, setOpen] = useState<Pattern | null>(null);
  const [category, setCategory] = useState<PatternCategory | "All">("All");

  const meta = periods.find((p) => p.id === period)!;
  const result = useMemo(() => analyse(events, meta.days), [events, meta.days]);

  const relatedGoals = (p: Pattern) =>
    active.filter(
      (g) =>
        g.tracking.method === "automatic" &&
        p.sources.some((s) => sourceGoalMetrics[s].includes((g.tracking as { metric: string }).metric)),
    );

  const noticing = result.patterns.slice(0, NOTICING_LIMIT);
  const categories = [...new Set(result.patterns.map((p) => p.category))];
  const explore = result.patterns.filter((p) => category === "All" || p.category === category);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-20">
      <header className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
          Analytics
        </h1>
        <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">
          Patterns and connections across your health, goals and life.
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Each health page shows what's happening with one thing. Here Bloom looks across them for
          relationships in your own data — observations, never proof that one thing causes another.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Time period">
        {periods.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={p.id === period ? "default" : "secondary"}
            className="rounded-full px-4 font-normal shadow-none"
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {!hydrated ? null : result.patterns.length === 0 ? (
        <EmptyState days={result.daysWithData} words={meta.words} />
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-base font-medium text-foreground/80">What Bloom is noticing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {noticing.map((p) => (
                <PatternCard key={p.id} pattern={p} goals={relatedGoals(p)} onOpen={() => setOpen(p)} />
              ))}
            </div>
          </section>

          {result.patterns.length > NOTICING_LIMIT ? (
            <section className="space-y-4">
              <h2 className="text-base font-medium text-foreground/80">Explore your data</h2>
              <div className="flex flex-wrap gap-2">
                {(["All", ...categories] as const).map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={c === category ? "default" : "secondary"}
                    className="rounded-full px-4 font-normal shadow-none"
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {explore.map((p) => (
                  <PatternCard key={p.id} pattern={p} goals={relatedGoals(p)} onOpen={() => setOpen(p)} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {hydrated && result.learning.length ? (
        <section className="space-y-4">
          <h2 className="text-base font-medium text-foreground/80">Still learning</h2>
          <Card className="rounded-3xl border-transparent bg-card shadow-none">
            <CardContent className="divide-y divide-border/50 px-7 py-3">
              {result.learning.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-4">
                  <div>
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.have} {l.have === 1 ? "day" : "days"} with both{" "}
                      {l.sources.map((s) => sourceMeta[s].label.toLowerCase()).join(" and ")} — Bloom
                      needs around {l.need}, with enough on both sides, to look for a pattern.
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <PatternDialog
        pattern={open}
        words={meta.words}
        goals={open ? relatedGoals(open) : []}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}

function SourceLinks({ pattern }: { pattern: Pattern }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {pattern.sources.map((s) => (
        <Link
          key={s}
          to={sourceMeta[s].to}
          className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground"
        >
          {sourceMeta[s].label}
        </Link>
      ))}
    </div>
  );
}

function PatternCard({
  pattern,
  goals,
  onOpen,
}: {
  pattern: Pattern;
  goals: BloomGoal[];
  onOpen: () => void;
}) {
  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-soft">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{pattern.title}</span>
          <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-xs text-sage">
            {confidenceLabel[pattern.confidence]}
          </span>
        </div>
        <p className="font-display text-lg leading-snug">{pattern.statement}</p>
        <SourceLinks pattern={pattern} />
        {goals.length ? (
          <div className="space-y-1">
            {goals.map((g) => (
              <Link
                key={g.id}
                to="/goals/$goalId"
                params={{ goalId: g.id }}
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                Related goal: {g.title} →
              </Link>
            ))}
          </div>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mt-auto gap-1.5 self-start"
          onClick={onOpen}
        >
          See the evidence
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

function PatternDialog({
  pattern,
  words,
  goals,
  onClose,
}: {
  pattern: Pattern | null;
  words: string;
  goals: BloomGoal[];
  onClose: () => void;
}) {
  const max = pattern ? Math.max(...pattern.groups.map((g) => Math.abs(g.value)), 1e-9) : 1;
  return (
    <Dialog open={!!pattern} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        {pattern ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-medium">{pattern.title}</DialogTitle>
              <DialogDescription className="text-base leading-relaxed text-foreground/80">
                {pattern.statement}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 text-sm">
              <div className="space-y-3">
                <h3 className="font-medium">What Bloom found</h3>
                {pattern.groups.map((g) => (
                  <div key={g.label} className="space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        {g.label} ({g.count} days)
                      </span>
                      <span className="font-medium">{g.average}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-sage"
                        style={{ width: `${Math.max(4, (Math.abs(g.value) / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Fact k="Compared" v={pattern.compared} />
                <Fact k="Time period" v={words.charAt(0).toUpperCase() + words.slice(1)} />
                <Fact k="Evidence" v={`${pattern.observations} days with both kinds of data`} />
                <Fact k="Confidence" v={confidenceLabel[pattern.confidence]} />
              </dl>
              <div className="space-y-1">
                <h3 className="font-medium">What this means</h3>
                <p className="leading-relaxed text-muted-foreground">
                  This is an observation from your own data, not proof that one causes the other.{" "}
                  {pattern.limitation}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Look closer</h3>
                <SourceLinks pattern={pattern} />
                {goals.map((g) => (
                  <Link
                    key={g.id}
                    to="/goals/$goalId"
                    params={{ goalId: g.id }}
                    className="block text-muted-foreground hover:text-foreground"
                  >
                    Related goal: {g.title} →
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="leading-snug">{v}</dd>
    </div>
  );
}

const DAYS_NEEDED = 12;

function EmptyState({ days, words }: { days: number; words: string }) {
  const reached = days >= DAYS_NEEDED;
  const shown = Math.min(days, DAYS_NEEDED);
  return (
    <Card className="rounded-[2rem] border-transparent bg-card shadow-soft">
      <CardContent className="mx-auto flex max-w-md flex-col items-center gap-5 px-8 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-soft">
          <Sprout className="h-6 w-6 text-sage" />
        </div>
        <p className="font-display text-2xl font-medium">We're planting the seeds. 🌱</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Bloom needs a little more time to learn your patterns. Keep logging consistently and,
          once there are enough days of data, we'll start looking for meaningful connections
          across your health, goals and life.
        </p>
        <div className="w-full space-y-2 rounded-2xl bg-muted/50 px-5 py-4">
          {reached ? (
            <p className="text-sm leading-relaxed">
              You've given Bloom enough data to start looking, but some patterns need more
              observations before they're reliable.
            </p>
          ) : (
            <p className="text-sm">Your first patterns will appear after {DAYS_NEEDED} days of data.</p>
          )}
          <div
            className="h-2 rounded-full bg-background"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={DAYS_NEEDED}
            aria-valuenow={shown}
          >
            <div
              className="h-2 rounded-full bg-sage transition-all"
              style={{ width: `${(shown / DAYS_NEEDED) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {reached ? `${days} days logged` : `${days} of ${DAYS_NEEDED} days logged`} in {words}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

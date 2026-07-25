import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { suggestMeasures, type MeasureSuggestion } from "../measure-suggestions";
import {
  goalMeasureMeta,
  goalTypeMeta,
  type BloomGoal,
  type GoalType,
} from "../types";

const steps = [
  "Your goal",
  "Type",
  "Why",
  "Measure",
  "Target",
  "Deadline",
  "Review",
] as const;

type Draft = {
  title: string;
  type: GoalType | null;
  why: string;
  measureId: string | null;
  unit: string;
  start: string;
  target: string;
  targetOn: string;
  targetDate: string;
};

const emptyDraft: Draft = {
  title: "",
  type: null,
  why: "",
  measureId: null,
  unit: "",
  start: "",
  target: "",
  targetOn: "",
  targetDate: "",
};

function OptionTile({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl px-5 py-4 text-left transition-colors",
        selected ? "bg-sage-soft ring-1 ring-sage/40" : "bg-muted/60 hover:bg-muted",
      )}
      aria-pressed={selected}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{title}</span>
        {selected ? <Check className="h-4 w-4 shrink-0 text-sage" /> : null}
      </span>
      {description ? (
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      ) : null}
    </button>
  );
}

export function CreateGoalDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (goal: BloomGoal) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const suggestions = useMemo(
    () => suggestMeasures(draft.title, draft.type),
    [draft.title, draft.type],
  );

  const measure: MeasureSuggestion | undefined = useMemo(
    () => suggestions.find((s) => s.id === draft.measureId),
    [suggestions, draft.measureId],
  );

  // Drop a selection that no longer exists after the title or type changed.
  useEffect(() => {
    if (draft.measureId && !suggestions.some((s) => s.id === draft.measureId)) {
      setDraft((d) => ({ ...d, measureId: null }));
    }
  }, [suggestions, draft.measureId]);

  const meta = measure ? goalMeasureMeta[measure.kind] : null;
  const needsTarget = Boolean(meta?.needsTarget) || measure?.kind === "date";
  const unit = measure ? (measure.unit === "" || measure.kind === "custom" ? draft.unit : measure.unit ?? "") : "";

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return draft.title.trim().length > 1;
      case 1:
        return Boolean(draft.type);
      case 3:
        return Boolean(measure);
      case 4:
        if (!needsTarget) return true;
        if (measure?.kind === "date") return draft.targetOn !== "";
        return draft.target.trim() !== "" && !Number.isNaN(Number(draft.target));
      default:
        return true;
    }
  }, [draft, step, measure, needsTarget]);

  const reset = () => {
    setStep(0);
    setDraft(emptyDraft);
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(reset, 200);
  };

  /** Target step is skipped entirely for goals that don't need one. */
  const goNext = () => {
    setStep((s) => (s === 3 && !needsTarget ? 5 : s + 1));
  };

  const goBack = () => {
    if (step === 0) return close(false);
    setStep((s) => (s === 5 && !needsTarget ? 3 : s - 1));
  };

  const save = () => {
    if (!draft.type || !measure) return;
    const today = new Date().toISOString().slice(0, 10);
    const start = draft.start.trim() === "" ? 0 : Number(draft.start);
    const hasNumericTarget = needsTarget && measure.kind !== "date";

    const goal: BloomGoal = {
      id: `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "goal"}-${Date.now().toString(36)}`,
      title: draft.title.trim(),
      type: draft.type,
      why: draft.why.trim() || undefined,
      measure: {
        kind: measure.kind,
        metric: measure.metric,
        unit: unit || undefined,
        start: hasNumericTarget ? start : undefined,
        target: hasNumericTarget ? Number(draft.target) : undefined,
        targetOn: measure.kind === "date" ? draft.targetOn || undefined : undefined,
      },
      current: hasNumericTarget ? start : undefined,
      done: false,
      startDate: today,
      targetDate: draft.targetDate || undefined,
      status: "on-track",
      accent: goalTypeMeta[draft.type].accent,
      updates: [{ id: "created", date: "Today", title: "Goal created" }],
    };
    onCreate(goal);
    close(false);
  };

  const reviewRows: [string, string][] = [
    ["Goal", draft.title || "—"],
    ["Type", draft.type ? goalTypeMeta[draft.type].label : "—"],
    ["Why", draft.why || "Not set"],
    ["Measured by", measure ? measure.label : "—"],
    [
      "Target",
      measure?.kind === "date"
        ? draft.targetOn || "—"
        : needsTarget
          ? `${draft.target || "—"}${unit ? ` ${unit}` : measure?.kind === "percentage" ? "%" : ""}`
          : "Not needed for this goal",
    ],
    ["Deadline", draft.targetDate || "Open-ended"],
  ];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="font-display text-xl font-medium">Create a goal</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {steps.length} · {steps[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-sage" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="space-y-4 py-2">
          {step === 0 ? (
            <div className="space-y-2">
              <Label htmlFor="goal-title">What would you like to achieve?</Label>
              <Textarea
                id="goal-title"
                value={draft.title}
                rows={3}
                placeholder="In your own words — “Feel calmer in the evenings”, “Book a trip to Lisbon”…"
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Say it however it makes sense to you. Bloom will work out how to follow along.
              </p>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              {(Object.keys(goalTypeMeta) as GoalType[]).map((t) => (
                <OptionTile
                  key={t}
                  selected={draft.type === t}
                  title={goalTypeMeta[t].label}
                  description={goalTypeMeta[t].description}
                  onClick={() => setDraft((d) => ({ ...d, type: t }))}
                />
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-2">
              <Label htmlFor="goal-why">Why does this matter to you?</Label>
              <Textarea
                id="goal-why"
                value={draft.why}
                rows={4}
                placeholder="Optional — a sentence to come back to on harder days."
                onChange={(e) => setDraft((d) => ({ ...d, why: e.target.value }))}
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                How should Bloom measure success? Not every goal needs a number.
              </p>
              {suggestions.map((s) => (
                <OptionTile
                  key={s.id}
                  selected={draft.measureId === s.id}
                  title={s.label}
                  description={s.hint}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      measureId: s.id,
                      unit: s.unit ?? "",
                      target: s.target !== undefined ? String(s.target) : "",
                    }))
                  }
                />
              ))}
            </div>
          ) : null}

          {step === 4 && needsTarget ? (
            <div className="space-y-4">
              {measure?.kind === "date" ? (
                <div className="space-y-2">
                  <Label htmlFor="goal-target-on">Which day are you aiming for?</Label>
                  <Input
                    id="goal-target-on"
                    type="date"
                    value={draft.targetOn}
                    onChange={(e) => setDraft((d) => ({ ...d, targetOn: e.target.value }))}
                  />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="goal-start">Starting from</Label>
                      <Input
                        id="goal-start"
                        inputMode="decimal"
                        value={draft.start}
                        placeholder="0"
                        onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-target">Target</Label>
                      <Input
                        id="goal-target"
                        inputMode="decimal"
                        value={draft.target}
                        placeholder={measure?.kind === "percentage" ? "100" : "10"}
                        onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))}
                      />
                    </div>
                  </div>
                  {meta?.needsUnit ? (
                    <div className="space-y-2">
                      <Label htmlFor="goal-unit">Unit</Label>
                      <Input
                        id="goal-unit"
                        value={draft.unit}
                        placeholder="kg, sessions, minutes, pages…"
                        onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {measure?.kind === "percentage"
                        ? "Measured as a percentage."
                        : "Measured as a rating out of ten."}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-2">
              <Label htmlFor="goal-deadline">Is there a date you'd like to reach it by?</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={draft.targetDate}
                onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Optional — goals are allowed to be open-ended.
              </p>
            </div>
          ) : null}

          {step === 6 ? (
            <dl className="divide-y divide-border/50 rounded-2xl bg-muted/50 px-5">
              {reviewRows.map(([label, value]) => (
                <div key={label} className="flex gap-4 py-3.5 text-sm">
                  <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 flex-1 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="ghost" onClick={goBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step === steps.length - 1 ? (
            <Button onClick={save}>Save goal</Button>
          ) : (
            <Button onClick={goNext} disabled={!canContinue} className="gap-1.5">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

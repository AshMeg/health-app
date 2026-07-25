import { useMemo, useState } from "react";
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
import {
  goalMetricMeta,
  goalTypeMeta,
  type BloomGoal,
  type GoalMetric,
  type GoalType,
} from "../types";

const steps = [
  "Goal type",
  "Name",
  "Why",
  "Measure",
  "Target",
  "Deadline",
  "Review",
] as const;

const metricOrder: GoalMetric[] = [
  "weight",
  "protein",
  "water",
  "sleep",
  "training",
  "mood",
  "journal",
  "custom",
];

type Draft = {
  type: GoalType | null;
  title: string;
  why: string;
  metric: GoalMetric | null;
  start: string;
  target: string;
  unit: string;
  targetDate: string;
};

const emptyDraft: Draft = {
  type: null,
  title: "",
  why: "",
  metric: null,
  start: "",
  target: "",
  unit: "",
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

  const unit = draft.metric ? (draft.metric === "custom" ? draft.unit : goalMetricMeta[draft.metric].unit) : "";

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(draft.type);
      case 1:
        return draft.title.trim().length > 1;
      case 3:
        return Boolean(draft.metric);
      case 4:
        return draft.target.trim() !== "" && !Number.isNaN(Number(draft.target));
      case 5:
        return draft.targetDate !== "";
      default:
        return true;
    }
  }, [draft, step]);

  const reset = () => {
    setStep(0);
    setDraft(emptyDraft);
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(reset, 200);
  };

  const save = () => {
    if (!draft.type || !draft.metric) return;
    const today = new Date().toISOString().slice(0, 10);
    const start = draft.start.trim() === "" ? 0 : Number(draft.start);
    const goal: BloomGoal = {
      id: `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "goal"}-${Date.now().toString(36)}`,
      title: draft.title.trim(),
      type: draft.type,
      metric: draft.metric,
      why: draft.why.trim() || undefined,
      current: start,
      start,
      target: Number(draft.target),
      unit,
      startDate: today,
      targetDate: draft.targetDate,
      status: "on-track",
      accent: goalTypeMeta[draft.type].accent,
      updates: [{ id: "created", date: "Today", title: "Goal created" }],
    };
    onCreate(goal);
    close(false);
  };

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

          {step === 1 ? (
            <div className="space-y-2">
              <Label htmlFor="goal-title">What would you like to call it?</Label>
              <Input
                id="goal-title"
                value={draft.title}
                placeholder="Lose 5 kg"
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                autoFocus
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-2">
              <Label htmlFor="goal-why">Why does this goal matter to you?</Label>
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
            <div className="grid gap-3 sm:grid-cols-2">
              {metricOrder.map((m) => (
                <OptionTile
                  key={m}
                  selected={draft.metric === m}
                  title={goalMetricMeta[m].label}
                  onClick={() => setDraft((d) => ({ ...d, metric: m }))}
                />
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
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
                    placeholder="68"
                    onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))}
                  />
                </div>
              </div>
              {draft.metric === "custom" ? (
                <div className="space-y-2">
                  <Label htmlFor="goal-unit">Unit</Label>
                  <Input
                    id="goal-unit"
                    value={draft.unit}
                    placeholder="pages, minutes, days…"
                    onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Measured in {unit || "your own units"}.
                </p>
              )}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-2">
              <Label htmlFor="goal-deadline">When would you like to reach it?</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={draft.targetDate}
                onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value }))}
              />
            </div>
          ) : null}

          {step === 6 ? (
            <dl className="divide-y divide-border/50 rounded-2xl bg-muted/50 px-5">
              {[
                ["Type", draft.type ? goalTypeMeta[draft.type].label : "—"],
                ["Name", draft.title || "—"],
                ["Why", draft.why || "Not set"],
                ["Measured by", draft.metric ? goalMetricMeta[draft.metric].label : "—"],
                ["Target", `${draft.target || "—"}${unit ? ` ${unit}` : ""}`],
                ["Deadline", draft.targetDate || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 py-3.5 text-sm">
                  <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 flex-1 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? close(false) : setStep((s) => s - 1))}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step === steps.length - 1 ? (
            <Button onClick={save}>Save goal</Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue} className="gap-1.5">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

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
  defaultTracking,
  recommendTracking,
  suggestNextStep,
} from "../recommend-tracking";
import { GoalTemplatePicker } from "./goal-template-picker";
import { makeUpdate } from "../timeline";
import type { GoalTemplate } from "../templates";
import { trackingMethods, trackingRegistry } from "./tracking/registry";
import {
  goalTypeMeta,
  type BloomGoal,
  type GoalTracking,
  type GoalType,
  type TrackingMethod,
} from "../types";

const steps = ["Your goal", "Type", "Why", "Tracking", "Set it up", "Deadline", "Review"] as const;

type Draft = {
  title: string;
  type: GoalType | null;
  why: string;
  method: TrackingMethod | null;
  /** Free-text setup values, interpreted per tracking method. */
  target: string;
  unit: string;
  start: string;
  items: string;
  targetDate: string;
};

const emptyDraft: Draft = {
  title: "",
  type: null,
  why: "",
  method: null,
  target: "",
  unit: "",
  start: "",
  items: "",
  targetDate: "",
};

function OptionTile({
  selected,
  title,
  description,
  badge,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  badge?: string;
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
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-lavender-soft px-2.5 py-0.5 text-xs text-lavender">
              <Sparkles className="h-3 w-3" />
              {badge}
            </span>
          ) : null}
        </span>
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
  const [picking, setPicking] = useState(true);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [touchedMethod, setTouchedMethod] = useState(false);

  const recommendation = useMemo(
    () => recommendTracking(draft.title, draft.type),
    [draft.title, draft.type],
  );

  // Bloom's suggestion leads, but the user can always pick another method.
  useEffect(() => {
    if (!touchedMethod) setDraft((d) => ({ ...d, method: recommendation.method }));
  }, [recommendation.method, touchedMethod]);

  const method = draft.method ?? recommendation.method;

  /** Starting shape for the chosen method, then refined by the setup step. */
  const baseTracking: GoalTracking = useMemo(() => {
    return method === recommendation.method
      ? recommendation.draft(draft.title)
      : defaultTracking[method](draft.title);
  }, [method, recommendation, draft.title]);

  const buildTracking = (): GoalTracking => {
    const num = (value: string, fallback: number) =>
      value.trim() === "" || Number.isNaN(Number(value)) ? fallback : Number(value);

    switch (baseTracking.method) {
      case "automatic": {
        const start = num(draft.start, baseTracking.start);
        return {
          ...baseTracking,
          unit: draft.unit.trim() || baseTracking.unit,
          start,
          current: start,
          target: num(draft.target, baseTracking.target),
        };
      }
      case "repetition":
        return {
          ...baseTracking,
          unit: draft.unit.trim() || baseTracking.unit,
          target: num(draft.target, baseTracking.target),
        };
      case "streak":
        return { ...baseTracking, targetDays: num(draft.target, baseTracking.targetDays) };
      case "checklist":
      case "milestone": {
        const labels = draft.items
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const items = labels.length
          ? labels.map((label, i) => ({ id: `i${i + 1}`, label, done: false }))
          : baseTracking.method === "checklist"
            ? baseTracking.items
            : baseTracking.milestones;
        return baseTracking.method === "checklist"
          ? { ...baseTracking, items }
          : { ...baseTracking, milestones: items };
      }
      case "reflection":
        return baseTracking;
    }
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return draft.title.trim().length > 1;
      case 1:
        return Boolean(draft.type);
      default:
        return true;
    }
  }, [draft, step]);

  const reset = () => {
    setPicking(true);
    setStep(0);
    setDraft(emptyDraft);
    setTouchedMethod(false);
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(reset, 200);
  };

  /** A template fills in what it knows and drops you straight into the flow. */
  const startFromTemplate = (template: GoalTemplate) => {
    setDraft({ ...emptyDraft, title: template.title, type: template.type });
    if (template.method) {
      setTouchedMethod(true);
      setDraft((d) => ({ ...d, method: template.method ?? null }));
    }
    setPicking(false);
    setStep(0);
  };

  const save = () => {
    if (!draft.type) return;
    const tracking = buildTracking();
    const goal: BloomGoal = {
      id: `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "goal"}-${Date.now().toString(36)}`,
      title: draft.title.trim(),
      type: draft.type,
      why: draft.why.trim() || undefined,
      tracking,
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: draft.targetDate || undefined,
      accent: goalTypeMeta[draft.type].accent,
      nextStep: suggestNextStep(draft.title, tracking.method),
      notes: [],
      updates: [makeUpdate("created", "Goal created", draft.why.trim() || undefined)],
    };
    onCreate(goal);
    close(false);
  };


  const setupSummary = () => {
    const t = buildTracking();
    return trackingRegistry[t.method].summary(t);
  };

  const reviewRows: [string, string][] = [
    ["Goal", draft.title || "—"],
    ["Type", draft.type ? goalTypeMeta[draft.type].label : "—"],
    ["Why", draft.why || "Not set"],
    ["Tracked by", trackingRegistry[method].label],
    ["Set up as", setupSummary()],
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
                placeholder="In your own words — “Go on two dates”, “Be kinder to myself”…"
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Say it however it makes sense to you. Bloom will suggest how to follow along.
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
                Bloom suggests <span className="text-foreground">{trackingRegistry[recommendation.method].label}</span> — {recommendation.reason} You can pick anything else.
              </p>
              {[
                recommendation.method,
                ...trackingMethods.filter((m) => m !== recommendation.method),
              ].map((m) => (
                <OptionTile
                  key={m}
                  selected={method === m}
                  title={trackingRegistry[m].label}
                  description={`${trackingRegistry[m].description} ${trackingRegistry[m].examples}`}
                  badge={m === recommendation.method ? "Suggested" : undefined}
                  onClick={() => {
                    setTouchedMethod(true);
                    setDraft((d) => ({ ...d, method: m, target: "", unit: "", start: "", items: "" }));
                  }}
                />
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              {baseTracking.method === "automatic" ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    id="start"
                    label="Starting at"
                    value={draft.start}
                    placeholder={String(baseTracking.start)}
                    onChange={(v) => setDraft((d) => ({ ...d, start: v }))}
                  />
                  <Field
                    id="target"
                    label="Target"
                    value={draft.target}
                    placeholder={String(baseTracking.target)}
                    onChange={(v) => setDraft((d) => ({ ...d, target: v }))}
                  />
                  <Field
                    id="unit"
                    label="Unit"
                    value={draft.unit}
                    placeholder={baseTracking.unit || "kg"}
                    onChange={(v) => setDraft((d) => ({ ...d, unit: v }))}
                  />
                </div>
              ) : null}

              {baseTracking.method === "repetition" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="target"
                    label="How many times?"
                    value={draft.target}
                    placeholder={String(baseTracking.target)}
                    onChange={(v) => setDraft((d) => ({ ...d, target: v }))}
                  />
                  <Field
                    id="unit"
                    label="Called"
                    value={draft.unit}
                    placeholder={baseTracking.unit}
                    onChange={(v) => setDraft((d) => ({ ...d, unit: v }))}
                  />
                </div>
              ) : null}

              {baseTracking.method === "streak" ? (
                <Field
                  id="target"
                  label="How many days in a row are you aiming for?"
                  value={draft.target}
                  placeholder={String(baseTracking.targetDays)}
                  onChange={(v) => setDraft((d) => ({ ...d, target: v }))}
                />
              ) : null}

              {baseTracking.method === "checklist" || baseTracking.method === "milestone" ? (
                <div className="space-y-2">
                  <Label htmlFor="goal-items">
                    {baseTracking.method === "checklist" ? "What needs ticking off?" : "What are the milestones?"}
                  </Label>
                  <Textarea
                    id="goal-items"
                    rows={5}
                    value={draft.items}
                    placeholder={"One per line\nDate 1\nDate 2"}
                    onChange={(e) => setDraft((d) => ({ ...d, items: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave it blank and Bloom will start you off with a simple list.
                  </p>
                </div>
              ) : null}

              {baseTracking.method === "reflection" ? (
                <p className="rounded-2xl bg-muted/60 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  Nothing to set up. Bloom will ask how you feel you're progressing each week, and
                  you can add a note whenever you'd like.
                </p>
              ) : null}
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
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
              className="gap-1.5"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`goal-${id}`}>{label}</Label>
      <Input
        id={`goal-${id}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

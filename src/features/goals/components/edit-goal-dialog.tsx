import { useEffect, useState } from "react";

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
import { GoalNotes } from "./goal-notes";
import { MilestoneList } from "./milestones/milestone-list";
import { trackingMethods, trackingRegistry } from "./tracking/registry";
import { defaultTracking } from "../recommend-tracking";
import {
  goalTypeMeta,
  type BloomGoal,
  type GoalMilestone,
  type GoalNote,
  type GoalTracking,
  type GoalType,
  type TrackingMethod,
} from "../types";

type Draft = {
  title: string;
  why: string;
  type: GoalType;
  method: TrackingMethod;
  tracking: GoalTracking;
  target: string;
  unit: string;
  targetDate: string;
  milestones: GoalMilestone[];
  notes: GoalNote[];
};

/** The editable numbers for a tracking method, as text so fields stay friendly. */
function targetFields(tracking: GoalTracking): { target: string; unit: string } {
  switch (tracking.method) {
    case "automatic":
      return { target: String(tracking.target), unit: tracking.unit };
    case "repetition":
      return { target: String(tracking.target), unit: tracking.unit };
    case "streak":
      return { target: String(tracking.targetDays), unit: tracking.cadence };
    default:
      return { target: "", unit: "" };
  }
}

function applyTargets(tracking: GoalTracking, target: string, unit: string): GoalTracking {
  const num = (value: string, fallback: number) =>
    value.trim() === "" || Number.isNaN(Number(value)) ? fallback : Number(value);

  switch (tracking.method) {
    case "automatic":
      return { ...tracking, target: num(target, tracking.target), unit: unit.trim() || tracking.unit };
    case "repetition":
      return { ...tracking, target: num(target, tracking.target), unit: unit.trim() || tracking.unit };
    case "streak":
      return {
        ...tracking,
        targetDays: num(target, tracking.targetDays),
        cadence: unit.trim() || tracking.cadence,
      };
    default:
      return tracking;
  }
}

function fromGoal(goal: BloomGoal): Draft {
  const fields = targetFields(goal.tracking);
  return {
    title: goal.title,
    why: goal.why ?? "",
    type: goal.type,
    method: goal.tracking.method,
    tracking: goal.tracking,
    target: fields.target,
    unit: fields.unit,
    targetDate: goal.targetDate ?? "",
    milestones: goal.milestones ?? [],
    notes: goal.notes,
  };
}

/**
 * One screen for everything about a goal: what it is, how it's followed, its
 * steps and its notes. Saving records a single timeline entry.
 */
export function EditGoalDialog({
  goal,
  open,
  onOpenChange,
  onSave,
}: {
  goal: BloomGoal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<BloomGoal>, changed: string[]) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => fromGoal(goal));

  // Reopening the dialog always starts from the goal as it is now.
  useEffect(() => {
    if (open) setDraft(fromGoal(goal));
  }, [open, goal]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const pickMethod = (method: TrackingMethod) => {
    if (method === draft.method) return;
    // Switching method starts that method from a sensible shape.
    const tracking = defaultTracking[method](draft.title);
    const fields = targetFields(tracking);
    setDraft((d) => ({ ...d, method, tracking, target: fields.target, unit: fields.unit }));
  };

  const addNote = (body: string) =>
    set("notes", [
      { id: `n${Date.now().toString(36)}`, date: new Date().toISOString(), body: body.trim() },
      ...draft.notes,
    ]);

  const editNote = (noteId: string, body: string) =>
    set(
      "notes",
      draft.notes.map((n) =>
        n.id === noteId ? { ...n, body: body.trim(), editedAt: new Date().toISOString() } : n,
      ),
    );

  const deleteNote = (noteId: string) =>
    set(
      "notes",
      draft.notes.filter((n) => n.id !== noteId),
    );

  const save = () => {
    const title = draft.title.trim() || goal.title;
    const why = draft.why.trim() || undefined;
    const tracking = applyTargets(draft.tracking, draft.target, draft.unit);
    const milestones = draft.milestones.filter((m) => m.label.trim());
    const targetDate = draft.targetDate || undefined;

    const changed: string[] = [];
    if (title !== goal.title) changed.push("the title");
    if (why !== goal.why) changed.push("the description");
    if (draft.type !== goal.type) changed.push("the category");
    if (draft.method !== goal.tracking.method) changed.push("how it's tracked");
    else if (JSON.stringify(tracking) !== JSON.stringify(goal.tracking)) changed.push("the target");
    if (targetDate !== goal.targetDate) changed.push("the deadline");
    if (JSON.stringify(milestones) !== JSON.stringify(goal.milestones ?? []))
      changed.push("the steps");
    if (JSON.stringify(draft.notes) !== JSON.stringify(goal.notes)) changed.push("the notes");

    onSave(
      {
        title,
        why,
        type: draft.type,
        accent: goalTypeMeta[draft.type].accent,
        tracking,
        milestones: milestones.length ? milestones : undefined,
        targetDate,
        notes: draft.notes,
      },
      changed,
    );
    onOpenChange(false);
  };

  const showTargets = ["automatic", "repetition", "streak"].includes(draft.method);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="font-display text-xl font-medium">Edit this goal</DialogTitle>
          <DialogDescription>
            Goals are allowed to change shape. Nothing you've recorded will be lost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-7 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Goal title</Label>
            <Input
              id="edit-title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-why">Description</Label>
            <Textarea
              id="edit-why"
              rows={3}
              value={draft.why}
              placeholder="Why this matters to you."
              onChange={(e) => set("why", e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(goalTypeMeta) as GoalType[]).map((t) => (
                <Chip
                  key={t}
                  selected={draft.type === t}
                  label={goalTypeMeta[t].label}
                  onClick={() => set("type", t)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tracking method</Label>
            <div className="flex flex-wrap gap-2">
              {trackingMethods.map((m) => (
                <Chip
                  key={m}
                  selected={draft.method === m}
                  label={m === "milestone" ? "Smaller steps" : trackingRegistry[m].label}
                  onClick={() => pickMethod(m)}
                />
              ))}
            </div>
            {draft.method !== goal.tracking.method ? (
              <p className="text-xs text-muted-foreground">
                Changing this starts the new method fresh — your notes, steps and timeline stay.
              </p>
            ) : null}
          </div>

          {showTargets ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-target">
                  {draft.method === "streak" ? "Days in a row" : "Target"}
                </Label>
                <Input
                  id="edit-target"
                  value={draft.target}
                  onChange={(e) => set("target", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">
                  {draft.method === "streak" ? "How often" : "Unit"}
                </Label>
                <Input
                  id="edit-unit"
                  value={draft.unit}
                  onChange={(e) => set("unit", e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="edit-deadline">Deadline</Label>
            <Input
              id="edit-deadline"
              type="date"
              value={draft.targetDate}
              onChange={(e) => set("targetDate", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave it empty to keep this goal open-ended.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Steps</Label>
            <div className="rounded-2xl bg-muted/40 p-4">
              <MilestoneList
                milestones={draft.milestones}
                onChange={(milestones) => set("milestones", milestones)}
                accent={goalTypeMeta[draft.type].accent}
                addLabel="Add a step"
                emptyLabel="No steps yet — add one below if it helps."
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Notes</Label>
            <GoalNotes
              notes={draft.notes}
              onAdd={addNote}
              onEdit={editNote}
              onDelete={deleteNote}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full px-4 py-2 text-sm transition-colors",
        selected
          ? "bg-sage-soft text-foreground ring-1 ring-sage/40"
          : "bg-muted/60 text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

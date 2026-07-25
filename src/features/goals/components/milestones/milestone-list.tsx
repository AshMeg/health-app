import { useState, type DragEvent } from "react";
import { Check, ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BloomAccent } from "@/features/today/types";
import { makeMilestone, reorderMilestones } from "../../milestones";
import type { GoalMilestone } from "../../types";

const accentFill: Record<BloomAccent, string> = {
  sage: "bg-sage text-white",
  lavender: "bg-lavender text-white",
  blush: "bg-blush text-white",
  sky: "bg-sky text-white",
  stone: "bg-stone text-white",
};

const todayShort = () =>
  new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * The one milestone surface in Bloom — used while creating a goal and again on
 * the goal detail page. It only ever edits the array it's given, so whoever
 * owns the milestones decides how they're stored.
 */
export function MilestoneList({
  milestones,
  onChange,
  accent = "sage",
  addLabel = "Add a milestone",
  emptyLabel = "No milestones yet — add the first step below.",
}: {
  milestones: GoalMilestone[];
  onChange: (next: GoalMilestone[]) => void;
  accent?: BloomAccent;
  addLabel?: string;
  emptyLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const patch = (id: string, changes: Partial<GoalMilestone>) =>
    onChange(milestones.map((m) => (m.id === id ? { ...m, ...changes } : m)));

  const toggle = (m: GoalMilestone) =>
    patch(m.id, { done: !m.done, doneOn: !m.done ? todayShort() : undefined });

  const remove = (id: string) => onChange(milestones.filter((m) => m.id !== id));

  const add = () => {
    const label = draft.trim();
    if (!label) return;
    onChange([...milestones, makeMilestone(label)]);
    setDraft("");
  };

  const drop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    if (dragId) onChange(reorderMilestones(milestones, dragId, targetId));
    setDragId(null);
    setOverId(null);
  };

  const done = milestones.filter((m) => m.done).length;

  return (
    <div className="space-y-5">
      {milestones.length ? (
        <>
          <p className="text-sm text-muted-foreground">
            {done} of {milestones.length} complete · drag to reorder
          </p>
          <ol className="space-y-2.5">
            {milestones.map((m) => (
              <li
                key={m.id}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setOverId(m.id);
                }}
                onDragLeave={() => setOverId((id) => (id === m.id ? null : id))}
                onDrop={(e) => drop(e, m.id)}
                className={cn(
                  "rounded-2xl bg-muted/60 transition-all",
                  dragId === m.id && "opacity-50",
                  overId === m.id && dragId !== m.id && "ring-2 ring-sage/50",
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                  <span
                    draggable
                    onDragStart={() => setDragId(m.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                    className="cursor-grab p-1 text-muted-foreground/70 active:cursor-grabbing"
                    aria-label={`Reorder ${m.label}`}
                    role="button"
                    tabIndex={0}
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>

                  <button
                    type="button"
                    onClick={() => toggle(m)}
                    aria-pressed={m.done}
                    aria-label={m.done ? `Mark ${m.label} as not done` : `Mark ${m.label} as done`}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors",
                      m.done ? accentFill[accent] : "bg-card ring-1 ring-border hover:ring-sage/60",
                    )}
                  >
                    {m.done ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>

                  <Input
                    value={m.label}
                    onChange={(e) => patch(m.id, { label: e.target.value })}
                    aria-label="Milestone name"
                    className={cn(
                      "h-9 min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:bg-card",
                      m.done && "text-muted-foreground line-through",
                    )}
                  />

                  {m.doneOn ? (
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                      {m.doneOn}
                    </span>
                  ) : null}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    aria-label={`Details for ${m.label}`}
                    aria-expanded={openId === m.id}
                    onClick={() => setOpenId((id) => (id === m.id ? null : m.id))}
                  >
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", openId === m.id && "rotate-180")}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    aria-label={`Delete ${m.label}`}
                    onClick={() => remove(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {openId === m.id ? (
                  <div className="space-y-3 px-4 pb-4 pt-1 sm:px-5">
                    <div className="space-y-1.5">
                      <Label htmlFor={`ms-note-${m.id}`} className="text-xs text-muted-foreground">
                        Note (optional)
                      </Label>
                      <Textarea
                        id={`ms-note-${m.id}`}
                        rows={2}
                        value={m.note ?? ""}
                        placeholder="Anything worth remembering about this step"
                        onChange={(e) => patch(m.id, { note: e.target.value || undefined })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`ms-date-${m.id}`} className="text-xs text-muted-foreground">
                        Target date (optional)
                      </Label>
                      <Input
                        id={`ms-date-${m.id}`}
                        type="date"
                        value={m.targetDate ?? ""}
                        onChange={(e) => patch(m.id, { targetDate: e.target.value || undefined })}
                      />
                    </div>
                  </div>
                ) : (
                  <MilestoneMeta milestone={m} />
                )}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={addLabel}
          aria-label={addLabel}
        />
        <Button type="submit" variant="secondary" className="gap-1.5 sm:w-auto">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>
    </div>
  );
}

function MilestoneMeta({ milestone }: { milestone: GoalMilestone }) {
  if (!milestone.note && !milestone.targetDate) return null;
  return (
    <div className="space-y-1 px-4 pb-3 pl-14 text-xs text-muted-foreground sm:px-5 sm:pl-16">
      {milestone.targetDate ? (
        <p>
          By{" "}
          {new Date(milestone.targetDate).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
          })}
        </p>
      ) : null}
      {milestone.note ? <p className="leading-relaxed">{milestone.note}</p> : null}
    </div>
  );
}

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BloomAccent } from "@/features/today/types";
import type { CheckItem, ChecklistTracking, MilestoneTracking } from "../../types";
import { CheckItemList } from "./check-item-list";

type Tracking = ChecklistTracking | MilestoneTracking;

function itemsOf(tracking: Tracking): CheckItem[] {
  return tracking.method === "checklist" ? tracking.items : tracking.milestones;
}

function withItems(tracking: Tracking, items: CheckItem[]): Tracking {
  return tracking.method === "checklist"
    ? { ...tracking, items }
    : { ...tracking, milestones: items };
}

/** Checklist and milestone tracking share the same tickable list, with different words. */
export function CheckablePanel({
  tracking,
  accent = "sage",
  onChange,
  addLabel,
  emptyLabel,
}: {
  tracking: Tracking;
  accent?: BloomAccent;
  onChange: (next: Tracking) => void;
  addLabel: string;
  emptyLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const items = itemsOf(tracking);
  const done = items.filter((i) => i.done).length;

  const toggle = (id: string) => {
    onChange(
      withItems(
        tracking,
        items.map((i) =>
          i.id === id
            ? {
                ...i,
                done: !i.done,
                doneOn: !i.done
                  ? new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" })
                  : undefined,
              }
            : i,
        ),
      ),
    );
  };

  const add = () => {
    const label = draft.trim();
    if (!label) return;
    onChange(
      withItems(tracking, [
        ...items,
        { id: `i${Date.now().toString(36)}`, label, done: false },
      ]),
    );
    setDraft("");
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {done} of {items.length} ticked off
      </p>

      <CheckItemList items={items} accent={accent} onToggle={toggle} emptyLabel={emptyLabel} />

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

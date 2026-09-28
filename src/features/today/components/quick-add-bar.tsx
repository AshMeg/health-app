import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogEventDialog } from "@/features/timeline/components/log-event-dialog";
import { quickAddSpecs, type QuickAddSpec } from "@/features/timeline/quick-add";

/** One tap logging. Everything here writes into Bloom's shared event model. */
export function QuickAddBar() {
  const [spec, setSpec] = useState<QuickAddSpec | null>(null);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const primary = ["weight", "food", "workout", "sleep"];
  const shown = more ? quickAddSpecs : quickAddSpecs.filter((s) => primary.includes(s.id));

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {shown.map((item) => (
          <Button
            key={item.id}
            variant="secondary"
            size="sm"
            className="rounded-full px-4 font-normal shadow-none transition-transform hover:-translate-y-0.5"
            onClick={() => {
              setSpec(item);
              setOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {item.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" className="rounded-full font-normal text-muted-foreground" onClick={() => setMore((m) => !m)}>
          {more ? "Fewer" : "More"}
        </Button>
      </div>
      <LogEventDialog spec={spec} open={open} onOpenChange={setOpen} />
    </>
  );
}

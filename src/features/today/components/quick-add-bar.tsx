import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogEventDialog } from "@/features/timeline/components/log-event-dialog";
import { quickAddSpecs, type QuickAddSpec } from "@/features/timeline/quick-add";

/** One tap logging. Everything here writes into Bloom's shared event model. */
export function QuickAddBar() {
  const [spec, setSpec] = useState<QuickAddSpec | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {quickAddSpecs.map((item) => (
          <Button
            key={item.id}
            variant="secondary"
            className="rounded-full px-5 font-normal shadow-none transition-transform hover:-translate-y-0.5"
            onClick={() => {
              setSpec(item);
              setOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {item.label}
          </Button>
        ))}
      </div>
      <LogEventDialog spec={spec} open={open} onOpenChange={setOpen} />
    </>
  );
}

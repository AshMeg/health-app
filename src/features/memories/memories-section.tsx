import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isMemory } from "@/features/garden/model";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { updateEvent } from "@/features/timeline/store";
import { isJournalEntry } from "@/features/timeline/types";
import { cn } from "@/lib/utils";

import { MemoryDialog } from "./memory-dialog";

export function MemoriesSection({
  openId,
  onOpen,
  onClose,
}: {
  openId?: string;
  onOpen: (id?: string) => void;
  onClose: () => void;
}) {
  const { events } = useBloomContext();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "garden" | "kept">("all");
  const all = events.filter(isMemory).sort((a, b) => b.at.localeCompare(a.at));
  const memories = all.filter((m) =>
    filter === "all" ? true : filter === "garden" ? m.inGarden !== false : m.inGarden === false,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {all.length ? (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Show memories">
            {([["all", "All"], ["garden", "In your Garden"], ["kept", "Not in Garden"]] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={filter === v}
                onClick={() => setFilter(v)}
                className={cn("rounded-full px-3 py-1.5 text-xs", filter === v ? "bg-sage-soft" : "bg-muted text-muted-foreground")}
              >
                {l}
              </button>
            ))}
          </div>
        ) : <span />}
        <Button className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add memory
        </Button>
      </div>

      {all.length && !memories.length ? (
        <p className="text-sm text-muted-foreground">No memories here right now.</p>
      ) : null}
      {memories.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {memories.map((m) => {
            const planted = m.inGarden !== false;
            return (
              <Card key={m.id} className="rounded-3xl border-transparent bg-card shadow-soft">
                <CardContent className="space-y-3 p-6">
                  <button type="button" onClick={() => onOpen(m.id)} className="block w-full space-y-2 text-left hover:opacity-80">
                    {m.photos?.[0] ? <img src={m.photos[0]} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover" /> : null}
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {m.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{m.description}</p> : null}
                  </button>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{planted ? "🦋 In your Garden" : "Kept in Memories"}
                      {isJournalEntry(m) ? " · Also in Journal" : ""}
                    </span>
                    <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={() => updateEvent(m.id, { inGarden: !planted })}>
                      {planted ? "Remove from Garden" : "Plant in Garden"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : all.length ? null : (
        <Card className="rounded-[2rem] border-transparent bg-card shadow-soft">
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-5 p-10 text-center">
            <span className="text-3xl" aria-hidden>🦋</span>
            <div className="max-w-sm space-y-2">
              <p className="font-display text-xl font-medium sm:text-2xl">What would you like to remember?</p>
              <p className="text-sm leading-relaxed text-muted-foreground">Keep the moments that matter to you.</p>
            </div>
            <Button onClick={() => setCreating(true)}>Add a memory</Button>
          </CardContent>
        </Card>
      )}

      <MemoryDialog open={creating || !!openId} memoryId={openId} onClose={() => (creating ? setCreating(false) : onClose())} />
    </div>
  );
}

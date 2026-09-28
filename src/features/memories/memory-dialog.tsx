import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MEMORY_ORIGIN, fileToPhoto } from "@/features/garden/model";
import { useGoals } from "@/features/goals/hooks/use-goals";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { removeEvent, updateEvent } from "@/features/timeline/store";

/**
 * One Memory = one shared event (origin "memory"). Goal Centre, the Garden's
 * butterflies and (later) Journal all open this same record — never a copy.
 * "Remove from Garden" only unplants it; deleting is a separate, explicit act.
 */
export function MemoryDialog({
  open,
  memoryId,
  onClose,
  defaultInGarden = false,
}: {
  open: boolean;
  memoryId?: string;
  onClose: () => void;
  defaultInGarden?: boolean;
}) {
  const { events, record } = useBloomContext();
  const { goals } = useGoals();
  const existing = memoryId ? events.find((e) => e.id === memoryId) : undefined;
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [goalId, setGoalId] = useState("");
  const [inGarden, setInGarden] = useState(defaultInGarden);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(existing?.title ?? "");
    setDate((existing?.at ?? new Date().toISOString()).slice(0, 10));
    setDescription(existing?.description ?? "");
    setNotes(existing?.notes ?? "");
    setPhotos(existing?.photos ?? []);
    setGoalId(existing?.goalId ?? "");
    setInGarden(existing ? existing.inGarden !== false : defaultInGarden);
  }, [open, existing?.id]);

  const save = () => {
    if (!title.trim()) return;
    const at = new Date(`${date}T12:00:00`).toISOString();
    const patch = { title: title.trim(), at, description, notes, photos, goalId: goalId || undefined, inGarden };
    if (existing) updateEvent(existing.id, patch);
    else record({ category: "life-event", detail: "Memory", origin: MEMORY_ORIGIN, ...patch });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{existing ? "A memory" : "Create a memory"}</DialogTitle>
          <DialogDescription>What would you like to remember?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mem-title">Title</Label>
            <Input id="mem-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekend in Cornwall" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mem-date">Date</Label>
            <Input id="mem-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mem-desc">Note</Label>
            <Textarea id="mem-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened, how it felt" />
          </div>
          {existing?.notes ? (
            <div className="space-y-1.5">
              <Label htmlFor="mem-notes">Private notes</Label>
              <Textarea id="mem-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="mem-goal">Linked goal (optional)</Label>
            <select id="mem-goal" value={goalId} onChange={(e) => setGoalId(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
              <option value="">Not linked to a goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Photos</Label>
            {photos.length ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((src, i) => (
                  <button key={i} type="button" className="group relative" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label="Remove photo">
                    <img src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    <span className="absolute inset-0 hidden items-center justify-center rounded-xl bg-card/60 text-xs group-hover:flex">Remove</span>
                  </button>
                ))}
              </div>
            ) : null}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = [...(e.target.files ?? [])];
                e.target.value = "";
                const added = await Promise.all(files.map((f) => fileToPhoto(f)));
                setPhotos((p) => [...p, ...added]);
              }}
            />
            <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => fileInput.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Add photo
            </Button>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
            <span className="text-sm">
              🦋 Plant in Your Garden
              <span className="block text-xs text-muted-foreground">
                {inGarden ? "It will flutter as a butterfly." : "Kept here in Memories only."}
              </span>
            </span>
            <Switch checked={inGarden} onCheckedChange={setInGarden} aria-label="Plant in Garden" />
          </label>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {existing ? (
            <Button
              variant="ghost"
              className="rounded-full text-destructive"
              onClick={() => {
                if (!window.confirm("Delete this memory for good? This can't be undone.")) return;
                removeEvent(existing.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete memory
            </Button>
          ) : (
            <span />
          )}
          <Button className="rounded-full" onClick={save} disabled={!title.trim()}>
            {existing ? "Save" : inGarden ? "Save and plant" : "Save memory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

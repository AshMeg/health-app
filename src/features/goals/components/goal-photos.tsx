import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fileToPhoto } from "@/features/garden/model";
import type { GoalPhoto } from "../types";

/** Photos kept with a goal. The Garden, books and Yearbook read these — never copies. */
export function GoalPhotos({
  photos,
  onChange,
}: {
  photos: GoalPhoto[];
  onChange: (photos: GoalPhoto[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = useState<GoalPhoto | null>(null);
  const [caption, setCaption] = useState("");

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const added = await Promise.all(
      [...files].map(async (file) => ({
        id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        src: await fileToPhoto(file),
        addedAt: new Date().toISOString(),
      })),
    );
    onChange([...added, ...photos]);
  };

  const open = (p: GoalPhoto) => {
    setViewing(p);
    setCaption(p.caption ?? "");
  };

  return (
    <div className="space-y-4">
      {photos.length ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => open(p)}
              className="relative aspect-square overflow-hidden rounded-2xl bg-muted transition hover:opacity-90"
              aria-label={p.caption ?? "View photo"}
            >
              <img src={p.src} alt={p.caption ?? "Goal photo"} className="h-full w-full object-cover" />
              {p.caption ? (
                <span className="absolute inset-x-0 bottom-0 truncate bg-card/85 px-2 py-1 text-left text-[11px]">{p.caption}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          A race finish, a certificate, a little moment — photos stay with this goal and in your Garden.
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void add(e.target.files);
          e.target.value = "";
        }}
      />
      <Button variant="secondary" className="rounded-full" onClick={() => input.current?.click()}>
        <ImagePlus className="h-4 w-4" />
        Add photo
      </Button>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="rounded-3xl sm:max-w-xl">
          <DialogTitle className="sr-only">Photo</DialogTitle>
          {viewing ? (
            <div className="space-y-4">
              <img src={viewing.src} alt={viewing.caption ?? "Goal photo"} className="max-h-[60vh] w-full rounded-2xl object-contain" />
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a short caption" />
              <div className="flex justify-between gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full text-destructive"
                  onClick={() => {
                    onChange(photos.filter((x) => x.id !== viewing.id));
                    setViewing(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button
                  className="rounded-full"
                  onClick={() => {
                    onChange(photos.map((x) => (x.id === viewing.id ? { ...x, caption: caption.trim() || undefined } : x)));
                    setViewing(null);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

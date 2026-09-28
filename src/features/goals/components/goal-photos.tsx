import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fileToPhoto } from "@/features/garden/model";
import type { GoalPhoto } from "../types";

/** Photos kept with a goal. The Garden reads these — they're never copied. */
export function GoalPhotos({
  photos,
  onChange,
}: {
  photos: GoalPhoto[];
  onChange: (photos: GoalPhoto[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-4">
      {photos.length ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-muted">
              <img src={p.src} alt={p.caption ?? "Goal photo"} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
                className="absolute top-1.5 right-1.5 rounded-full bg-card/90 p-1 opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
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
    </div>
  );
}

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createTag,
  deleteTag,
  findTagByName,
  renameTag,
  setTagColour,
  suggestedTagNames,
  tagChipClass,
  tagColours,
  useTags,
  type BloomTag,
} from "../store";

export function TagChip({
  tag,
  onRemove,
  className,
}: {
  tag: BloomTag;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs text-foreground/75",
        tagChipClass[tag.colour],
        className,
      )}
    >
      {tag.name}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${tag.name}`}
          className="-mr-1 rounded-full p-0.5 hover:bg-card/60"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}

/** Shows the first few tags then "+N" so cards stay calm. */
export function TagList({ tags, max = 3 }: { tags: BloomTag[]; max?: number }) {
  if (!tags.length) return null;
  const extra = tags.length - max;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Tags">
      {tags.slice(0, max).map((t) => (
        <TagChip key={t.id} tag={t} />
      ))}
      {extra > 0 ? (
        <span className="text-xs text-muted-foreground" title={tags.slice(max).map((t) => t.name).join(", ")}>
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Pick existing tags or create a new one. Selection is held by the caller.
 * The picker opens inline (not a floating popover) so it is never clipped by
 * a dialog, scrolls on its own, and works the same on phones.
 */
export function TagPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { tags, byId } = useTags();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = value.map((id) => byId.get(id)).filter((t): t is BloomTag => Boolean(t));
  const q = query.trim().toLowerCase();
  const matching = tags.filter((t) => t.name.toLowerCase().includes(q));
  const suggestions = suggestedTagNames.filter(
    (n) => !findTagByName(n) && n.toLowerCase().includes(q),
  );
  const exact =
    q && (tags.some((t) => t.name.toLowerCase() === q) || suggestedTagNames.some((n) => n.toLowerCase() === q));

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const addNamed = (name: string) => {
    const tag = createTag(name) ?? findTagByName(name);
    if (tag && !value.includes(tag.id)) onChange([...value, tag.id]);
    setQuery("");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Organise this goal by area of your life, like Fitness, Health or Learning. You can add as
        many as you like — or none at all.
      </p>
      {selected.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((t) => (
            <TagChip
              key={t.id}
              tag={t}
              className="px-3 py-1 text-sm"
              onRemove={() => onChange(value.filter((id) => id !== t.id))}
            />
          ))}
        </div>
      ) : null}

      {!open ? (
        <Button
          type="button"
          variant="secondary"
          className="gap-1.5 rounded-full px-4"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add tag
        </Button>
      ) : (
        <div className="space-y-2 rounded-2xl bg-muted/40 p-3">
          <Input
            autoFocus
            value={query}
            placeholder="Find or create a tag"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                e.preventDefault();
                const existing = findTagByName(query);
                if (existing) {
                  if (!value.includes(existing.id)) onChange([...value, existing.id]);
                  setQuery("");
                } else addNamed(query);
              }
              if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
              }
            }}
          />
          <div
            className="max-h-60 space-y-1 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]"
            role="listbox"
            aria-multiselectable="true"
            aria-label="Tags"
          >
            {q && !exact ? (
              <OptionRow label={`Create “${query.trim()}”`} icon="plus" onClick={() => addNamed(query)} />
            ) : null}
            {matching.map((t) => (
              <OptionRow
                key={t.id}
                label={t.name}
                icon={value.includes(t.id) ? "check" : "none"}
                selected={value.includes(t.id)}
                onClick={() => toggle(t.id)}
              />
            ))}
            {suggestions.length ? (
              <p className="px-2 pt-2 text-xs text-muted-foreground">Suggestions</p>
            ) : null}
            {suggestions.map((n) => (
              <OptionRow key={n} label={n} icon="none" onClick={() => addNamed(n)} />
            ))}
            {!matching.length && !suggestions.length && !q ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">Type a name to create a tag.</p>
            ) : null}
          </div>
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setQuery(""); }}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionRow({
  label,
  onClick,
  icon,
  selected,
}: {
  label: string;
  onClick: () => void;
  icon: "plus" | "check" | "none";
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected ?? false}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-card",
        selected && "bg-card font-medium",
      )}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {icon === "plus" ? <Plus className="h-3.5 w-3.5 text-muted-foreground" /> : null}
        {icon === "check" ? <Check className="h-3.5 w-3.5 text-sage" /> : null}
      </span>
      {label}
    </button>
  );
}

/** Create, rename, recolour and delete tags. Deleting never removes goals. */
export function TagManagerDialog({
  open,
  onOpenChange,
  counts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counts: Map<string, number>;
}) {
  const { tags } = useTags();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const create = () => {
    if (!newName.trim()) return;
    if (findTagByName(newName)) return setError("You already have a tag with that name.");
    createTag(newName);
    setNewName("");
    setError("");
  };

  const saveRename = () => {
    if (!editing) return;
    if (!renameTag(editing.id, editing.name)) return setError("That name is empty or already used.");
    setEditing(null);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="font-display text-xl font-medium">Your tags</DialogTitle>
          <DialogDescription>
            Organise your goals in the way that makes sense to you. Counts include every goal —
            active, completed and resting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={newName}
            placeholder="New tag, e.g. Photography"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <Button onClick={create} className="shrink-0 gap-1">
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <ul className="space-y-2">
          {tags.length === 0 ? (
            <li className="text-sm text-muted-foreground">No tags yet.</li>
          ) : null}
          {tags.map((t) => (
            <li key={t.id} className="space-y-2 rounded-2xl bg-muted/40 p-3">
              {editing?.id === t.id ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={editing.name}
                    onChange={(e) => setEditing({ id: t.id, name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && saveRename()}
                  />
                  <Button size="icon" variant="secondary" onClick={saveRename} aria-label="Save name">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TagChip tag={t} />
                    <span className="text-xs text-muted-foreground">
                      {counts.get(t.id) ?? 0} {(counts.get(t.id) ?? 0) === 1 ? "goal" : "goals"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" aria-label={`Rename ${t.name}`} onClick={() => setEditing({ id: t.id, name: t.name })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${t.name}`} onClick={() => setConfirmDelete(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex gap-1.5" role="radiogroup" aria-label={`Colour for ${t.name}`}>
                {tagColours.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={t.colour === c}
                    aria-label={c}
                    onClick={() => setTagColour(t.id, c)}
                    className={cn(
                      "h-5 w-5 rounded-full",
                      tagChipClass[c],
                      t.colour === c && "ring-2 ring-foreground/30 ring-offset-1 ring-offset-card",
                    )}
                  />
                ))}
              </div>
              {confirmDelete === t.id ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card p-2 text-xs">
                  <span>Remove this tag? Your goals stay exactly as they are.</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Keep</Button>
                    <Button size="sm" variant="destructive" onClick={() => { deleteTag(t.id); setConfirmDelete(null); }}>
                      Delete tag
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatGoalDate } from "../format";
import type { GoalNote } from "../types";

/** Notes are the goal's own story — dated automatically, editable forever. */
export function GoalNotes({
  notes,
  onAdd,
  onEdit,
  onDelete,
}: {
  notes: GoalNote[];
  onAdd: (body: string) => void;
  onEdit: (noteId: string, body: string) => void;
  onDelete: (noteId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };

  const startEdit = (note: GoalNote) => {
    setEditingId(note.id);
    setEditDraft(note.body);
  };

  const saveEdit = () => {
    if (editingId && editDraft.trim()) onEdit(editingId, editDraft);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Textarea
          value={draft}
          rows={3}
          placeholder="How is this going? Anything you'd like to remember."
          aria-label="Add a note"
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={!draft.trim()}>
          Add note
        </Button>
      </form>

      {notes.length ? (
        <ol className="space-y-4 border-t border-border/50 pt-5">
          {notes.map((note) => (
            <li key={note.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {formatGoalDate(note.date)}
                  {note.editedAt ? " · edited" : ""}
                </p>
                {editingId === note.id ? null : (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2 text-muted-foreground"
                      onClick={() => startEdit(note)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2 text-muted-foreground"
                      onClick={() => onDelete(note.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">Delete</span>
                    </Button>
                  </div>
                )}
              </div>

              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDraft}
                    rows={3}
                    aria-label="Edit note"
                    onChange={(e) => setEditDraft(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={saveEdit}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl bg-muted/50 px-4 py-3 text-sm leading-relaxed">
                  {note.body}
                </p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-t border-border/50 pt-5 text-sm text-muted-foreground">
          No notes yet. The first one is often the hardest.
        </p>
      )}
    </div>
  );
}

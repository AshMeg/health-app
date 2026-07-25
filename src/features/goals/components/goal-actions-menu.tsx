import { useState } from "react";
import { MoreHorizontal, Pencil, Sprout, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EditGoalDialog } from "./edit-goal-dialog";
import { useGoals } from "../hooks/use-goals";
import { isResting, type BloomGoal } from "../types";

/**
 * The one place a goal is managed: edit it, let it rest for another season, or
 * delete it outright when it was only ever a mistake.
 */
export function GoalActionsMenu({
  goal,
  className,
  onDeleted,
}: {
  goal: BloomGoal;
  className?: string;
  /** Called after a delete, so a detail page can navigate away. */
  onDeleted?: () => void;
}) {
  const { editGoal, pauseGoal, resumeGoal, removeGoal } = useGoals();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const resting = isResting(goal);

  return (
    <>
      {/* Sits above the card's full-surface link so the menu stays clickable. */}
      <div className={cn("relative z-10", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              aria-label={`Manage ${goal.title}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <DropdownMenuItem className="gap-2.5" onSelect={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit goal
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2.5"
              onSelect={() => (resting ? resumeGoal(goal.id) : pauseGoal(goal.id))}
            >
              <Sprout className="h-4 w-4" />
              {resting ? "Resume goal" : "Not right now"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2.5 text-destructive focus:text-destructive"
              onSelect={() => setConfirming(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditGoalDialog
        goal={goal}
        open={editing}
        onOpenChange={setEditing}
        onSave={(patch, changed) => editGoal(goal.id, patch, changed)}
      />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-medium">
              Delete goal?
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This will permanently remove the goal and all of its progress, notes and history. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                removeGoal(goal.id);
                onDeleted?.();
              }}
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

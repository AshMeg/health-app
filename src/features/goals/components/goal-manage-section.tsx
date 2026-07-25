import { useState } from "react";
import { Sprout, Trash2 } from "lucide-react";

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
import { Card, CardContent } from "@/components/ui/card";
import { useGoals } from "../hooks/use-goals";
import { isResting, type BloomGoal } from "../types";

/**
 * Goal management, out in the open at the foot of the page — nothing important
 * hidden behind an overflow menu.
 */
export function GoalManageSection({
  goal,
  onDeleted,
}: {
  goal: BloomGoal;
  onDeleted?: () => void;
}) {
  const { pauseGoal, resumeGoal, removeGoal } = useGoals();
  const [confirming, setConfirming] = useState(false);
  const resting = isResting(goal);

  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-soft">
      <CardContent className="space-y-6 p-7 sm:p-8">
        <h2 className="text-base font-medium">Manage this Goal</h2>

        <div className="flex flex-col gap-4 border-t border-border/50 pt-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-1">
            <p className="text-sm font-medium">🌱 {resting ? "Resume goal" : "Not Right Now"}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {resting
                ? "Bring this goal back into your Active Goals and onto your Today dashboard."
                : "Move this goal out of Active Goals while keeping all of your progress, notes and history."}
            </p>
          </div>
          <Button
            variant="secondary"
            className="shrink-0 gap-1.5"
            onClick={() => (resting ? resumeGoal(goal.id) : pauseGoal(goal.id))}
          >
            <Sprout className="h-4 w-4" />
            {resting ? "Resume goal" : "Not right now"}
          </Button>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/50 pt-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-1">
            <p className="text-sm font-medium">🗑 Delete Goal</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Permanently remove this goal and everything in it. Best kept for goals created by
              mistake.
            </p>
          </div>
          <Button
            variant="ghost"
            className="shrink-0 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete goal
          </Button>
        </div>
      </CardContent>

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
    </Card>
  );
}

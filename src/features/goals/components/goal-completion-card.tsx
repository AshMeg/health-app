import { Flower2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GoalCompletionCard({
  title,
  onAddToGarden,
}: {
  title: string;
  onAddToGarden?: () => void;
}) {
  return (
    <Card className="rounded-[2rem] border-transparent bg-sage-soft shadow-soft">
      <CardContent className="flex flex-col items-center gap-5 p-10 text-center sm:p-12">
        <span className="text-3xl" role="img" aria-label="Blossom">
          🌸
        </span>
        <div className="max-w-sm space-y-2">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">Goal Complete</h2>
          <p className="text-base leading-relaxed text-foreground/70">
            You kept a promise to yourself.
          </p>
          <p className="text-sm text-foreground/60">{title}</p>
        </div>
        <Button onClick={onAddToGarden} className="gap-2">
          <Flower2 className="h-4 w-4" />
          Add to Garden
        </Button>
        <p className="text-xs text-foreground/50">The Garden is coming soon.</p>
      </CardContent>
    </Card>
  );
}

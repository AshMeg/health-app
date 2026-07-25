import { Sprout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function GoalsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="rounded-[2rem] border-transparent bg-card shadow-soft">
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-6 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-soft">
          <Sprout className="h-6 w-6 text-sage" />
        </div>
        <div className="max-w-sm space-y-2">
          <p className="font-display text-xl font-medium sm:text-2xl">
            Every garden starts with a single seed.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Choose one thing you'd like to grow towards. You can always add more later.
          </p>
        </div>
        <Button onClick={onCreate}>Create Your First Goal</Button>
      </CardContent>
    </Card>
  );
}

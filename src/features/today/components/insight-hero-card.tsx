import { HelpCircle, MessageSquarePlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Confidence } from "../types";

const confidenceStyles: Record<Confidence, string> = {
  High: "bg-sage-soft text-sage",
  Medium: "bg-caution-soft text-caution",
  Low: "bg-stone-soft text-stone",
};

export function InsightHeroCard({
  headline,
  body,
  confidence,
}: {
  headline: string;
  body: string;
  confidence: Confidence;
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-transparent bg-linear-to-br from-sage-soft via-card to-lavender-soft/60 shadow-soft">
      <CardContent className="space-y-6 p-8 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-sage" />
            A note for today
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
              confidenceStyles[confidence],
            )}
          >
            {confidence} confidence
          </span>
        </div>

        <div className="space-y-4">
          <p className="font-display text-2xl leading-snug font-medium sm:text-[1.75rem]">
            {headline}
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{body}</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" className="rounded-full px-5 shadow-none">
            <HelpCircle className="h-4 w-4" />
            Why this?
          </Button>
          <Button variant="ghost" className="rounded-full px-5">
            <MessageSquarePlus className="h-4 w-4" />
            Add context
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { HelpCircle, MessageSquarePlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Confidence } from "../types";

const confidenceStyles: Record<Confidence, string> = {
  High: "bg-success-soft text-success ring-success/25",
  Medium: "bg-caution-soft text-caution ring-caution/25",
  Low: "bg-muted text-muted-foreground ring-border",
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
    <Card className="overflow-hidden rounded-3xl border-border/60 bg-gradient-to-br from-accent/40 via-card to-card shadow-sm">
      <CardContent className="space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Today&apos;s Insight
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
              confidenceStyles[confidence],
            )}
          >
            {confidence} confidence
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-xl leading-snug font-medium tracking-tight sm:text-2xl">{headline}</p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="rounded-full">
            <HelpCircle className="h-4 w-4" />
            Why?
          </Button>
          <Button variant="outline" className="rounded-full">
            <MessageSquarePlus className="h-4 w-4" />
            Add Context
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

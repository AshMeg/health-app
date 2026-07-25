import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createYourOwn, goalCategories, type GoalTemplate } from "../templates";

/**
 * The first thing you see when creating a goal: inspiration rather than a
 * blank form. Every template is only a starting point.
 */
export function GoalTemplatePicker({
  onPick,
  onBlank,
}: {
  onPick: (template: GoalTemplate) => void;
  onBlank: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const category = goalCategories.find((c) => c.id === categoryId);

  if (category) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5"
          onClick={() => setCategoryId(null)}
        >
          <ArrowLeft className="h-4 w-4" />
          All categories
        </Button>

        <div className="space-y-1">
          <h3 className="font-display text-lg font-medium">
            <span className="mr-2" aria-hidden>
              {category.emoji}
            </span>
            {category.label}
          </h3>
          <p className="text-sm text-muted-foreground">{category.tagline}</p>
        </div>

        <div className="space-y-2.5">
          {category.templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onPick(template)}
              className="w-full rounded-2xl bg-muted/60 px-5 py-4 text-left text-sm transition-colors hover:bg-sage-soft"
            >
              {template.title}
            </button>
          ))}
          <button
            type="button"
            onClick={onBlank}
            className="w-full rounded-2xl px-5 py-4 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            Something else in {category.label.toLowerCase()} — write my own
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick somewhere to start, or write your own from scratch. Nothing here is fixed.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {goalCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            className="rounded-2xl bg-muted/60 px-4 py-5 text-left transition-colors hover:bg-sage-soft"
          >
            <span className="block text-xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="mt-2 block text-sm font-medium">{c.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {c.tagline}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={onBlank}
          className={cn(
            "col-span-2 rounded-2xl bg-lavender-soft px-4 py-5 text-left transition-opacity hover:opacity-90",
          )}
        >
          <span className="block text-xl" aria-hidden>
            {createYourOwn.emoji}
          </span>
          <span className="mt-2 block text-sm font-medium">{createYourOwn.label}</span>
          <span className="mt-1 block text-xs leading-relaxed text-foreground/60">
            Start with a blank page and say it in your own words.
          </span>
        </button>
      </div>
    </div>
  );
}

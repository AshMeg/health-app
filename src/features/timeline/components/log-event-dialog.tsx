import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useBloomContext } from "../hooks/use-bloom-context";
import type { QuickAddSpec } from "../quick-add";
import type { MetricKey } from "../types";

/**
 * One small form for any kind of log. Whatever is entered becomes a shared
 * event, so goals, the dashboard and the timeline all move together.
 */
export function LogEventDialog({
  spec,
  open,
  onOpenChange,
}: {
  spec: QuickAddSpec | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { record } = useBloomContext();
  const [values, setValues] = useState<Record<string, string>>({});

  if (!spec) return null;

  const set = (label: string, value: string) => setValues((v) => ({ ...v, [label]: value }));

  const submit = () => {
    const metrics: Partial<Record<MetricKey, number | string>> = {};
    const details: string[] = [];
    let primary: number | undefined;
    let unit: string | undefined;

    for (const field of spec.fields) {
      const raw = values[field.label]?.trim();
      if (!raw) continue;
      if (field.kind === "number") {
        const n = Number(raw);
        if (Number.isNaN(n)) continue;
        metrics[field.metric] = n;
        if (primary === undefined) {
          primary = n;
          unit = field.unit;
        }
        details.push(`${n}${field.unit ? ` ${field.unit}` : ""}`);
      } else {
        if (field.metric) metrics[field.metric] = raw;
        details.push(raw);
      }
    }

    record({
      category: spec.category,
      title: spec.title,
      detail: details.join(" · ") || undefined,
      value: primary,
      unit,
      metrics,
      source: "manual",
      origin: "Quick add",
    });

    setValues({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">{spec.label}</DialogTitle>
          <DialogDescription>
            This goes straight into your timeline and updates anything it relates to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {spec.fields.map((field) => (
            <div key={field.label} className="space-y-2">
              <Label className="text-sm font-normal text-muted-foreground">
                {field.label}
                {"unit" in field && field.unit ? ` (${field.unit})` : ""}
              </Label>

              {field.kind === "choice" ? (
                <div className="flex flex-wrap gap-2">
                  {field.options.map((option) => {
                    const active = values[field.label] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => set(field.label, active ? "" : option)}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-sage-soft text-sage"
                            : "bg-muted text-muted-foreground hover:bg-muted/70",
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : field.kind === "text" ? (
                <Textarea
                  rows={3}
                  value={values[field.label] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.label, e.target.value)}
                />
              ) : (
                <Input
                  inputMode="decimal"
                  value={values[field.label] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.label, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

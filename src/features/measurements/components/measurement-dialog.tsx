import { useEffect, useState } from "react";

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
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import { updateEvent } from "@/features/timeline/store";
import type { BloomEvent } from "@/features/timeline/types";
import { cn } from "@/lib/utils";

import { atForDate, localDate, measureOf, useMeasures } from "../model";

const CUSTOM = "__custom";

/** Log a new body measurement, or correct an existing one in place. */
export function MeasurementDialog({
  open,
  onOpenChange,
  initialMeasure,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMeasure?: string;
  editing?: BloomEvent | null;
}) {
  const { events, record } = useBloomContext();
  const { all, tracked, addCustom, find } = useMeasures(events);
  const [measure, setMeasure] = useState("waist");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(localDate());
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("cm");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setMeasure(measureOf(editing));
      setValue(String(editing.value ?? editing.metrics?.measurement ?? ""));
      setDate(localDate(editing.at));
    } else {
      setMeasure(initialMeasure ?? tracked[0]?.key ?? "waist");
      setValue("");
      setDate(localDate());
    }
    setCustomName("");
    setCustomUnit("cm");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, initialMeasure]);

  const n = Number(value);
  const valid =
    value.trim() !== "" && Number.isFinite(n) && n > 0 && (measure !== CUSTOM || customName.trim());

  const submit = () => {
    if (!valid) return;
    const def = measure === CUSTOM ? addCustom(customName, customUnit) : find(measure);
    if (!def) return;
    const payload = {
      category: "measurement" as const,
      title: `${def.label} measured`,
      detail: `${n} ${def.unit}`,
      value: n,
      unit: def.unit,
      measure: def.key,
      metrics: { measurement: n },
      at: atForDate(date),
    };
    if (editing) {
      // Same record, corrected — never a duplicate.
      const at = localDate(editing.at) === date ? editing.at : payload.at;
      updateEvent(editing.id, { ...payload, at });
    } else {
      record(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">
            {editing ? "Edit measurement" : "Log a measurement"}
          </DialogTitle>
          <DialogDescription>
            {editing ? "Correct the value or date." : "What would you like to record?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Measurement">
            {[...all, { key: CUSTOM, label: "Custom", unit: "" }].map((m) => (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={measure === m.key}
                onClick={() => setMeasure(m.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition-colors",
                  measure === m.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground/80 hover:bg-muted/70",
                )}
              >
                {m.key === CUSTOM ? "+ Custom" : m.label}
              </button>
            ))}
          </div>

          {measure === CUSTOM ? (
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-name">Measurement name</Label>
                <Input id="m-name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Forearm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-unit">Unit</Label>
                <Input id="m-unit" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-value">
                Value{measure !== CUSTOM && find(measure) ? ` (${find(measure)!.unit})` : ""}
              </Label>
              <Input
                id="m-value"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="78.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-date">Date</Label>
              <Input id="m-date" type="date" max={localDate()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

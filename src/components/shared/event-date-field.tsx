import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FUTURE_MESSAGE, formatDay, isFuture, todayLocal } from "@/lib/event-date";

/**
 * The one date control used when logging anything in Bloom. It reads
 * "Today" by default so normal logging stays one tap; tapping it opens a
 * date (and optional time) for anything that happened earlier.
 */
export function EventDateField({
  date,
  onDateChange,
  time,
  onTimeChange,
  label = "Date",
  allowFuture = false,
  id = "event-date",
}: {
  date: string;
  onDateChange: (date: string) => void;
  time?: string;
  /** Pass to offer an optional time. */
  onTimeChange?: (time: string) => void;
  label?: string;
  allowFuture?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(date !== todayLocal() || !!time);
  const future = !allowFuture && isFuture(date, time);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      {open ? (
        <div className={onTimeChange ? "grid grid-cols-2 gap-3" : ""}>
          <Input
            id={id}
            type="date"
            value={date}
            max={allowFuture ? undefined : todayLocal()}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-xl"
          />
          {onTimeChange ? (
            <Input
              type="time"
              aria-label="Time (optional)"
              value={time ?? ""}
              onChange={(e) => onTimeChange(e.target.value)}
              className="rounded-xl"
            />
          ) : null}
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2 text-sm transition-colors hover:bg-muted"
        >
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {formatDay(date)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Change <ChevronDown className="h-3.5 w-3.5" />
          </span>
        </button>
      )}
      {future ? <p className="text-xs text-destructive">{FUTURE_MESSAGE}</p> : null}
    </div>
  );
}

/** True when the chosen date can be saved for a record of something that already happened. */
export function validPastDate(date: string, time?: string) {
  return date.length === 10 && !isFuture(date, time);
}

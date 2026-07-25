import { useState } from "react";
import { Check, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useDashboardLayout } from "../hooks/use-dashboard-layout";
import { todayWidgets } from "../widgets/registry";
import { DashboardGrid } from "./dashboard-grid";
import { GreetingHeader } from "./greeting-header";
import { HiddenWidgetsPanel } from "./hidden-widgets-panel";

export function TodayPage({ firstName }: { firstName: string }) {
  const [editing, setEditing] = useState(false);
  const { visibleWidgets, hiddenWidgets, move, shift, hide, show, reset } =
    useDashboardLayout(todayWidgets);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 pb-20">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
        <GreetingHeader firstName={firstName} />
        <Button
          variant={editing ? "default" : "ghost"}
          size="sm"
          className="shrink-0 rounded-full"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? <Check className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          {editing ? "Done" : "Customise"}
        </Button>
      </div>

      {editing ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Drag a widget by its handle to reorder, or use the arrows. Hide anything you don&apos;t
          need — your layout is saved automatically.
        </p>
      ) : null}

      <DashboardGrid
        widgets={visibleWidgets}
        editing={editing}
        onMove={move}
        onShift={shift}
        onHide={hide}
      />

      {editing ? (
        <HiddenWidgetsPanel widgets={hiddenWidgets} onShow={show} onReset={reset} />
      ) : null}
    </div>
  );
}

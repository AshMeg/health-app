import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BloomGoal } from "@/features/goals/types";
import { buildSeries } from "@/features/trends/series";
import { useBloomContext } from "@/features/timeline/hooks/use-bloom-context";
import {
  clearTargetWeight,
  distanceToTarget,
  setTargetWeight,
  toggleGoalLink,
  useTargetWeight,
} from "./target";

/** The longer-term destination on the Weight page. Never creates a Goal. */
export function TargetWeightCard({ weightGoals }: { weightGoals: BloomGoal[] }) {
  const { events } = useBloomContext();
  const { target, linkedGoalIds } = useTargetWeight();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const latest = useMemo(() => {
    const s = buildSeries(events, "weight");
    return s[s.length - 1]?.value;
  }, [events]);

  const startEdit = () => {
    setValue(target ? String(target.kg) : "");
    setError("");
    setEditing(true);
  };
  const save = () => {
    const kg = Number(value.replace(",", "."));
    if (!value.trim() || Number.isNaN(kg) || kg < 20 || kg > 400) {
      setError("Enter a weight in kilograms, for example 68.");
      return;
    }
    setTargetWeight(Math.round(kg * 10) / 10);
    setEditing(false);
  };

  return (
    <Card className="rounded-3xl border-transparent bg-card shadow-none">
      <CardContent className="space-y-5 p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Target weight</p>
            {target ? (
              <>
                <p className="font-display text-3xl font-medium">{target.kg.toFixed(1)} kg</p>
                {latest !== undefined ? (
                  <p className="text-sm text-foreground/80">
                    {distanceToTarget(latest, target.kg)} · latest {latest.toFixed(1)} kg
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Log a weight to see how far you are from it.</p>
                )}
              </>
            ) : (
              <>
                <p className="font-display text-xl font-medium">Not set yet.</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Set a target weight to see your longer-term progress alongside your everyday
                  weight tracking. It's entirely optional.
                </p>
              </>
            )}
          </div>
          {!editing ? (
            <Button variant="secondary" className="rounded-full" onClick={startEdit}>
              {target ? "Edit target" : "Set target"}
            </Button>
          ) : null}
        </div>

        {editing ? (
          <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
            <Label htmlFor="target-kg">Your target in kg</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="target-kg"
                inputMode="decimal"
                autoFocus
                className="w-32"
                value={value}
                placeholder="68"
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
              <Button onClick={save}>Save</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              {target ? (
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => {
                    clearTargetWeight();
                    setEditing(false);
                  }}
                >
                  Remove target
                </Button>
              ) : null}
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <p className="text-xs text-muted-foreground">
              You choose this. Your logged weights stay exactly as they are.
            </p>
          </div>
        ) : null}

        {target && weightGoals.length ? (
          <div className="space-y-3 border-t border-border/50 pt-4">
            <p className="text-sm text-muted-foreground">
              Weight goals can be steps along the way. Link the ones that are.
            </p>
            {weightGoals.map((g) => {
              const linked = linkedGoalIds.includes(g.id);
              const goalTarget = g.tracking.method === "automatic" ? g.tracking.target : undefined;
              return (
                <div key={g.id} className="flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to="/goals/$goalId"
                    params={{ goalId: g.id }}
                    className="inline-flex items-center gap-1.5 text-sm hover:underline"
                  >
                    <Target className="h-3.5 w-3.5 text-sage" />
                    {g.title}
                    {goalTarget !== undefined ? (
                      <span className="text-muted-foreground">
                        · this step {goalTarget} kg{linked ? ` → destination ${target.kg} kg` : ""}
                      </span>
                    ) : null}
                  </Link>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Towards my target
                    <Switch checked={linked} onCheckedChange={() => toggleGoalLink(g.id)} />
                  </label>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

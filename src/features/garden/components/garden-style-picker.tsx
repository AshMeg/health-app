import { Check, CloudSun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { useWeather, useWeatherPreference, weatherLabel } from "../atmosphere";
import { gardenStyles, setGardenStyle, useGardenStyle } from "../styles";
import { FlowerArt, HiveArt, TreeArt } from "./garden-art";

/** "Choose your Garden" — changes how the Garden looks, never what's in it. */
export function GardenStylePicker({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const current = useGardenStyle();
  const weatherPref = useWeatherPreference();
  const weather = useWeather();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-medium">Choose your Garden</DialogTitle>
          <DialogDescription>
            Your Garden can grow in a style that feels like you. Your goals, habits and memories stay exactly as they are.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {gardenStyles.map((style) => {
            const selected = style.id === current.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setGardenStyle(style.id)}
                aria-pressed={selected}
                className={cn(
                  "group overflow-hidden rounded-3xl bg-card text-left shadow-soft transition focus-visible:outline-2 focus-visible:outline-ring",
                  selected ? "ring-2 ring-sage" : "hover:-translate-y-0.5",
                )}
              >
                <div className={cn("relative h-36 overflow-hidden", `garden-style-${style.id}`, "season-summer")}>
                  <img src={style.image} alt="" loading="lazy" width={1920} height={640} className="absolute inset-0 h-full w-full object-cover" />
                  {/* A sample of how its tree, hive and flowers are drawn */}
                  <svg className="absolute bottom-1 left-3" width={60} height={80} viewBox="0 0 150 200" aria-hidden>
                    <TreeArt render={style.tree} seed="preview" blossoms={5} />
                  </svg>
                  <svg className="absolute bottom-2 left-20" width={34} height={42} viewBox="0 0 90 110" aria-hidden>
                    <HiveArt render={style.hive} layers={3} />
                  </svg>
                  {(["blush", "lavender", "sky"] as const).map((accent, i) => (
                    <svg key={accent} className="absolute bottom-1" style={{ left: 130 + i * 34 }} width={34} height={50} viewBox="0 0 64 92" aria-hidden>
                      <FlowerArt render={style.flower} variety={i === 1 ? "daisy" : "rose"} accent={accent} open={0.95} height={78} seed={`${style.id}${i}`} />
                    </svg>
                  ))}
                  {selected ? (
                    <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 text-sage shadow-soft">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1 px-5 py-4">
                  <p className="font-display text-lg font-medium">{style.label}</p>
                  <p className="text-sm text-muted-foreground">{style.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-muted/50 px-5 py-4">
          <div className="flex items-start gap-3">
            <CloudSun className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Show my local weather</p>
              <p className="text-xs text-muted-foreground">
                {weatherPref.enabled
                  ? weather
                    ? `Now: ${weatherLabel[weather.kind]}${weather.temperatureC !== undefined ? `, ${Math.round(weather.temperatureC)}°C` : ""}. Your Garden's sky follows it.`
                    : "Looking up your weather…"
                  : "Uses your approximate location. Without it, the Garden keeps a calm, neutral sky — it never makes weather up."}
              </p>
              {weatherPref.error ? <p className="mt-1 text-xs text-destructive">{weatherPref.error}</p> : null}
            </div>
          </div>
          <Switch
            checked={weatherPref.enabled}
            onCheckedChange={(on) => (on ? weatherPref.enable() : weatherPref.disable())}
            aria-label="Show my local weather"
          />
        </div>

        <div className="flex justify-end">
          <Button className="rounded-full px-6" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

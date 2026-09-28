import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { personalityMeta, type BloomPersonality } from "@/features/voice/tone";
import { usePersonality } from "@/features/voice/use-personality";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Bloom" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { personality, setPersonality } = usePersonality();
  const options = Object.keys(personalityMeta) as BloomPersonality[];

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-8">
      <h1 className="font-display text-3xl">Settings</h1>

      <section className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium">Bloom's personality</h2>
          <p className="text-sm text-muted-foreground">How would you like Bloom to speak to you?</p>
          <p className="text-sm text-muted-foreground">
            Choose how you'd like Bloom to speak to you. You can change this whenever you like.
          </p>
        </div>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          {options.map((id) => {
            const m = personalityMeta[id];
            const on = id === personality;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => void setPersonality(id)}
                className={cn(
                  "relative space-y-2 rounded-3xl bg-card p-5 text-left shadow-soft ring-1 transition",
                  on ? "ring-sage" : "ring-transparent hover:ring-border",
                )}
              >
                {on ? <Check className="absolute right-4 top-4 h-4 w-4 text-sage" /> : null}
                <p className="font-medium">
                  <span aria-hidden className="mr-1.5">{m.emoji}</span>
                  {m.label}
                  {id === "encouraging" ? <span className="ml-2 text-xs text-muted-foreground">Default</span> : null}
                </p>
                <p className="text-sm text-muted-foreground">{m.summary}</p>
                <p className="text-sm italic leading-relaxed text-foreground/70">“{m.example}”</p>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Personality changes how Bloom phrases things — never the numbers, dates or facts behind them.
        </p>
      </section>
    </div>
  );
}

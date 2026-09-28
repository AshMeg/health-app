import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  { name: "Apple Health", what: "Weight, sleep, steps and workouts" },
  { name: "Google Fit", what: "Steps, workouts and heart rate" },
  { name: "Oura", what: "Sleep and recovery" },
  { name: "Garmin", what: "Training and recovery" },
];

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Bloom" },
      { name: "description", content: "Where your Bloom data comes from." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-20">
      <header className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
          Integrations
        </h1>
        <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">
          Where does my data come from?
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Right now everything in Bloom comes from what you log yourself. Connections to other
          services aren't available yet — nothing below is connected.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">Your data</h2>
        <Card className="rounded-3xl border-transparent bg-card shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="font-medium">Logged in Bloom</p>
              <p className="text-sm text-muted-foreground">Everything you add yourself</p>
            </div>
            <span className="rounded-full bg-sage-soft px-3 py-1 text-xs text-sage">In use</span>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">Other services</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <Card key={s.name} className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.what}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  Not available yet
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

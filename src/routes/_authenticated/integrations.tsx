import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adapters } from "@/features/integrations/providers";
import {
  permissionMeta,
  type Availability,
  type ProviderAdapter,
  type ProviderGroup,
} from "@/features/integrations/types";
import { useTimeline } from "@/features/timeline/hooks/use-timeline";

const groups: { id: ProviderGroup; label: string }[] = [
  { id: "platforms", label: "Health platforms" },
  { id: "wearables", label: "Wearables & fitness" },
  { id: "nutrition", label: "Nutrition" },
];

const availabilityLabel: Record<Availability, string> = {
  supported: "Available to connect",
  "needs-app": "Needs the Bloom phone app",
  "needs-provider-access": "Requires provider access",
  "not-supported": "Not currently supported",
};

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Bloom" },
      { name: "description", content: "Bring your health data into Bloom from the apps and devices you use." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { events } = useTimeline();
  const [open, setOpen] = useState<ProviderAdapter | null>(null);
  const manualCount = events.filter((e) => !e.sourceProvider).length;
  const connected = 0; // no provider can connect from the web yet
  const available = adapters.filter((a) => a.availability === "supported").length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 pb-20">
      <header className="space-y-3">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">Integrations</h1>
        <p className="max-w-2xl font-display text-lg leading-snug text-foreground/80">
          Bring your health data into Bloom.
        </p>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Connect the apps and devices you already use. Bloom brings the information together so you
          can see the bigger picture in one place.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-base font-medium text-foreground/80">Your connections</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Connected", connected],
            ["Needs attention", 0],
            ["Available", available],
          ].map(([label, n]) => (
            <Card key={label} className="rounded-3xl border-transparent bg-card shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-display text-2xl">{n}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-3xl border-transparent bg-sage-soft/60 shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="font-medium">Logged in Bloom</p>
              <p className="text-sm text-muted-foreground">
                Everything you add yourself · {manualCount} {manualCount === 1 ? "entry" : "entries"}.
                Manual logging always stays available.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-sage-soft px-3 py-1 text-xs text-sage">In use</span>
          </CardContent>
        </Card>
      </section>

      {groups.map((g) => (
        <section key={g.id} className="space-y-4">
          <h2 className="text-base font-medium text-foreground/80">{g.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {adapters
              .filter((a) => a.group === g.id)
              .map((a) => (
                <Card key={a.id} className="rounded-3xl border-transparent bg-card shadow-none">
                  <CardContent className="space-y-3 p-6">
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-sm text-muted-foreground">{a.tagline}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Status: Not connected · {availabilityLabel[a.availability]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Data Bloom could use: {a.permissions.map((p) => permissionMeta[p].label).join(" · ")}
                    </p>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(a)}>
                      Learn more
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      ))}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        {open && (
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">{open.name}</DialogTitle>
              <DialogDescription>{open.availabilityNote}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium">What Bloom would ask for, and why</p>
                <p className="text-muted-foreground">
                  You'd choose each group separately. Bloom only asks for what it uses.
                </p>
                {open.permissions.map((p) => (
                  <div key={p} className="rounded-2xl bg-muted/50 p-3">
                    <p className="font-medium">{permissionMeta[p].label}</p>
                    <p className="text-muted-foreground">{permissionMeta[p].items}</p>
                    <p className="text-muted-foreground">{permissionMeta[p].why}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground">
                Imported data would become ordinary Bloom records with the source noted, so it shows on
                your Dashboard, pages, goals and Analytics. Disconnecting would stop syncing and never
                delete your history unless you choose to.
              </p>
              <details className="text-muted-foreground">
                <summary className="cursor-pointer">How the data would map</summary>
                <ul className="mt-2 space-y-1">
                  {open.mappings.map((m) => (
                    <li key={m.from}>
                      {m.from} → {m.to}
                    </li>
                  ))}
                </ul>
              </details>
              <Button disabled className="w-full rounded-full">
                Connect isn't available yet
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

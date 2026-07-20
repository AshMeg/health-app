import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bloom — Health analytics for you" },
      {
        name: "description",
        content:
          "Bloom is a modern health analytics platform. Track, understand, and act on your health data.",
      },
      { property: "og:title", content: "Bloom — Health analytics for you" },
      {
        property: "og:description",
        content: "Modern health analytics. Sign in to your dashboard.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Bloom</span>
        </div>
        <nav className="flex items-center gap-2">
          {loading ? null : user ? (
            <Button asChild size="sm">
              <Link to="/dashboard">
                Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ redirect: undefined }}>
                  Get started
                </Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Now in early access
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            Health analytics,{" "}
            <span className="text-primary">designed for clarity.</span>
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            Bring your health data into one place, see what matters, and make
            decisions with confidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to={user ? "/dashboard" : "/auth"}>
                {user ? "Open dashboard" : "Create your account"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-2">
          <Feature
            icon={<LineChart className="h-4 w-4 text-primary" />}
            title="Trends that make sense"
            body="Clear charts and summaries built for humans, not clinicians."
          />
          <Feature
            icon={<ShieldCheck className="h-4 w-4 text-primary" />}
            title="Private by default"
            body="Your data is encrypted and only accessible to you."
          />
        </div>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

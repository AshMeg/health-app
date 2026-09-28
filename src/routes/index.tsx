import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sprout } from "lucide-react";

import heroGarden from "@/assets/landing-garden.jpg";
import { Button } from "@/components/ui/button";
import { seasonFor } from "@/features/garden/model";
import { useAuth } from "@/hooks/use-auth";

const TITLE = "Bloom — Grow into the person you're becoming";
const DESC =
  "Bloom brings together your health, habits, goals and life into one place, helping you understand yourself with clarity, not judgement.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function PrimaryCta({ size = "lg" }: { size?: "lg" | "default" }) {
  const { user, loading } = useAuth();
  if (!loading && user) {
    return (
      <Button asChild size={size} className="gap-2 rounded-full px-7">
        <Link to="/dashboard">
          Open Bloom <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    );
  }
  return (
    <Button asChild size={size} className="gap-2 rounded-full px-7">
      <Link to="/auth">
        Start growing <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}

function Nav() {
  const { user, loading } = useAuth();
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-soft">
            <Sprout className="h-4 w-4 text-sage" />
          </span>
          <span className="font-display text-lg">Bloom</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#garden" className="hover:text-foreground">Your Garden</a>
          <a href="#about" className="hover:text-foreground">About</a>
        </nav>
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/dashboard">Open Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="rounded-full">
                <Link to="/auth">Log in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/auth">Start growing</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------- Small, honest previews of the real Bloom surfaces ---------- */

function InsightPreview() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-sage-soft via-card to-lavender-soft p-6 shadow-soft">
      <p className="text-xs text-muted-foreground">What should I know before today begins?</p>
      <p className="mt-3 font-display text-xl leading-snug">A gentler day might suit you today.</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        You slept a little less than usual and your recovery is lower than your recent average.
      </p>
      <span className="mt-4 inline-block rounded-full bg-card px-3 py-1 text-xs">Why this?</span>
    </div>
  );
}

function HealthPreview() {
  const bars = [52, 60, 48, 70, 66, 74, 71];
  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">Sleep · last 7 days</p>
        <p className="font-display text-lg">7h 38m</p>
      </div>
      <div className="mt-6 flex h-28 items-end gap-2">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-xl bg-sky/60" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        {[
          ["Recovery", "68%"],
          ["Steps", "6,420"],
          ["Weight", "71.4 kg"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-muted/60 px-3 py-2">
            <p className="text-muted-foreground">{l}</p>
            <p className="mt-0.5 font-display text-sm">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsPreview() {
  const goals = [
    { t: "Run my first 5K", p: 64, c: "bg-sky" },
    { t: "Learn about the Late Bronze Age Collapse", p: 40, c: "bg-lavender" },
    { t: "Build a better morning routine", p: 80, c: "bg-sage" },
  ];
  return (
    <div className="space-y-3">
      {goals.map((g) => (
        <div key={g.t} className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-sm font-medium">{g.t}</p>
          <div className="mt-3 h-1.5 rounded-full bg-muted">
            <div className={`h-full rounded-full ${g.c}`} style={{ width: `${g.p}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Page ---------- */

function Landing() {
  const season = seasonFor();

  return (
    <div className={`season-${season} min-h-screen bg-background text-foreground`}>
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-14 text-center sm:px-8 sm:pt-20">
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
            Grow into the person you're becoming.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Bloom brings together your health, habits, goals and life into one place, helping you
            understand yourself with clarity, not judgement.
          </p>
          <div className="mt-9 flex justify-center">
            <PrimaryCta />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-3 sm:px-8">
          <img
            src={heroGarden}
            alt="A calm cottage garden meadow with wildflowers, butterflies and a beehive at golden hour"
            width={1600}
            height={912}
            className="aspect-[16/8] w-full rounded-[2rem] object-cover shadow-soft sm:aspect-[16/7]"
          />
          <p className="mt-3 text-center text-sm text-muted-foreground">A place that grows as you do.</p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mx-auto max-w-4xl px-5 py-28 text-center sm:px-8 sm:py-36">
        <span className="text-2xl" aria-hidden>🌱</span>
        <p className="mt-6 font-display text-2xl leading-snug sm:text-4xl">
          Bloom is here to help you build a healthier relationship with yourself that is beyond
          tracking, but not without tracking.
        </p>
      </section>

      {/* Four parts */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 space-y-28 px-5 pb-28 sm:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm text-sage">Your health</p>
            <h2 className="font-display text-3xl sm:text-4xl">Understand what's happening with your health over time.</h2>
            <p className="leading-relaxed text-muted-foreground">
              Weight, nutrition, sleep, recovery, training, your cycle and your measurements sit
              together — so a single number becomes part of a picture, and the picture shows how
              things are changing.
            </p>
          </div>
          <HealthPreview />
        </div>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <GoalsPreview />
          </div>
          <div className="order-1 space-y-4 md:order-2">
            <p className="text-sm text-lavender">Your goals</p>
            <h2 className="font-display text-3xl sm:text-4xl">Work towards the things that matter to you.</h2>
            <p className="leading-relaxed text-muted-foreground">
              Some goals are measurable — "Lose 5 kg", "Run my first 5K". Others are personal —
              completing a course, building a better morning routine, learning about something that
              fascinates you. Health, learning, relationships, career, travel or a moment in your
              life: Bloom makes room for all of them, with small steps, notes and photos along the way.
            </p>
          </div>
        </div>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm text-sky">Bloom's intelligence</p>
            <h2 className="font-display text-3xl sm:text-4xl">Bloom helps you notice patterns without turning your life into a score.</h2>
            <p className="leading-relaxed text-muted-foreground">
              Instead of simply showing "Sleep: 7h 38m", Bloom looks across what you choose to track
              and helps you see how sleep relates to your recovery, your goals and your day. It
              explains rather than judges, always shows you why, and says so honestly when it's
              still learning. It isn't medical advice — it's a clearer view of you.
            </p>
          </div>
          <InsightPreview />
        </div>
      </section>

      {/* Garden */}
      <section id="garden" className="scroll-mt-24 bg-[linear-gradient(180deg,var(--season-sky-top),var(--season-sky-bottom))] py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Your Garden</p>
            <h2 className="font-display text-3xl sm:text-5xl">What have I grown?</h2>
            <p className="leading-relaxed text-foreground/70">
              Your Garden is a living record of your life and what you've achieved. It changes with
              the seasons, and it's never finished.
            </p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["🌸", "Flowers", "Every goal you complete becomes a flower."],
              ["🦋", "Butterflies", "Life memories flutter through."],
              ["🐝", "Bees & hives", "Your habits keep the hive busy."],
              ["🌳", "Trees", "Each year grows into a tree."],
              ["📖", "Little books", "Every month becomes a book of memories."],
            ].map(([e, t, d]) => (
              <div key={t} className="rounded-3xl bg-card/70 p-6 backdrop-blur">
                <span className="text-2xl" aria-hidden>{e}</span>
                <p className="mt-3 font-medium">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it fits together */}
      <section id="how" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-28 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-sm text-muted-foreground">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl">Not a collection of features. One picture of you.</h2>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-sm">
          {["Health", "Habits", "Goals", "Life"].map((x, i) => (
            <span key={x} className="flex items-center gap-2">
              <span className="rounded-full bg-card px-4 py-2 shadow-soft">{x}</span>
              {i < 3 ? <span className="text-muted-foreground">+</span> : null}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <span>↓</span>
          <span className="rounded-full bg-sage-soft px-5 py-2 font-display text-base text-foreground">Bloom</span>
          <span>↓</span>
          <span>Understanding yourself</span>
          <span>↓</span>
          <span className="text-foreground">Growth</span>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            ["Nutrition + training + recovery", "help you understand progress towards a fitness goal."],
            ["Sleep + recovery + a quick note", "help you understand how today is going."],
            ["Goals + memories + photos", "become part of your Garden."],
          ].map(([a, b]) => (
            <div key={a} className="rounded-3xl bg-card p-6 shadow-soft">
              <p className="font-medium">{a}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">→ {b}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-14 max-w-xl text-center leading-relaxed text-muted-foreground">
          Tracking is the foundation. Goals give direction. Bloom's intelligence helps reveal
          patterns. The Garden helps you remember what you've grown.
        </p>
      </section>

      {/* Founder story */}
      <section id="about" className="scroll-mt-24 bg-muted/40 py-28">
        <div className="mx-auto max-w-2xl space-y-6 px-5 sm:px-8">
          <p className="text-sm text-muted-foreground">Why Bloom exists</p>
          <p className="font-display text-2xl leading-snug sm:text-3xl">
            "Bloom began because I wanted a healthier relationship with myself that was beyond
            tracking, but not without tracking."
          </p>
          <div className="space-y-4 leading-relaxed text-foreground/75">
            <p>
              The numbers mattered — but on their own they never told the whole story. My health
              lived in one place, my goals in another, and the things that actually shaped my days
              weren't recorded anywhere at all.
            </p>
            <p>
              I wanted something that could hold all of it together: health, goals, personal
              context, life experiences, progress and reflection. Something that helped me
              understand myself, without making me feel like a collection of numbers.
            </p>
            <p>That's what Bloom is becoming.</p>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
        <p className="font-display text-3xl leading-snug sm:text-4xl">
          Your health is one of the greatest investments you'll ever make.
        </p>
        <p className="mt-4 text-lg text-muted-foreground">Bloom is here to help you grow it.</p>
        <div className="mt-10 flex justify-center">
          <PrimaryCta />
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Bloom
      </footer>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { GoalsPage } from "@/features/goals/components/goals-page";

type Tab = "goals" | "habits" | "memories";

export const Route = createFileRoute("/_authenticated/goals/")({
  // The open tab and memory live in the address so Back returns to them.
  validateSearch: (s: Record<string, unknown>): { tab?: Tab; memory?: string } => ({
    ...(s.tab === "habits" || s.tab === "memories" ? { tab: s.tab } : {}),
    ...(typeof s.memory === "string" && s.memory ? { memory: s.memory } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Goal Centre — Bloom" },
      { property: "og:title", content: "Goal Centre — Bloom" },
      { property: "og:description", content: "Your goals, habits and memories in one place." },
      {
        name: "description",
        content: "Your goals, habits and memories — where you're going, what you repeat and what you remember.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GoalsPage,
});

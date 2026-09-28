import { createFileRoute } from "@tanstack/react-router";
import { CyclePage } from "@/features/cycle/components/cycle-page";

export const Route = createFileRoute("/_authenticated/cycle")({
  head: () => ({
    meta: [
      { title: "Cycle — Bloom" },
      { name: "description", content: "Where you are in your cycle and what might be coming next, estimated from your own history." },
      { property: "og:title", content: "Cycle — Bloom" },
      { property: "og:description", content: "Your personal cycle history and estimates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CyclePage,
});

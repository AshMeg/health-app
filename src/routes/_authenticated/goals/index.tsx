import { createFileRoute } from "@tanstack/react-router";
import { GoalsPage } from "@/features/goals/components/goals-page";

export const Route = createFileRoute("/_authenticated/goals/")({
  head: () => ({
    meta: [
      { title: "Your Goals — Bloom" },
      {
        name: "description",
        content: "Create, manage and track the goals that support your health and wellbeing.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GoalsPage,
});

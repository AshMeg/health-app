import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/features/analytics/components/analytics-page";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Bloom" },
      { name: "description", content: "Patterns and connections across your health, goals and life." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

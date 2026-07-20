import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vitals" },
      { name: "description", content: "Your health analytics dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PagePlaceholder
      title="Dashboard"
      description="An at-a-glance view of your health signals."
    />
  ),
});

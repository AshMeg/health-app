import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Vitals" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Analytics" description="Trends and insights across your data." />
  ),
});

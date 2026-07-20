import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Bloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Analytics" description="Trends and insights across your data." />
  ),
});

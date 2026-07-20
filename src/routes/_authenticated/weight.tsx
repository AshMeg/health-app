import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_authenticated/weight")({
  head: () => ({ meta: [{ title: "Weight — Vitals" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Weight" description="Track your weight over time." />
  ),
});

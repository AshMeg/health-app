import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({ meta: [{ title: "Training — Bloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Training" description="Plan and review your workouts." />
  ),
});

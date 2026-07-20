import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const Route = createFileRoute("/_authenticated/sleep")({
  head: () => ({ meta: [{ title: "Sleep — Bloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Sleep" description="Understand your sleep patterns." />
  ),
});

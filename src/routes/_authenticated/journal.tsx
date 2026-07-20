import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — Bloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Journal" description="Notes, reflections, and daily entries." />
  ),
});

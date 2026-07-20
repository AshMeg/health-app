import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Bloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Integrations" description="Connect wearables and health services." />
  ),
});

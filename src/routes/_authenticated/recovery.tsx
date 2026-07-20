import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_authenticated/recovery")({
  head: () => ({ meta: [{ title: "Recovery — Vitals" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Recovery" description="Track readiness and recovery." />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vitals" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Settings" description="Manage your workspace preferences." />
  ),
});

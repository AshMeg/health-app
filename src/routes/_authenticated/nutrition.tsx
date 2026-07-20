import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition — Vitals" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PagePlaceholder title="Nutrition" description="Log meals and monitor intake." />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { TimelinePage } from "@/features/timeline/components/timeline-page";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Bloom" },
      {
        name: "description",
        content: "Every log, sync and goal moment in Bloom, in one chronological feed.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TimelinePage,
});

import { createFileRoute } from "@tanstack/react-router";
import { JournalPage } from "@/features/journal/components/journal-page";
import { metricPages } from "@/features/metrics/config";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Bloom" },
      { name: "description", content: metricPages.journal.question },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JournalPage,
});

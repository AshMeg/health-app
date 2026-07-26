import { createFileRoute } from "@tanstack/react-router";
import { MetricPage } from "@/features/metrics/components/metric-page";
import { metricPages } from "@/features/metrics/config";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Bloom" },
      { name: "description", content: metricPages.journal.question },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <MetricPage config={metricPages.journal} />,
});

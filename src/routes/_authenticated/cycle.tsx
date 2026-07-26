import { createFileRoute } from "@tanstack/react-router";
import { MetricPage } from "@/features/metrics/components/metric-page";
import { metricPages } from "@/features/metrics/config";

export const Route = createFileRoute("/_authenticated/cycle")({
  head: () => ({
    meta: [
      { title: "Cycle — Bloom" },
      { name: "description", content: metricPages.cycle.question },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <MetricPage config={metricPages.cycle} />,
});

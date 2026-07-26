import { createFileRoute } from "@tanstack/react-router";
import { MetricPage } from "@/features/metrics/components/metric-page";
import { metricPages } from "@/features/metrics/config";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({
    meta: [
      { title: "Training — Bloom" },
      { name: "description", content: metricPages.training.question },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <MetricPage config={metricPages.training} />,
});

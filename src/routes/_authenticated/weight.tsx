import { createFileRoute } from "@tanstack/react-router";
import { MetricPage } from "@/features/metrics/components/metric-page";
import { metricPages } from "@/features/metrics/config";

export const Route = createFileRoute("/_authenticated/weight")({
  head: () => ({
    meta: [
      { title: "Weight — Bloom" },
      { name: "description", content: metricPages.weight.question },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <MetricPage config={metricPages.weight} />,
});

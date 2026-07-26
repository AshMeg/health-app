import { createFileRoute } from "@tanstack/react-router";
import { MetricPage } from "@/features/metrics/components/metric-page";
import { metricPages } from "@/features/metrics/config";

export const Route = createFileRoute("/_authenticated/measurements")({
  head: () => ({
    meta: [
      { title: "Measurements — Bloom" },
      { name: "description", content: metricPages.measurements.question },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <MetricPage config={metricPages.measurements} />,
});

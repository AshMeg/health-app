import { createFileRoute } from "@tanstack/react-router";
import { MetricPage } from "@/features/metrics/components/metric-page";
import { metricPages } from "@/features/metrics/config";

export const Route = createFileRoute("/_authenticated/sleep")({
  head: () => ({
    meta: [
      { title: "Sleep — Bloom" },
      { name: "description", content: metricPages.sleep.question },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <MetricPage config={metricPages.sleep} />,
});

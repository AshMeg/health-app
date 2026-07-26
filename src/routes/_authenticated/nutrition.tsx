import { createFileRoute } from "@tanstack/react-router";
import { MetricPage } from "@/features/metrics/components/metric-page";
import { metricPages } from "@/features/metrics/config";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition — Bloom" },
      { name: "description", content: metricPages.nutrition.question },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <MetricPage config={metricPages.nutrition} />,
});

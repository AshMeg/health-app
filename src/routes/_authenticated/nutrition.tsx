import { createFileRoute } from "@tanstack/react-router";
import { NutritionPage } from "@/features/nutrition/components/nutrition-page";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition — Bloom" },
      { name: "description", content: "Log what you eat and see how your nutrition adds up over time." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NutritionPage,
});

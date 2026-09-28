import { createFileRoute } from "@tanstack/react-router";
import { GardenPage } from "@/features/garden/components/garden-page";

export const Route = createFileRoute("/_authenticated/garden")({
  // The open book/hive/memory lives in the address, so coming Back from a
  // goal returns you to the exact page of the Garden you left.
  validateSearch: (search: Record<string, unknown>): { view?: string } =>
    typeof search.view === "string" && search.view ? { view: search.view } : {},
  head: () => ({
    meta: [
      { title: "Your Garden — Bloom" },
      {
        name: "description",
        content: "The goals you've completed, kept as flowers, memories and achievements.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GardenPage,
});

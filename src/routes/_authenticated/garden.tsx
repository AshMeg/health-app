import { createFileRoute } from "@tanstack/react-router";
import { GardenPage } from "@/features/garden/components/garden-page";

export const Route = createFileRoute("/_authenticated/garden")({
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

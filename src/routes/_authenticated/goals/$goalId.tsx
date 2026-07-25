import { createFileRoute } from "@tanstack/react-router";
import { GoalDetailPage } from "@/features/goals/components/goal-detail-page";

export const Route = createFileRoute("/_authenticated/goals/$goalId")({
  head: () => ({
    meta: [
      { title: "Goal — Bloom" },
      { name: "description", content: "Progress, notes and updates for one of your Bloom goals." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GoalDetailRoute,
});

function GoalDetailRoute() {
  const { goalId } = Route.useParams();
  return <GoalDetailPage goalId={goalId} />;
}

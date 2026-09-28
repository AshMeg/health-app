import { createFileRoute } from "@tanstack/react-router";
import { HabitDetailPage } from "@/features/habits/components/habit-detail-page";

export const Route = createFileRoute("/_authenticated/goals/habits/$habitId")({
  head: () => ({
    meta: [
      { title: "Habit — Bloom" },
      { name: "description", content: "Your habit, its consistency and history." },
      { property: "og:title", content: "Habit — Bloom" },
      { property: "og:description", content: "Consistency over perfection." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HabitRoute,
});

function HabitRoute() {
  const { habitId } = Route.useParams();
  return <HabitDetailPage habitId={habitId} />;
}

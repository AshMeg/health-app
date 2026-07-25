import { createFileRoute } from "@tanstack/react-router";
import { TodayPage } from "@/features/today/components/today-page";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Today — Bloom" },
      { name: "description", content: "Your daily health snapshot, insight and focus." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TodayRoute,
});

function TodayRoute() {
  const { user } = Route.useRouteContext();
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";
  const firstName = fullName.split(/[\s.]+/)[0];
  const display = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return <TodayPage firstName={display} />;
}

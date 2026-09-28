import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Bloom's one Back button. It always says "Back" and returns to wherever you
 * actually came from. Only when there is no in-app history (fresh tab, shared
 * link) does it fall back to a sensible parent page.
 */
export function BackButton({ fallbackTo }: { fallbackTo: string; fallbackLabel?: string }) {
  const router = useRouter();
  // TanStack records its position in the history stack — index 0 means we
  // landed here directly (fresh tab, refresh or shared link).
  const index = useRouterState({
    select: (s) => (s.location.state as { __TSR_index?: number } | undefined)?.__TSR_index ?? 0,
  });

  if (index <= 0) {
    return (
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 self-start">
        <Link to={fallbackTo}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 gap-1.5 self-start"
      onClick={() => router.history.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}

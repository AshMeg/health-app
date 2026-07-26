import type { ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Context-aware back navigation. If the user arrived here from somewhere else
 * inside Bloom we step back to that exact page; otherwise we fall back to the
 * natural parent of this screen.
 */
export function BackButton({
  fallbackTo,
  fallbackLabel,
  children,
}: {
  fallbackTo: string;
  fallbackLabel: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  // TanStack records its position in the history stack — index 0 means we
  // landed here directly (fresh tab, refresh or shared link).
  const index = useRouterState({
    select: (s) => (s.location.state as { __TSR_index?: number } | undefined)?.__TSR_index ?? 0,
  });
  const canGoBack = index > 0;

  if (!canGoBack) {
    return (
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 self-start">
        <Link to={fallbackTo}>
          <ArrowLeft className="h-4 w-4" />
          {children ?? fallbackLabel}
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

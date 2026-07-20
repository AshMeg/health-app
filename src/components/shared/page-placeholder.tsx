import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function PagePlaceholder({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Card>
        <CardContent className="flex min-h-[240px] items-center justify-center p-8 text-center">
          <div className="max-w-sm text-sm text-muted-foreground">
            {children ?? (
              <>
                <p className="font-medium text-foreground">Coming soon</p>
                <p className="mt-1">
                  This section is a placeholder. Content and interactions will land here.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

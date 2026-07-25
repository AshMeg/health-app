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
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-[1.75rem] leading-tight font-medium sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Card className="rounded-[2rem] border-transparent bg-card shadow-soft">
        <CardContent className="flex min-h-[280px] items-center justify-center p-10 text-center">
          <div className="max-w-sm space-y-2 text-sm leading-relaxed text-muted-foreground">
            {children ?? (
              <>
                <p className="text-base font-medium text-foreground">Coming soon</p>
                <p>This part of Bloom is on its way. It will grow here.</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
